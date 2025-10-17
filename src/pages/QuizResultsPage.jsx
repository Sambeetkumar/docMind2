import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, XCircle, Download } from "lucide-react";
import { jsPDF } from "jspdf";

export function QuizResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const { session, score, pdfData } = location.state || {};

  const handleSavePDF = () => {
    const doc = new jsPDF();
    let yPos = 20;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const lineHeight = 7;
    const contentWidth = pageWidth - margin * 2;

    // Helper function to add text with word wrap
    const addWrappedText = (text, y, fontSize = 12, isBold = false) => {
      doc.setFontSize(fontSize);
      doc.setFont("helvetica", isBold ? "bold" : "normal");

      const lines = doc.splitTextToSize(text, contentWidth);
      doc.text(lines, margin, y);
      return lines.length * lineHeight;
    };

    // Add Quiz Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Quiz Results", margin, yPos);
    yPos += 15;

    // Add Score
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(`Score: ${score.score}%`, margin, yPos);
    yPos += 15;

    // Add PDF Title
    doc.setFontSize(14);
    doc.text(`Document: ${pdfData.filename}`, margin, yPos);
    yPos += 15;

    // Questions and Answers
    session.questions.forEach((question, index) => {
      const userAnswer = score.answers.find(
        (a) => a.questionId === question.id
      );
      const isCorrect = userAnswer?.isCorrect;

      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      // Question
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      const questionText = `Question ${index + 1}: ${question.question}`;
      yPos += addWrappedText(questionText, yPos, 12, true);
      yPos += 5;

      // Options
      doc.setFont("helvetica", "normal");
      question.options.forEach((option, optIndex) => {
        const isUserAnswer = userAnswer?.userAnswer === optIndex;
        const isCorrectAnswer = question.correctAnswer === optIndex;
        let optionText = `${String.fromCharCode(65 + optIndex)}) ${option}`;

        if (isUserAnswer) {
          optionText += " (Your Answer)";
          if (isCorrect) {
            doc.setTextColor(0, 128, 0);
          } else {
            doc.setTextColor(255, 0, 0);
          }
        } else if (isCorrectAnswer && !isCorrect) {
          optionText += " (Correct Answer)";
          doc.setTextColor(0, 128, 0);
        }

        yPos += addWrappedText(optionText, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 2;
      });

      // Explanation
      if (question.explanation) {
        yPos += 3;
        doc.setFont("helvetica", "italic");
        doc.setTextColor(88, 88, 88);
        yPos += addWrappedText(`Explanation: ${question.explanation}`, yPos);
        doc.setTextColor(0, 0, 0);
      }

      yPos += 10;
    });

    try {
      // Save the PDF
      const fileName = `quiz-results-${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("Error saving PDF:", error);
    }
  };

  if (!session || !score) {
    return (
      <div className="h-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300">
            No quiz results found.
          </p>
          <button
            onClick={() => navigate("/history")}
            className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
          >
            Back to History
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900 overflow-y-auto">
      <div className="max-w-4xl mx-auto sm:px-4 sm:py-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => navigate("/history")}
              className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to History
            </button>
            <div></div>
          </div>

          {/* Score Display */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Quiz Complete!
            </h1>
            <div className="text-6xl font-bold text-primary-600 dark:text-primary-400 mb-2">
              {score.score}%
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Your Score
            </p>
          </div>

          {/* Quiz Results */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Quiz Results
            </h2>
            <div className="space-y-4">
              {session.questions.map((question, index) => {
                const userAnswer = score.answers.find(
                  (a) => a.questionId === question.id
                );
                const isCorrect = userAnswer?.isCorrect;

                return (
                  <div
                    key={question.id}
                    className="text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-start mb-2">
                      {isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-1" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 mr-2 mt-1" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          Question {index + 1}: {question.question}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Your answer:{" "}
                          {question.options[userAnswer?.userAnswer] ||
                            "Not answered"}
                        </p>
                        {!isCorrect && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Correct answer:{" "}
                            {question.options[question.correctAnswer]}
                          </p>
                        )}
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Explanation: {question.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={handleSavePDF}
              className="bg-gray-600 dark:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors flex items-center"
            >
              <Download className="w-5 h-5 mr-2" />
              Save PDF
            </button>
            <button
              onClick={() => navigate("/quiz", { state: { pdfData } })}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              Retake Quiz
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
