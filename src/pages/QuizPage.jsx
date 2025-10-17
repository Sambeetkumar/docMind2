import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { generateQuiz } from "../lib/gemini";
import { supabase, TABLES } from "../lib/supabase";
import { useUser } from "@clerk/clerk-react";

export function QuizPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();
  const initializedRef = useRef(false);

  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pdfData = location.state?.pdfData;

  useEffect(() => {
    if (!pdfData) {
      navigate("/");
      return;
    }

    // Prevent double initialization in React.StrictMode
    if (initializedRef.current) {
      console.log("QuizPage: Already initialized, skipping");
      return;
    }

    console.log("QuizPage useEffect triggered");
    console.log("pdfData:", pdfData.filename);

    initializedRef.current = true;
    generateQuizData();
  }, [pdfData, navigate]);

  const generateQuizData = async () => {
    setIsLoading(true);
    try {
      const quizData = await generateQuiz(pdfData.content, "medium", 10);
      setQuiz(quizData);

      // Create quiz session in database
      const { data, error } = await supabase
        .from(TABLES.QUIZ_SESSIONS)
        .insert({
          user_id: user.id,
          pdf_document_id: pdfData.id,
          title: quizData.title,
          questions: quizData.questions,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      setSessionId(data.id);
    } catch (error) {
      console.error("Error generating quiz:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (questionId, answerIndex) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answerIndex,
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleSubmitQuiz();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    // Prevent multiple submissions
    if (isSubmitting) {
      console.log(
        "Quiz submission already in progress, ignoring duplicate call"
      );
      return;
    }

    setIsSubmitting(true);
    console.log("Submitting quiz for session:", sessionId);

    try {
      let correctAnswers = 0;
      const results = quiz.questions.map((question) => {
        const userAnswer = selectedAnswers[question.id];
        const isCorrect = userAnswer === question.correctAnswer;
        if (isCorrect) correctAnswers++;

        return {
          questionId: question.id,
          userAnswer,
          correctAnswer: question.correctAnswer,
          isCorrect,
        };
      });

      const finalScore = Math.round(
        (correctAnswers / quiz.questions.length) * 100
      );

      // Save quiz score to database
      if (sessionId) {
        const { error } = await supabase.from(TABLES.QUIZ_SCORES).insert({
          quiz_session_id: sessionId,
          user_id: user.id,
          score: finalScore,
          answers: results,
          completed_at: new Date().toISOString(),
        });

        if (error) {
          console.error("Error saving quiz score:", error);
          throw error;
        }

        console.log("Quiz score saved successfully for session:", sessionId);
      }

      // Navigate to results page
      navigate("/quiz-results", {
        state: {
          session: { ...quiz, id: sessionId },
          score: { score: finalScore, answers: results },
          pdfData,
        },
      });
    } catch (error) {
      console.error("Error submitting quiz:", error);
      setIsSubmitting(false); // Reset on error so user can retry
    }
  };

  if (!pdfData) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="h-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Generating quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="h-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300">
            Failed to generate quiz. Please try again.
          </p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const currentQ = quiz.questions[currentQuestion];

  return (
    <div className="min-h-screen sm:h-full bg-gray-50 dark:bg-gray-900 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-0 sm:px-4 py-0 sm:py-4 h-full">
        <div className="bg-white dark:bg-gray-800 sm:rounded-lg shadow-lg p-4 sm:p-6 md:p-8 min-h-screen sm:min-h-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 space-y-4 sm:space-y-0">
            <button
              onClick={() => navigate("/")}
              className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span className="hidden sm:inline">Back to Home</span>
              <span className="sm:hidden">Back</span>
            </button>
            <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              Question {currentQuestion + 1} of {quiz.questions.length}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${
                    ((currentQuestion + 1) / quiz.questions.length) * 100
                  }%`,
                }}
              ></div>
            </div>
          </div>

          {/* Question */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">
              {currentQ.question}
            </h2>

            <div className="space-y-2 sm:space-y-3">
              {currentQ.options.map((option, index) => (
                <label
                  key={index}
                  className={`block p-3 sm:p-4 border rounded-lg cursor-pointer transition-colors text-sm sm:text-base ${
                    selectedAnswers[currentQ.id] === index
                      ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                      : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQ.id}`}
                    value={index}
                    checked={selectedAnswers[currentQ.id] === index}
                    onChange={() => handleAnswerSelect(currentQ.id, index)}
                    className="sr-only"
                  />
                  <span className="text-gray-900 dark:text-white">
                    {option}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between gap-4">
            <button
              onClick={handlePreviousQuestion}
              disabled={currentQuestion === 0}
              className="flex-1 sm:flex-none bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 sm:px-6 py-3 rounded-lg text-sm sm:text-base font-medium hover:bg-gray-400 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
            >
              Previous
            </button>

            <button
              onClick={handleNextQuestion}
              disabled={
                selectedAnswers[currentQ.id] === undefined || isSubmitting
              }
              className="flex-1 sm:flex-none bg-primary-600 text-white px-4 sm:px-6 py-3 rounded-lg text-sm sm:text-base font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
            >
              {isSubmitting
                ? "Submitting..."
                : currentQuestion === quiz.questions.length - 1
                ? "Submit Quiz"
                : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
