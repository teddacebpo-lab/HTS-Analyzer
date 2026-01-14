import express from "express";
import cors from "cors";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: "5mb" })); // Allow JSON payloads
app.use(express.urlencoded({ extended: true }));

// Initialize Gemini API with env key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Helper to handle API errors
const handleApiError = (res, error) => {
  console.error("Gemini API Error:", error);
  const message = error?.message || String(error);
  res.status(500).json({ error: message });
};

// Main endpoint
app.post("/api/gemini", async (req, res) => {
  try {
    const { mode, htsCode, context, manualEntries } = req.body;

    if (!mode) return res.status(400).json({ error: "Mode is required" });

    const parts = [];

    if (context) {
      if (context.type === "file" && context.mimeType) {
        parts.push({ inlineData: { mimeType: context.mimeType, data: context.content } });
      } else {
        parts.push({ text: context.content });
      }
    }

    if (manualEntries && mode === "compliance") {
      parts.push({ text: `MANUAL RULES:\n${JSON.stringify(manualEntries)}` });
    }

    if (htsCode) parts.push({ text: `HTS Code: ${htsCode}` });

    // Determine instruction
    let systemInstruction = "";
    if (mode === "compliance") {
      systemInstruction = `You are a specialized HTS Compliance Engine for TRADE EXPEDITORS INC. DBA TEU GLOBAL.
      Perform lightning-fast classification of HTS codes against Section 232 Aluminum and Steel derivative lists.
      Return ONLY valid JSON.`;
    } else if (mode === "lookup") {
      systemInstruction = "Quick lookup of HTS provision details. Return JSON.";
    } else if (mode === "headings") {
      systemInstruction = "Extract HTS headings into JSON format.";
    }

    // Generate response
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    res.status(200).json(JSON.parse(response.text));
  } catch (error) {
    handleApiError(res, error);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
