import { GoogleGenAI } from "@google/genai";
import * as pdfjsLib from "pdfjs-dist";

// Use a local worker file from the public directory
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

/**
 * Safely get text from the SDK result (handles a few different SDK shapes)
 */
function readGeneratedText(result) {
  try {
    if (!result) return "";
    if (typeof result.text === "string") return result.text;
    if (result.response) {
      if (typeof result.response.text === "function")
        return result.response.text();
      if (typeof result.response.text === "string") return result.response.text;
    }
    // fallback: check candidate-like shapes
    if (Array.isArray(result.candidates) && result.candidates[0]) {
      const c = result.candidates[0];
      if (c?.content?.[0]?.text) return c.content[0].text;
    }
  } catch (e) {
    console.warn("readGeneratedText error:", e);
  }
  return "";
}

/**
 * Render a PDF page to a compressed JPEG dataURL.
 * Uses a moderate scale and JPEG compression to keep the payload smaller.
 */
async function renderPageToJpeg(page, options = {}) {
  const scale = options.scale ?? 1.5; // tweak if you need higher/less detail
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  await page.render({ canvasContext: context, viewport }).promise;

  // compress as JPEG - adjust quality to reduce payload if necessary
  const quality = options.quality ?? 0.75;
  return canvas.toDataURL("image/jpeg", quality);
}

export const extractTextFromPDF = async (file) => {
  console.log(
    "Starting PDF extraction for file:",
    file.name,
    "Size:",
    file.size
  );

  if (!file) throw new Error("No file passed to extractTextFromPDF");

  // Initialize Gemini AI
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  if (!API_KEY) {
    throw new Error("Gemini API key not found in environment variables");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const total = pdf.numPages;
    let allText = "";

    console.log(`Processing ${total} pages...`);

    for (let i = 1; i <= total; i++) {
      console.log(`Checking page ${i} of ${total} (text layer)...`);
      const page = await pdf.getPage(i);

      // 1) Try to extract text via pdf.js text layer first
      let pageText = "";
      try {
        const textContent = await page.getTextContent();
        if (textContent && Array.isArray(textContent.items)) {
          pageText = textContent.items
            .map((it) => it.str)
            .join(" ")
            .trim();
        }
      } catch (err) {
        console.warn(`getTextContent() failed for page ${i}`, err);
      }

      if (pageText && pageText.length > 20) {
        // We got good text from the layer — use it
        console.log(
          `Extracted text from page ${i} (text layer), length: ${pageText.length}`
        );
        console.log(`--- Page ${i} Text Content ---`);
        console.log(pageText);
        console.log(`--- End Page ${i} Text Content ---`);
        allText += `\n--- Page ${i} (text layer) ---\n${pageText}\n`;
        continue;
      }

      // 2) Fallback: render page -> image -> send to Gemini for OCR
      console.log(`Rendering page ${i} and sending to OCR...`);
      const dataUrl = await renderPageToJpeg(page, {
        scale: 1.5,
        quality: 0.7,
      });
      let base64 = dataUrl.split(",")[1];

      // small safeguard: if base64 is extremely large, try lowering quality/scale
      if (base64.length > 3_500_000) {
        console.warn(
          `Page ${i} image large (${Math.round(
            base64.length / 1024
          )} KB). Re-rendering smaller.`
        );
        const smaller = await renderPageToJpeg(page, {
          scale: 1.0,
          quality: 0.55,
        });
        // replace base64
        const smallerBase64 = smaller.split(",")[1];
        // prefer smaller if smallerBase64 is smaller
        if (smallerBase64.length < base64.length) {
          base64 = smallerBase64;
        }
      }

      // call Gemini - keep temperature 0 and deterministic
      let ocrResult;
      try {
        const result = await ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: "Extract all readable text from the provided image of a PDF page. Return ONLY the extracted plain text. Do not add commentary or headers.",
                },
                {
                  inlineData: { mimeType: "image/jpeg", data: base64 },
                },
              ],
            },
          ],
          generationConfig: { maxOutputTokens: 4096, temperature: 0.0 },
        });

        ocrResult = readGeneratedText(result);
      } catch (err) {
        console.error(`Gemini OCR error on page ${i}:`, err);
        // continue to next page instead of failing everything
        console.log(`Failed to OCR page ${i} — skipping.`);
        allText += `\n--- Page ${i} (OCR failed) ---\n`;
        continue;
      }

      if (ocrResult && ocrResult.trim().length > 0) {
        console.log(
          `OCR succeeded for page ${i}, text length: ${ocrResult.length}`
        );
        console.log(`--- Page ${i} OCR Content ---`);
        console.log(ocrResult);
        console.log(`--- End Page ${i} OCR Content ---`);
        allText += `\n--- Page ${i} (OCR) ---\n${ocrResult}\n`;
      } else {
        console.warn(`OCR returned empty for page ${i}`);
        console.log(`OCR returned no text for page ${i}.`);
        allText += `\n--- Page ${i} (OCR empty) ---\n`;
      }
    }

    // final check
    if (!allText || allText.trim().length === 0) {
      throw new Error("No text extracted from any page");
    }

    console.log("PDF extraction completed, total text length:", allText.length);
    console.log("=== EXTRACTED CONTENT ===");
    console.log(allText);
    console.log("=== END EXTRACTED CONTENT ===");
    return allText.trim();
  } catch (error) {
    console.error("PDF extraction error:", error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
};

export const validatePDF = (file) => {
  if (!file) {
    throw new Error("No file selected");
  }

  if (file.type !== "application/pdf") {
    throw new Error("Please select a valid PDF file");
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error("PDF file size must be less than 10MB");
  }

  return true;
};
