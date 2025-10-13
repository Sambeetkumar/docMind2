# DocMind - PDF Chat & Quiz Application

DocMind is a comprehensive application that allows users to upload PDF documents and interact with them through AI-powered chat sessions and interactive quizzes. Built with React, Vite, Tailwind CSS, Clerk authentication, Supabase backend, and Google Gemini AI.

## Features

### Core Features

- **PDF Upload & Processing**: Upload PDF documents with text extraction
- **AI Chat Interface**: Chat with your PDF documents using Google Gemini AI
- **Interactive Quizzes**: Generate and take quizzes based on PDF content
- **User Authentication**: Secure authentication using Clerk
- **Session History**: View all your chat sessions and quiz results
- **Score Tracking**: Track quiz scores and performance over time

### Additional Features

- **Responsive Design**: Beautiful, modern UI that works on all devices
- **Real-time Chat**: Smooth chat interface with message history
- **Quiz Analytics**: Detailed quiz results with explanations
- **File Validation**: PDF file type and size validation
- **Error Handling**: Comprehensive error handling throughout the app
- **Loading States**: User-friendly loading indicators

## Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Authentication**: Clerk
- **Backend**: Supabase (PostgreSQL)
- **AI**: Google Gemini API
- **PDF Processing**: PDF.js
- **Routing**: React Router DOM
- **Icons**: Lucide React

## Setup Instructions

### 1. Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Clerk account
- Supabase account
- Google AI Studio account (for Gemini API)

### 2. Clone and Install

```bash
git clone <your-repo-url>
cd docMind2
npm install
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory and add your API keys:

```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Clerk Setup

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Create a new application
3. Copy the Publishable Key to your `.env.local` file
4. Configure authentication methods as needed

### 5. Supabase Setup

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Copy the Project URL and anon key to your `.env.local` file
4. Run the SQL schema from `supabase-schema-clerk.sql` in the SQL editor

### 6. Google Gemini Setup

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the API key to your `.env.local` file

### 7. Run the Application

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Database Schema

The application uses the following main tables:

- **pdf_documents**: Stores uploaded PDF files and extracted text
- **chat_sessions**: Stores chat conversations with PDFs
- **quiz_sessions**: Stores generated quizzes
- **quiz_scores**: Stores quiz results and scores

All tables include Row Level Security (RLS) policies to ensure users can only access their own data.

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue in the GitHub repository or contact the development team.

## Future Enhancements

- **Multi-language Support**: Support for multiple languages
- **Advanced Analytics**: More detailed quiz and chat analytics
- **PDF Annotation**: Ability to annotate PDFs
- **Collaborative Features**: Share PDFs and sessions with others
- **Mobile App**: Native mobile application
- **Advanced AI Features**: More sophisticated AI interactions
- **Export Features**: Export chat sessions and quiz results
- **Custom Quiz Settings**: More control over quiz generation
