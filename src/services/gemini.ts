import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface GeminiResponse {
  success: boolean;
  content?: string;
  error?: string;
}

export async function generateContent(prompt: string): Promise<GeminiResponse> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return {
      success: true,
      content: text
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function analyzeText(text: string, analysisType: 'sentiment' | 'legitimacy' | 'urgency'): Promise<GeminiResponse> {
  try {
    let prompt = '';
    
    switch (analysisType) {
      case 'sentiment':
        prompt = `Analyze the sentiment of this text and return JSON with sentiment (positive/negative/neutral) and confidence (0-100): "${text}"`;
        break;
      case 'legitimacy':
        prompt = `Analyze this text for legitimacy and return JSON with verdict (legitimate/suspicious/scam), confidence (0-100), and reasons: "${text}"`;
        break;
      case 'urgency':
        prompt = `Analyze this text for urgency level and return JSON with level (low/medium/high), confidence (0-100), and indicators: "${text}"`;
        break;
    }
    
    return await generateContent(prompt);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Analysis failed'
    };
  }
}

// Legacy types and functions for backward compatibility
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
  if (!process.env.GEMINI_API_KEY) {
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