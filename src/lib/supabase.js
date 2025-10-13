import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database schema types
export const TABLES = {
  CHAT_SESSIONS: "chat_sessions",
  QUIZ_SESSIONS: "quiz_sessions",
  QUIZ_SCORES: "quiz_scores",
  PDF_DOCUMENTS: "pdf_documents",
};

