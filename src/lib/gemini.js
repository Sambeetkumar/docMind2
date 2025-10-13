import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error("Missing Gemini API Key");
}

const genAI = new GoogleGenerativeAI(API_KEY);

export const generateChatResponse = async (
  pdfText,
  userMessage,
  chatHistory = []
) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
    You are an AI assistant that helps users understand and discuss PDF documents.
    
    PDF Content:
    ${pdfText}
    
    Previous conversation:
    ${chatHistory.map((msg) => `${msg.role}: ${msg.content}`).join("\n")}
    
    User's current question: ${userMessage}
    
    Please provide a helpful response based on the PDF content. Use markdown formatting to make your response more readable:
    - Use **bold** for emphasis
    - Use *italics* for subtle emphasis
    - Use \`code\` for technical terms or code snippets
    - Use bullet points (-) for lists
    - Use numbered lists (1.) for steps
    - Use > blockquotes for important information
    - Use ### headings for sections
    
    If the question is not related to the PDF, politely redirect the conversation back to the document.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating chat response:", error);
    throw error;
  }
};

export const generateQuiz = async (
  pdfText,
  difficulty = "medium",
  numQuestions = 10
) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
    Generate a ${difficulty} difficulty quiz with ${numQuestions} questions based on the following PDF content.
    
    PDF Content:
    ${pdfText}
    
    IMPORTANT: You must respond with ONLY valid JSON in the following format. Do not include any text before or after the JSON:
    {
      "title": "Quiz Title",
      "questions": [
        {
          "id": 1,
          "question": "Question text",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": 0,
          "explanation": "Explanation for the correct answer"
        }
      ]
    }
    
    Make sure the questions test understanding of the key concepts in the PDF.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log("Raw Gemini response:", text);

    // Try multiple approaches to extract JSON
    let quizData = null;

    // First, try to parse the entire response as JSON
    try {
      quizData = JSON.parse(text.trim());
    } catch (e) {
      console.log("Direct JSON parse failed, trying regex extraction");

      // Try to extract JSON using regex - look for the first complete JSON object
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          quizData = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          console.error("JSON parse error:", parseError);
          console.log("Extracted text:", jsonMatch[0]);
        }
      }
    }

    if (
      quizData &&
      quizData.title &&
      quizData.questions &&
      Array.isArray(quizData.questions)
    ) {
      // Validate the quiz structure
      const validQuestions = quizData.questions.filter(
        (q) =>
          q.id &&
          q.question &&
          q.options &&
          Array.isArray(q.options) &&
          q.options.length >= 2 &&
          typeof q.correctAnswer === "number"
      );

      if (validQuestions.length > 0) {
        quizData.questions = validQuestions;
        return quizData;
      }
    }

    // If we get here, the response was malformed
    console.error("Invalid quiz response structure:", quizData);
    throw new Error(
      `Could not parse quiz JSON from response. Raw response: ${text.substring(
        0,
        500
      )}...`
    );
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw error;
  }
};
