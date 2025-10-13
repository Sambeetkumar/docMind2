import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  RedirectToSignIn,
} from "@clerk/clerk-react";
import { Navigation } from "./components/Navigation";
import { HomePage } from "./pages/HomePage";
import { ChatPage } from "./pages/ChatPage";
import { QuizPage } from "./pages/QuizPage";
import { QuizResultsPage } from "./pages/QuizResultsPage";
import { HistoryPage } from "./pages/HistoryPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ToastProvider } from "./components/Toast";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

export function App() {
  return (
    <ErrorBoundary>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <ToastProvider>
          <SignedIn>
            <Router>
              <div className="h-screen bg-gray-50 flex flex-col">
                <Navigation />
                <div className="flex-1 overflow-hidden">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/chat" element={<ChatPage />} />
                    <Route path="/quiz" element={<QuizPage />} />
                    <Route path="/quiz-results" element={<QuizResultsPage />} />
                    <Route path="/history" element={<HistoryPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                  </Routes>
                </div>
              </div>
            </Router>
          </SignedIn>
          <SignedOut>
            <RedirectToSignIn />
          </SignedOut>
        </ToastProvider>
      </ClerkProvider>
    </ErrorBoundary>
  );
}
