import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MessageCircle,
  HelpCircle,
  Calendar,
  FileText,
  Trophy,
  Trash2,
  Play,
} from "lucide-react";
import { supabase, TABLES } from "../lib/supabase";
import { useUser } from "@clerk/clerk-react";
import { useToast } from "../components/Toast";

export function HistoryPage() {
  const { user } = useUser();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [chatSessions, setChatSessions] = useState([]);
  const [quizSessions, setQuizSessions] = useState([]);
  const [quizScores, setQuizScores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    try {
      // Fetch chat sessions
      const { data: chatData, error: chatError } = await supabase
        .from(TABLES.CHAT_SESSIONS)
        .select(
          `
          *,
          pdf_documents:pdf_document_id (
            filename,
            uploaded_at
          )
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (chatError) throw chatError;

      // Fetch quiz sessions with scores
      const { data: quizData, error: quizError } = await supabase
        .from(TABLES.QUIZ_SESSIONS)
        .select(
          `
          *,
          pdf_documents:pdf_document_id (
            filename,
            uploaded_at
          )
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (quizError) throw quizError;

      // Fetch quiz scores
      const { data: scoresData, error: scoresError } = await supabase
        .from(TABLES.QUIZ_SCORES)
        .select(
          `
          *,
          quiz_sessions:quiz_session_id (
            title,
            pdf_documents:pdf_document_id (
              filename
            )
          )
        `
        )
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false });

      if (scoresError) throw scoresError;

      console.log("Fetched quiz sessions:", quizData);
      console.log("Fetched quiz scores:", scoresData);

      setChatSessions(chatData || []);
      setQuizSessions(quizData || []);
      setQuizScores(scoresData || []);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const handleChatSessionClick = async (session) => {
    try {
      // Fetch the PDF document data
      const { data: pdfData, error: pdfError } = await supabase
        .from(TABLES.PDF_DOCUMENTS)
        .select("*")
        .eq("id", session.pdf_document_id)
        .single();

      if (pdfError) throw pdfError;

      // Navigate to chat page with existing session data
      navigate("/chat", {
        state: {
          pdfData,
          existingSession: session,
        },
      });
    } catch (error) {
      console.error("Error loading chat session:", error);
      showError("Failed to load chat session");
    }
  };

  const handleDeleteChatSession = async (sessionId) => {
    if (!window.confirm("Are you sure you want to delete this chat session?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from(TABLES.CHAT_SESSIONS)
        .delete()
        .eq("id", sessionId);

      if (error) throw error;

      // Remove from local state
      setChatSessions((prev) =>
        prev.filter((session) => session.id !== sessionId)
      );
      success("Chat session deleted successfully");
    } catch (error) {
      console.error("Error deleting chat session:", error);
      showError("Failed to delete chat session");
    }
  };

  const handleShowQuizResults = async (session, score) => {
    try {
      // Fetch the full PDF document data including content
      const { data: fullPdfData, error: pdfError } = await supabase
        .from(TABLES.PDF_DOCUMENTS)
        .select("*")
        .eq("id", session.pdf_document_id)
        .single();

      if (pdfError) throw pdfError;

      // Navigate to quiz results page with the session and score data
      navigate("/quiz-results", {
        state: {
          session,
          score,
          pdfData: fullPdfData,
        },
      });
    } catch (error) {
      console.error("Error loading PDF for quiz results:", error);
      showError("Failed to load PDF for quiz results");
    }
  };

  const handleDeleteQuizSession = async (sessionId) => {
    if (
      !confirm(
        "Are you sure you want to delete this quiz session? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      // Delete quiz scores first (due to foreign key constraint)
      const { error: scoresError } = await supabase
        .from(TABLES.QUIZ_SCORES)
        .delete()
        .eq("quiz_session_id", sessionId);

      if (scoresError) throw scoresError;

      // Delete quiz session
      const { error: sessionError } = await supabase
        .from(TABLES.QUIZ_SESSIONS)
        .delete()
        .eq("id", sessionId);

      if (sessionError) throw sessionError;

      // Update local state
      setQuizSessions((prev) =>
        prev.filter((session) => session.id !== sessionId)
      );
      setQuizScores((prev) =>
        prev.filter((score) => score.quiz_session_id !== sessionId)
      );

      success("Quiz session deleted successfully");
    } catch (error) {
      console.error("Error deleting quiz session:", error);
      showError("Failed to delete quiz session");
    }
  };

  if (isLoading) {
    return (
      <div className="h-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900 overflow-y-auto">
      <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8">
          Your History
        </h1>

        {/* Chat Sessions */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <MessageCircle className="w-6 h-6 mr-2 text-blue-600 dark:text-blue-400" />
            Chat Sessions
          </h2>

          {chatSessions.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
              <MessageCircle className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-300">
                No chat sessions yet. Start chatting with a PDF!
              </p>
              <Link
                to="/"
                className="mt-4 inline-block bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
              >
                Upload PDF
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {chatSessions.map((session) => (
                <div
                  key={session.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 hover:shadow-lg transition-shadow cursor-pointer group relative"
                  onClick={() => handleChatSessionClick(session)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex-1 mr-2">
                      {session.title}
                    </h3>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteChatSession(session.id);
                        }}
                        className="opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                        title="Delete chat session"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 truncate">
                    <FileText className="w-4 h-4 inline mr-1 flex-shrink-0" />
                    <span className="inline-block align-middle">
                      {session.pdf_documents?.filename || "Unknown PDF"}
                    </span>
                  </div>

                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <Calendar className="w-4 h-4 inline mr-1 flex-shrink-0" />
                    <span className="inline-block align-middle">
                      {formatDate(session.created_at)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {session.messages?.length || 0} messages
                    </div>
                    <div className="flex items-center text-blue-600 dark:text-blue-400 text-sm opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <Play className="w-4 h-4 mr-1" />
                      <span className="hidden sm:inline">Continue Chat</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quiz Sessions */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <HelpCircle className="w-6 h-6 mr-2 text-green-600 dark:text-green-400" />
            Quiz Sessions
          </h2>

          {quizSessions.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
              <HelpCircle className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-300">
                No quiz sessions yet. Take a quiz on a PDF!
              </p>
              <Link
                to="/"
                className="mt-4 inline-block bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
              >
                Upload PDF
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {quizSessions.map((session) => {
                const score = quizScores.find(
                  (s) => s.quiz_session_id === session.id
                );
                console.log("Quiz session:", session.id, "Score:", score);
                return (
                  <div
                    key={session.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 group relative flex flex-col"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {session.title}
                      </h3>
                      <div className="flex items-center">
                        <HelpCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 ml-2" />
                        <button
                          onClick={() => handleDeleteQuizSession(session.id)}
                          className="ml-2 text-red-500 hover:text-red-700 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete quiz session"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 truncate">
                      <FileText className="w-4 h-4 inline mr-1 flex-shrink-0" />
                      <span className="inline-block align-middle">
                        {session.pdf_documents?.filename || "Unknown PDF"}
                      </span>
                    </div>

                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1 flex-shrink-0" />
                      <span className="inline-block align-middle">
                        {formatDate(session.created_at)}
                      </span>
                    </div>

                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <HelpCircle className="w-4 h-4 inline mr-1 flex-shrink-0" />
                      <span className="inline-block align-middle">
                        {session.questions?.length || 0} questions
                      </span>
                    </div>

                    {score ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Trophy className="w-4 h-4 mr-1" />
                          <span
                            className={`text-sm font-medium ${getScoreColor(
                              score.score
                            )}`}
                          >
                            Score: {score.score}%
                          </span>
                        </div>
                        <button
                          onClick={() => handleShowQuizResults(session, score)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Show Results
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <HelpCircle className="w-4 h-4 mr-1 text-gray-400" />
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            Not completed
                          </span>
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              // Fetch the full PDF document data including content
                              const { data: fullPdfData, error: pdfError } =
                                await supabase
                                  .from(TABLES.PDF_DOCUMENTS)
                                  .select("*")
                                  .eq("id", session.pdf_document_id)
                                  .single();

                              if (pdfError) throw pdfError;

                              navigate("/quiz", {
                                state: { pdfData: fullPdfData },
                              });
                            } catch (error) {
                              console.error(
                                "Error loading PDF for quiz:",
                                error
                              );
                              showError("Failed to load PDF for quiz");
                            }
                          }}
                          className="text-green-600 hover:text-green-800 text-sm font-medium"
                        >
                          Take Quiz
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quiz Scores Summary */}
        {quizScores.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Trophy className="w-6 h-6 mr-2 text-yellow-600 dark:text-yellow-400" />
              Quiz Scores
            </h2>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              {/* Mobile view */}
              <div className="block sm:hidden">
                <div className="space-y-4">
                  {quizScores.map((score) => (
                    <div
                      key={score.id}
                      className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow"
                    >
                      <div className="mb-2">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {score.quiz_sessions?.title || "Unknown Quiz"}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {score.quiz_sessions?.pdf_documents?.filename ||
                            "Unknown PDF"}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span
                          className={`text-sm font-medium ${getScoreColor(
                            score.score
                          )}`}
                        >
                          {score.score}%
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(score.completed_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop view */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Quiz
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        PDF
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Score
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Completed
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {quizScores.map((score) => (
                      <tr key={score.id}>
                        <td className="px-4 sm:px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                          {score.quiz_sessions?.title || "Unknown Quiz"}
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          <div className="max-w-xs truncate">
                            {score.quiz_sessions?.pdf_documents?.filename ||
                              "Unknown PDF"}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <span
                            className={`text-sm font-medium ${getScoreColor(
                              score.score
                            )}`}
                          >
                            {score.score}%
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(score.completed_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
