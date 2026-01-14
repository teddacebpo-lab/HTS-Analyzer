import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { mode, htsCode, context, manualEntries } = req.body;

    const SYSTEM_INSTRUCTION = mode === "compliance"
      ? `You are a specialized HTS Compliance Engine for TRADE EXPEDITORS INC. DBA TEU GLOBAL.
         Perform lightning-fast classification of HTS codes against Section 232 Aluminum and Steel derivative lists.
         Return only valid JSON.`
      : "Quick lookup of HTS provision details. Return JSON.";

    const parts = [];
    if (context) {
      if (context.type === 'file' && context.mimeType) {
        parts.push({ inlineData: { mimeType: context.mimeType, data: context.content } });
      } else {
        parts.push({ text: context.content });
      }
    }
    if (manualEntries && mode === "compliance") {
      parts.push({ text: `MANUAL RULES:\n${JSON.stringify(manualEntries)}` });
    }

    parts.push({ text: `HTS Code: ${htsCode}` });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    res.status(200).json(JSON.parse(response.text!));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Gemini API error" });
  }
}
