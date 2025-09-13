import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface AIAnalysisResult {
  scamProbability: number; // 0-100
  confidence: number; // 0-100
  reasons: string[];
  verdict: 'legitimate' | 'suspicious' | 'scam';
}

export async function analyzeFundraiserContent(content: {
  title: string;
  description: string;
  pageText: string;
  url: string;
}): Promise<AIAnalysisResult> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
Analyze this fundraising campaign for legitimacy. Return a JSON response with:
- scamProbability: 0-100 (higher = more likely scam)
- confidence: 0-100 (how confident you are in your assessment)
- reasons: array of specific reasons for your assessment
- verdict: 'legitimate', 'suspicious', or 'scam'

Campaign Details:
Title: ${content.title}
Description: ${content.description}
URL: ${content.url}
Content: ${content.pageText.substring(0, 2000)}

IMPORTANT: Be balanced in your assessment. Consider:
- Legitimate campaigns often have clear goals, realistic amounts, and specific purposes
- Educational causes, medical emergencies, and community support are common legitimate uses
- Look for genuine details, not just suspicious patterns
- High confidence (80-95%) for clearly legitimate campaigns
- Medium confidence (60-80%) for mixed signals
- Low confidence (30-60%) only for obvious red flags

Red flags to look for:
- Urgency tactics ("act now", "limited time")
- Emotional manipulation without substance
- Vague or unrealistic goals
- Missing contact information
- Suspicious language patterns

Positive indicators:
- Clear, specific purpose
- Realistic fundraising goals
- Detailed explanation of need
- Transparent about use of funds
- Professional presentation

Return only valid JSON.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const analysis = JSON.parse(jsonMatch[0]);
    
    return {
      scamProbability: Math.max(0, Math.min(100, analysis.scamProbability || 0)),
      confidence: Math.max(0, Math.min(100, analysis.confidence || 0)),
      reasons: Array.isArray(analysis.reasons) ? analysis.reasons : [],
      verdict: analysis.verdict || 'suspicious'
    };
    
  } catch (error) {
    console.error('AI Analysis Error:', error);
    // Fallback to neutral analysis
    return {
      scamProbability: 30,
      confidence: 50,
      reasons: ['AI analysis unavailable - platform verification only'],
      verdict: 'legitimate'
    };
  }
}

// Quick analysis for simple cases
export async function quickScamCheck(text: string): Promise<boolean> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `Is this text likely a scam? Answer only "YES" or "NO": ${text.substring(0, 500)}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const answer = response.text().trim().toUpperCase();
    
    return answer === 'YES';
  } catch (error) {
    console.error('Quick scam check failed:', error);
    return false; // Conservative fallback
  }
}


