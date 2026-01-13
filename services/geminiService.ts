
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, DocumentContext, HeadingInfo, ManualEntry, ProvisionResult, ShipmentData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    found: {
      type: Type.BOOLEAN,
      description: "Whether the HTS code was found under any derivative category.",
    },
    matches: {
      type: Type.ARRAY,
      description: "A list of all specific derivative HTS categories or rules that this code falls under.",
      items: {
        type: Type.OBJECT,
        properties: {
          derivativeCategory: {
            type: Type.STRING,
            description: "The specific name, ID, or header of the derivative category.",
          },
          metalType: {
            type: Type.STRING,
            enum: ["Aluminum", "Steel", "Both", "Unknown"],
            description: "The type of metal associated.",
          },
          matchDetail: {
            type: Type.STRING,
            description: "Explanation of the rule matched.",
          },
          sourceSnippet: {
            type: Type.STRING,
            description: "The EXACT text or snippet from the provided document or manual rule that proves this match.",
          },
          confidence: {
            type: Type.STRING,
            enum: ["High", "Medium", "Low"],
          },
        },
        required: ["derivativeCategory", "metalType", "matchDetail", "sourceSnippet", "confidence"],
      },
    },
    reasoning: {
      type: Type.STRING,
      description: "A general summary.",
    },
  },
  required: ["found", "matches", "reasoning"],
};

const SYSTEM_INSTRUCTION = `You are a specialized HTS Compliance Engine for TRADE EXPEDITORS INC. DBA TEU GLOBAL.
Your goal is to perform lightning-fast classification of HTS codes against Section 232 Aluminum and Steel derivative lists.
Be precise. If a code matches a manual rule or document entry, extract the EXACT snippet.
Return ONLY valid JSON. Accuracy and speed are top priorities.`;

const handleApiError = (error: any) => {
  console.error("Gemini API Error:", error);
  const message = error?.message || String(error);
  if (message.includes("429")) throw new Error("Rate limit. Retrying...");
  throw new Error("Analysis failed: " + message);
};

export const checkHtsCode = async (
  context: DocumentContext | null,
  manualEntries: ManualEntry[],
  htsCode: string,
  shipment?: ShipmentData
): Promise<AnalysisResult> => {
  try {
    const parts = [];

    if (manualEntries.length > 0) {
      parts.push({ text: `MANUAL RULES:\n${JSON.stringify(manualEntries)}\n` });
    }

    if (context) {
      if (context.type === 'file' && context.mimeType) {
        parts.push({ inlineData: { mimeType: context.mimeType, data: context.content } });
      } else {
        parts.push({ text: `DOCUMENT:\n${context.content}\n` });
      }
    }

    parts.push({ text: `Analyze HTS: ${htsCode}` });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0,
        thinkingConfig: { thinkingBudget: 0 }, // DISABLE thinking for maximum speed
      },
    });

    return JSON.parse(response.text!) as AnalysisResult;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const lookupHtsProvision = async (
  context: DocumentContext | null,
  provisionCode: string
): Promise<ProvisionResult> => {
  try {
    const parts = [];
    if (context) {
      if (context.type === 'file' && context.mimeType) {
        parts.push({ inlineData: { mimeType: context.mimeType, data: context.content } });
      } else {
        parts.push({ text: context.content });
      }
    }
    parts.push({ text: `Lookup HTS: ${provisionCode}` });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts },
      config: {
        systemInstruction: "Quick lookup of HTS provision details. Return JSON.",
        responseMimeType: "application/json",
        temperature: 0,
        thinkingConfig: { thinkingBudget: 0 }, // Maximum speed
      },
    });

    return JSON.parse(response.text!) as ProvisionResult;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const extractDocumentHeadings = async (
  context: DocumentContext
): Promise<HeadingInfo[]> => {
  try {
    const parts = [];
    if (context.type === 'file' && context.mimeType) {
      parts.push({ inlineData: { mimeType: context.mimeType, data: context.content } });
    } else {
      parts.push({ text: context.content });
    }
    parts.push({ text: "Extract HTS 4-digit headings." });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts },
      config: {
        systemInstruction: "Extract headings into JSON format.",
        responseMimeType: "application/json",
        temperature: 0,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const result = JSON.parse(response.text!);
    return result.headings || [];
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};
