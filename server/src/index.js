import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '@clerk/backend';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
app.use(cors());

// Clerk webhook placeholder before json parser if needed
app.post('/webhooks/clerk', express.raw({ type: 'application/json' }), (req, res) => {
  return res.status(200).send('ok');
});

app.use(express.json({ limit: '5mb' }));

const port = process.env.PORT || 4000;

// Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false },
});

const pdfBucket = process.env.SUPABASE_BUCKET_PDFS || 'pdfs';

async function ensureBucket() {
  try {
    await supabase.storage.createBucket(pdfBucket, { public: true });
  } catch (e) {
    // ignore if exists
  }
}
ensureBucket();

// Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');

// Auth middleware
async function requireAuth(req, res, next) {
  try {
    const hdr = req.headers.authorization || '';
    const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Missing token' });
    const verified = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
    req.auth = { userId: verified.sub };
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Multer
const upload = multer({ storage: multer.memoryStorage() });

// Health
app.get('/health', (_req, res) => res.json({ ok: true }));

// List documents
app.get('/api/documents', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('documents')
    .select('id, file_name, file_url, created_at')
    .eq('user_id', req.auth.userId)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ documents: data });
});

// Upload PDF
app.post('/api/upload', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const fileBuffer = req.file.buffer;
    const fileName = `${Date.now()}_${req.file.originalname}`;

    const { error: uploadError } = await supabase.storage
      .from(pdfBucket)
      .upload(fileName, fileBuffer, { contentType: req.file.mimetype, upsert: false });
    if (uploadError) return res.status(500).json({ error: uploadError.message });

    const { data: publicUrlData } = supabase.storage.from(pdfBucket).getPublicUrl(fileName);
    const publicUrl = publicUrlData?.publicUrl;

    const parsed = await pdfParse(fileBuffer);
    const textContent = parsed?.text || '';

    const { data: docInsert, error: docError } = await supabase
      .from('documents')
      .insert({ user_id: req.auth.userId, file_name: fileName, file_url: publicUrl, text_content: textContent })
      .select()
      .single();
    if (docError) return res.status(500).json({ error: docError.message });

    res.json({ document: docInsert });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Chat
app.post('/api/chat', requireAuth, async (req, res) => {
  try {
    const { documentId, messages } = req.body;
    const { data: doc, error } = await supabase
      .from('documents')
      .select('id, user_id, text_content')
      .eq('id', documentId)
      .single();
    if (error || !doc) return res.status(404).json({ error: 'Document not found' });
    if (doc.user_id !== req.auth.userId) return res.status(403).json({ error: 'Forbidden' });

    const prompt = `You are a helpful assistant. Only use the following document content to answer.\n\nDocument Content:\n"""${doc.text_content}\n"""\n\nChat History:\n${(messages || [])
      .map((m) => `${m.role?.toUpperCase()}: ${m.content}`)
      .join('\n')}\n\nASSISTANT:`;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    await supabase.from('chats').insert({ user_id: req.auth.userId, document_id: documentId, messages, response: text });

    res.json({ reply: text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Quiz generate
app.post('/api/quiz/generate', requireAuth, async (req, res) => {
  try {
    const { documentId, numQuestions = 5 } = req.body;
    const { data: doc, error } = await supabase
      .from('documents')
      .select('id, user_id, text_content')
      .eq('id', documentId)
      .single();
    if (error || !doc) return res.status(404).json({ error: 'Document not found' });
    if (doc.user_id !== req.auth.userId) return res.status(403).json({ error: 'Forbidden' });

    const prompt = `Generate a JSON object: {"questions": [{"question": string, "options": [string, string, string, string], "correctIndex": 0-3}, ...]}. Use only the document content. Questions: ${numQuestions}. Document:\n"""${doc.text_content}"""`;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const raw = result.response.text();
    const cleaned = raw.replace(/^```(json)?/i, '').replace(/```$/i, '').trim();

    let quiz;
    try { quiz = JSON.parse(cleaned); } catch { quiz = { questions: [] }; }

    const { data: quizRow, error: quizErr } = await supabase
      .from('quizzes')
      .insert({ user_id: req.auth.userId, document_id: documentId, quiz_json: quiz })
      .select()
      .single();
    if (quizErr) return res.status(500).json({ error: quizErr.message });

    res.json({ quiz: quizRow });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Quiz submit
app.post('/api/quiz/submit', requireAuth, async (req, res) => {
  try {
    const { quizId, answers } = req.body;
    const { data: quizRow, error } = await supabase
      .from('quizzes')
      .select('id, user_id, quiz_json')
      .eq('id', quizId)
      .single();
    if (error || !quizRow) return res.status(404).json({ error: 'Quiz not found' });
    if (quizRow.user_id !== req.auth.userId) return res.status(403).json({ error: 'Forbidden' });

    const questions = quizRow.quiz_json?.questions || [];
    let correct = 0;
    questions.forEach((q, i) => { if (answers?.[i] === q.correctIndex) correct += 1; });
    const score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;

    await supabase.from('quiz_attempts').insert({ user_id: req.auth.userId, quiz_id: quizId, answers, score });

    res.json({ total: questions.length, correct, score });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// History endpoints
app.get('/api/history/chats', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('chats')
    .select('id, document_id, messages, response, created_at')
    .eq('user_id', req.auth.userId)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ chats: data });
});

app.get('/api/history/quizzes', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .select('id, quiz_id, score, answers, created_at')
    .eq('user_id', req.auth.userId)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ attempts: data });
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
