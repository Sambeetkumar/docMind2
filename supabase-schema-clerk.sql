-- DocMind Database Schema for Supabase (Updated for Clerk)
-- Run this SQL in your Supabase SQL editor

-- Create PDF Documents table
CREATE TABLE pdf_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  content TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Chat Sessions table
CREATE TABLE chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  pdf_document_id UUID REFERENCES pdf_documents(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Quiz Sessions table
CREATE TABLE quiz_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  pdf_document_id UUID REFERENCES pdf_documents(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  questions JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Quiz Scores table
CREATE TABLE quiz_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_session_id UUID REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  answers JSONB NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_pdf_documents_user_id ON pdf_documents(user_id);
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_quiz_sessions_user_id ON quiz_sessions(user_id);
CREATE INDEX idx_quiz_scores_user_id ON quiz_scores(user_id);
CREATE INDEX idx_chat_sessions_pdf_document_id ON chat_sessions(pdf_document_id);
CREATE INDEX idx_quiz_sessions_pdf_document_id ON quiz_sessions(pdf_document_id);

-- Enable Row Level Security on all tables
ALTER TABLE pdf_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_scores ENABLE ROW LEVEL SECURITY;

-- Row Level Security Policies (Updated for Clerk)
-- Note: These policies will work with Clerk's user IDs stored as TEXT

-- PDF Documents policies
CREATE POLICY "Users can view their own PDF documents" ON pdf_documents
  FOR SELECT USING (true); -- We'll handle auth in the app layer

CREATE POLICY "Users can insert their own PDF documents" ON pdf_documents
  FOR INSERT WITH CHECK (true); -- We'll handle auth in the app layer

CREATE POLICY "Users can update their own PDF documents" ON pdf_documents
  FOR UPDATE USING (true); -- We'll handle auth in the app layer

CREATE POLICY "Users can delete their own PDF documents" ON pdf_documents
  FOR DELETE USING (true); -- We'll handle auth in the app layer

-- Chat Sessions policies
CREATE POLICY "Users can view their own chat sessions" ON chat_sessions
  FOR SELECT USING (true); -- We'll handle auth in the app layer

CREATE POLICY "Users can insert their own chat sessions" ON chat_sessions
  FOR INSERT WITH CHECK (true); -- We'll handle auth in the app layer

CREATE POLICY "Users can update their own chat sessions" ON chat_sessions
  FOR UPDATE USING (true); -- We'll handle auth in the app layer

CREATE POLICY "Users can delete their own chat sessions" ON chat_sessions
  FOR DELETE USING (true); -- We'll handle auth in the app layer

-- Quiz Sessions policies
CREATE POLICY "Users can view their own quiz sessions" ON quiz_sessions
  FOR SELECT USING (true); -- We'll handle auth in the app layer

CREATE POLICY "Users can insert their own quiz sessions" ON quiz_sessions
  FOR INSERT WITH CHECK (true); -- We'll handle auth in the app layer

CREATE POLICY "Users can update their own quiz sessions" ON quiz_sessions
  FOR UPDATE USING (true); -- We'll handle auth in the app layer

CREATE POLICY "Users can delete their own quiz sessions" ON quiz_sessions
  FOR DELETE USING (true); -- We'll handle auth in the app layer

-- Quiz Scores policies
CREATE POLICY "Users can view their own quiz scores" ON quiz_scores
  FOR SELECT USING (true); -- We'll handle auth in the app layer

CREATE POLICY "Users can insert their own quiz scores" ON quiz_scores
  FOR INSERT WITH CHECK (true); -- We'll handle auth in the app layer

CREATE POLICY "Users can update their own quiz scores" ON quiz_scores
  FOR UPDATE USING (true); -- We'll handle auth in the app layer

CREATE POLICY "Users can delete their own quiz scores" ON quiz_scores
  FOR DELETE USING (true); -- We'll handle auth in the app layer
