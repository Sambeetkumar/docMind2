import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut, SignIn, SignUp, UserButton, useAuth } from '@clerk/clerk-react';
import './index.css';
import Dashboard from './pages/Dashboard.jsx';
import Upload from './pages/Upload.jsx';
import DocumentView from './pages/DocumentView.jsx';
import Chat from './pages/Chat.jsx';
import Quiz from './pages/Quiz.jsx';
import History from './pages/History.jsx';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function ProtectedRoute({ children }) {
  const { isSignedIn } = useAuth();
  if (!isSignedIn) return <Navigate to="/sign-in" replace />;
  return children;
}

function AppShell() {
  return (
    <div className="min-h-screen">
      <header className="border-b bg-white">
        <div className="max-w-5xl mx-auto p-4 flex items-center justify-between">
          <a href="/" className="font-semibold">DocMind</a>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4">
        <Routes>
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
          <Route path="/doc/:id" element={<ProtectedRoute><DocumentView /></ProtectedRoute>} />
          <Route path="/chat/:id" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/quiz/:id" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/sign-in" element={<SignIn signUpUrl="/sign-up" />} />
          <Route path="/sign-up" element={<SignUp signInUrl="/sign-in" />} />
        </Routes>
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider publishableKey={clerkPubKey} signInUrl="/sign-in" signUpUrl="/sign-up">
      <BrowserRouter>
        <SignedIn>
          <AppShell />
        </SignedIn>
        <SignedOut>
          <Routes>
            <Route path="/sign-in" element={<SignIn signUpUrl="/sign-up" />} />
            <Route path="/sign-up" element={<SignUp signInUrl="/sign-in" />} />
            <Route path="*" element={<Navigate to="/sign-in" replace />} />
          </Routes>
        </SignedOut>
      </BrowserRouter>
    </ClerkProvider>
  </StrictMode>
);
