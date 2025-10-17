import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Send, ArrowLeft, Bot, User } from "lucide-react";
import { generateChatResponse } from "../lib/gemini";
import { supabase, TABLES } from "../lib/supabase";
import { useUser } from "@clerk/clerk-react";
import { MarkdownViewer } from "../components/MarkdownViewer";

export function ChatPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const initializedRef = useRef(false);

  const pdfData = location.state?.pdfData;
  const existingSession = location.state?.existingSession;

  useEffect(() => {
    if (!pdfData) {
      navigate("/");
      return;
    }

    // Prevent double initialization in React.StrictMode
    if (initializedRef.current) {
      console.log("ChatPage: Already initialized, skipping");
      return;
    }

    console.log("ChatPage useEffect triggered");
    console.log("existingSession:", existingSession);
    console.log("pdfData:", pdfData.filename);

    initializedRef.current = true;

    if (existingSession) {
      // Load existing chat session
      console.log("Loading existing session");
      loadExistingSession();
    } else {
      // Initialize new chat session
      console.log("Initializing new session");
      initializeChatSession();
    }
  }, [pdfData, existingSession, navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadExistingSession = async () => {
    try {
      console.log("Loading existing chat session:", existingSession.id);
      console.log(
        "Existing messages count:",
        existingSession.messages?.length || 0
      );
      setSessionId(existingSession.id);
      setMessages(existingSession.messages || []);
    } catch (error) {
      console.error("Error loading existing session:", error);
    }
  };

  const initializeChatSession = async () => {
    try {
      console.log("Creating new chat session for PDF:", pdfData.filename);

      const { data, error } = await supabase
        .from(TABLES.CHAT_SESSIONS)
        .insert({
          user_id: user.id,
          pdf_document_id: pdfData.id,
          title: `Chat about ${pdfData.filename}`,
          messages: [],
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      console.log("Chat session created with ID:", data.id);
      setSessionId(data.id);

      // Add welcome message
      const welcomeMessage = {
        id: 1,
        role: "assistant",
        content: `Hello! I'm ready to help you understand "${pdfData.filename}". What would you like to know about this document?`,
        timestamp: new Date().toISOString(),
      };

      setMessages([welcomeMessage]);

      // Save welcome message to database
      await supabase
        .from(TABLES.CHAT_SESSIONS)
        .update({
          messages: [welcomeMessage],
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.id);
    } catch (error) {
      console.error("Error initializing chat session:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      role: "user",
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const chatHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await generateChatResponse(
        pdfData.content,
        inputMessage,
        chatHistory
      );

      const assistantMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: response,
        timestamp: new Date().toISOString(),
      };

      const updatedMessages = [...messages, userMessage, assistantMessage];
      setMessages(updatedMessages);

      // Save messages to database
      if (sessionId) {
        await supabase
          .from(TABLES.CHAT_SESSIONS)
          .update({
            messages: updatedMessages,
            updated_at: new Date().toISOString(),
          })
          .eq("id", sessionId);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!pdfData) {
    return null;
  }

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900">
      <div className="h-full max-w-4xl mx-auto sm:px-4 sm:py-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => navigate("/")}
              className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Home
            </button>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Chat: {pdfData.filename}
            </h2>
            <div></div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-2xl px-4 py-3 rounded-lg break-words overflow-hidden ${
                    message.role === "user"
                      ? "bg-primary-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
                  }`}
                >
                  <div className="flex items-start">
                    {message.role === "assistant" && (
                      <Bot className="w-4 h-4 mr-2 mt-1 flex-shrink-0" />
                    )}
                    {message.role === "user" && (
                      <User className="w-4 h-4 mr-2 mt-1 flex-shrink-0" />
                    )}
                    <div className="text-sm flex-1 min-w-0">
                      {message.role === "assistant" ? (
                        <MarkdownViewer
                          content={message.content}
                          className="prose prose-sm max-w-none break-words"
                        />
                      ) : (
                        <div className="whitespace-pre-wrap break-words">
                          {message.content}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                  <div className="flex items-center">
                    <Bot className="w-4 h-4 mr-2" />
                    <div className="text-sm">Thinking...</div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask a question about the PDF..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
