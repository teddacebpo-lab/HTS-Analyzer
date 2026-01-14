// geminiService.ts
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, DocumentContext, HeadingInfo, ManualEntry, ProvisionResult, ShipmentData } from "../types";


// TODO: Replace with your actual deployed backend URL on Vercel
const API_BASE = "https://backend-r5040ikss-teddacebpo-6949s-projects.vercel.app/api/gemini";

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
/**
 * Performs HTS compliance analysis.
 * Frontend calls backend, backend calls Gemini API securely.
 */
export const checkHtsCode = async (
  context: DocumentContext | null,
  manualEntries: ManualEntry[],
  htsCode: string
): Promise<AnalysisResult> => {
  try {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'compliance',
        context,
        manualEntries,
        htsCode
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Compliance analysis failed: ${errText}`);
    }

    return (await res.json()) as AnalysisResult;
  } catch (error: any) {
    console.error("checkHtsCode error:", error);
    throw error;
  }
};

/**
 * Performs HTS provision lookup.
 */
export const lookupHtsProvision = async (
  context: DocumentContext | null,
  provisionCode: string
): Promise<ProvisionResult> => {
  try {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'lookup',
        context,
        htsCode: provisionCode
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Provision lookup failed: ${errText}`);
    }

    return (await res.json()) as ProvisionResult;
  } catch (error: any) {
    console.error("lookupHtsProvision error:", error);
    throw error;
  }
};

/**
 * Extracts headings from a document.
 * You can call the backend in a similar fashion if needed.
 */
export const extractDocumentHeadings = async (
  context: DocumentContext
) => {
  try {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'headings',
        context
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Heading extraction failed: ${errText}`);
    }

    const data = await res.json();
    return data.headings || [];
  } catch (error: any) {
    console.error("extractDocumentHeadings error:", error);
    throw error;
  }
};
