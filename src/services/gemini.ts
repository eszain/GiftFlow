// src/services/ai/gemini.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
let genAI: GoogleGenerativeAI | null = null;
if (apiKey) genAI = new GoogleGenerativeAI(apiKey);

export type AiOut = {
  risk_band: "low" | "medium" | "high";
  reasons: string[];
  detected_signals: {
    urgent_language?: boolean;
    payment_off_platform?: boolean;
    crypto_or_giftcards_only?: boolean;
    third_party_corroboration?: boolean;
    organizer_identity_clear?: boolean;
  };
  highlight_quotes: string[];
};

export async function analyzeWithGemini(
  url: string,
  pageText: string
): Promise<AiOut> {
  // If no key configured, return safe default
  if (!genAI) {
    return {
      risk_band: "medium",
      reasons: ["AI disabled"],
      detected_signals: {},
      highlight_quotes: []
    };
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
  const prompt = `
You are a cautious donations risk analyst. Do NOT claim certainty.
Return ONLY JSON with:
{
  "risk_band": "low" | "medium" | "high",
  "reasons": string[],
  "detected_signals": { ... },
  "highlight_quotes": string[]
}
Rules:
- Do NOT output percentages or confidence scores.
- Do NOT claim verification or certainty.

Context URL: ${url}
Public text (truncated):
"""${pageText.slice(0, 12000)}"""
`;

  const resp = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  const raw = resp.response.text().trim();
  const s = raw.indexOf("{");
  const e = raw.lastIndexOf("}");
  if (s === -1 || e === -1) {
    return { risk_band: "medium", reasons: ["model returned non-JSON"], detected_signals: {}, highlight_quotes: [] };
  }
  try {
    return JSON.parse(raw.slice(s, e + 1));
  } catch {
    return { risk_band: "medium", reasons: ["model JSON parse error"], detected_signals: {}, highlight_quotes: [] };
  }
}
