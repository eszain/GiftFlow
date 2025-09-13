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

