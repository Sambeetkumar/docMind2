import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { apiFetch } from '../lib/api';

export default function Quiz() {
  const { id } = useParams();
  const { getToken } = useAuth();
  const [quiz, setQuiz] = useState(null); // quiz JSON payload
  const [quizRow, setQuizRow] = useState(null); // full row including id
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await apiFetch('/api/quiz/generate', { method: 'POST', token, body: { documentId: Number(id), numQuestions: 5 } });
      setQuiz(res.quiz.quiz_json);
      setQuizRow(res.quiz);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function submit() {
    setLoading(true);
    try {
      const token = await getToken();
      const ansArray = (quiz?.questions || []).map((_, idx) => answers[idx] ?? -1);
      const res = await apiFetch('/api/quiz/submit', { method: 'POST', token, body: { quizId: quizRow?.id, answers: ansArray } });
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { generate(); }, []);

  if (!quiz) return <div><button onClick={generate} className="px-3 py-2 bg-indigo-600 text-white rounded">{loading ? 'Generating...' : 'Generate Quiz'}</button></div>;

  return (
    <div className="space-y-4">
      {(quiz.questions || []).map((q, idx) => (
        <div key={idx} className="p-4 bg-white border rounded">
          <div className="font-medium">{idx + 1}. {q.question}</div>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
            {q.options.map((opt, i) => (
              <label key={i} className={`border rounded p-2 flex items-center gap-2 ${answers[idx] === i ? 'bg-indigo-50 border-indigo-400' : ''}`}>
                <input type="radio" name={`q-${idx}`} checked={answers[idx] === i} onChange={() => setAnswers((a) => ({ ...a, [idx]: i }))} />
                <span>{String.fromCharCode(65 + i)}. {opt}</span>
              </label>
            ))}
          </div>
        </div>
      ))}

      <button onClick={submit} disabled={loading} className="px-3 py-2 bg-green-600 text-white rounded">{loading ? 'Submitting...' : 'Submit'}</button>

      {result && (
        <div className="p-4 bg-white border rounded">
          <div className="font-semibold">Score: {result.score}%</div>
          <div>Correct: {result.correct} / {result.total}</div>
        </div>
      )}
    </div>
  );
}
