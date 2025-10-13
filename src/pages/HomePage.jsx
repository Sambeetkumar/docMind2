import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  FileText,
  AlertCircle,
  MessageCircle,
  HelpCircle,
} from "lucide-react";
import { extractTextFromPDF, validatePDF } from "../lib/pdfUtils";
import { supabase, TABLES } from "../lib/supabase";
import { useUser } from "@clerk/clerk-react";
import { useToast } from "../components/Toast";
import { LoadingSpinner } from "../components/Loading";
import { Dashboard } from "../components/Dashboard";

export function HomePage() {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [error, setError] = useState("");
  const [uploadedPdf, setUploadedPdf] = useState(null);
  const [hasExistingChat, setHasExistingChat] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const navigate = useNavigate();
  const { user } = useUser();
  const { success, error: showError } = useToast();

  // Check for existing chat sessions when PDF is uploaded
  useEffect(() => {
    const checkExistingChat = async () => {
      if (uploadedPdf && user) {
        console.log(
          "HomePage: useEffect checking for existing chats for PDF:",
          uploadedPdf.filename
        );
        try {
          const { data: existingSessions, error } = await supabase
            .from(TABLES.CHAT_SESSIONS)
            .select("*")
            .eq("user_id", user.id)
            .eq("pdf_document_id", uploadedPdf.id)
            .limit(1);

          console.log(
            "HomePage: useEffect found sessions:",
            existingSessions?.length || 0
          );

          if (!error && existingSessions && existingSessions.length > 0) {
            console.log("HomePage: useEffect setting hasExistingChat to true");
            setHasExistingChat(true);
          } else {
            console.log("HomePage: useEffect setting hasExistingChat to false");
            setHasExistingChat(false);
          }
        } catch (error) {
          console.error(
            "HomePage: useEffect error checking for existing chats:",
            error
          );
          setHasExistingChat(false);
        }
      }
    };

    checkExistingChat();
  }, [uploadedPdf, user]);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      try {
        validatePDF(selectedFile);
        setFile(selectedFile);
        setError("");
      } catch (err) {
        setError(err.message);
        setFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a PDF file");
      return;
    }

    setIsUploading(true);
    setError("");
    setUploadStatus("Extracting text from PDF...");

    try {
      // Extract text from PDF
      setUploadStatus("Processing PDF content...");
      console.log("Starting PDF upload process...");

      // Create a promise that updates status during OCR
      const extractionPromise = extractTextFromPDF(file);

      // Show different status messages based on processing time
      const statusTimeout = setTimeout(() => {
        setUploadStatus(
          "Processing images with OCR... This may take a moment."
        );
      }, 3000);

      const pdfText = await extractionPromise;
      clearTimeout(statusTimeout);

      console.log("PDF text extracted successfully, length:", pdfText.length);

      // Update status based on extraction method
      if (pdfText.length > 1000) {
        setUploadStatus("Text extraction completed successfully!");
      } else {
        setUploadStatus(
          "OCR extraction completed! Text extracted from images."
        );
      }

      // Save PDF document to Supabase
      setUploadStatus("Saving to database...");
      const { data: pdfData, error: pdfError } = await supabase
        .from(TABLES.PDF_DOCUMENTS)
        .insert({
          user_id: user.id,
          filename: file.name,
          content: pdfText,
          file_size: file.size,
          uploaded_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (pdfError) {
        console.error("Supabase error:", pdfError);
        throw pdfError;
      }

      console.log("PDF saved to database successfully");
      setUploadedPdf(pdfData);
      setFile(null);
      setUploadStatus("");

      // Clear the file input
      const fileInput = document.getElementById("pdf-upload");
      if (fileInput) fileInput.value = "";

      success("PDF uploaded and processed successfully!");
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.message);
      showError(err.message);
      setUploadStatus("");
    } finally {
      setIsUploading(false);
    }
  };

  const handleChat = async () => {
    if (uploadedPdf && !isStartingChat) {
      console.log("HomePage: handleChat called for PDF:", uploadedPdf.filename);
      setIsStartingChat(true);
      try {
        // Check if there's already an existing chat session for this PDF
        console.log("HomePage: Checking for existing sessions...");
        const { data: existingSessions, error } = await supabase
          .from(TABLES.CHAT_SESSIONS)
          .select("*")
          .eq("user_id", user.id)
          .eq("pdf_document_id", uploadedPdf.id)
          .order("created_at", { ascending: false })
          .limit(1);

        if (error) {
          console.error(
            "HomePage: Error checking for existing sessions:",
            error
          );
          // If there's an error, just create a new session
          console.log(
            "HomePage: Navigating to chat with new session (error fallback)"
          );
          navigate("/chat", { state: { pdfData: uploadedPdf } });
          return;
        }

        console.log(
          "HomePage: Found existing sessions:",
          existingSessions?.length || 0
        );

        if (existingSessions && existingSessions.length > 0) {
          // Use existing session
          console.log(
            "HomePage: Using existing session:",
            existingSessions[0].id
          );
          setHasExistingChat(true);
          navigate("/chat", {
            state: {
              pdfData: uploadedPdf,
              existingSession: existingSessions[0],
            },
          });
        } else {
          // Create new session
          console.log("HomePage: No existing session found, creating new one");
          setHasExistingChat(false);
          navigate("/chat", { state: { pdfData: uploadedPdf } });
        }
      } catch (error) {
        console.error("Error in handleChat:", error);
        // Fallback to creating new session
        navigate("/chat", { state: { pdfData: uploadedPdf } });
      } finally {
        setIsStartingChat(false);
      }
    }
  };

  const handleQuiz = () => {
    if (uploadedPdf) {
      navigate("/quiz", { state: { pdfData: uploadedPdf } });
    }
  };

  return (
    <div className="h-full bg-gray-50 overflow-y-auto">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to DocMind
          </h1>
          <p className="text-xl text-gray-600">
            Upload a PDF document to start chatting or take an interactive quiz
          </p>
        </div>

        {/* Dashboard Stats */}
        <div className="mb-8">
          <Dashboard />
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            Upload Your PDF
          </h2>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors">
            <input
              id="pdf-upload"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="pdf-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <Upload className="w-12 h-12 text-gray-400 mb-4" />
              <span className="text-lg font-medium text-gray-700 mb-2">
                Click to upload PDF
              </span>
              <span className="text-sm text-gray-500">
                or drag and drop your PDF here
              </span>
            </label>
          </div>

          {file && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <FileText className="w-5 h-5 text-primary-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">
                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center mx-auto"
            >
              {isUploading ? (
                <>
                  <LoadingSpinner size="small" text="" />
                  <span className="ml-2">
                    {uploadStatus || "Processing..."}
                  </span>
                </>
              ) : (
                "Upload PDF"
              )}
            </button>
            {uploadStatus && (
              <p className="mt-2 text-sm text-gray-600">{uploadStatus}</p>
            )}
          </div>
        </div>

        {uploadedPdf && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
              PDF Ready!
            </h2>
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleChat}
                disabled={isStartingChat}
                className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                {isStartingChat
                  ? "Loading..."
                  : hasExistingChat
                  ? "Continue Chat"
                  : "Start Chat"}
              </button>
              <button
                onClick={handleQuiz}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center"
              >
                <HelpCircle className="w-5 h-5 mr-2" />
                Take Quiz
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
