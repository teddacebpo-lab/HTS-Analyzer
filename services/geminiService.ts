// geminiService.ts
import { AnalysisResult, DocumentContext, ManualEntry, ProvisionResult } from './types';

// TODO: Replace with your actual deployed backend URL on Vercel
const API_BASE = "https://your-vercel-app.vercel.app/api/gemini";


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
