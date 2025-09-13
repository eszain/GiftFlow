import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface AIAnalysisResult {
  verdict: 'legitimate' | 'suspicious' | 'scam';
  confidence: number;
  scamProbability: number;
  reasons: string[];
  highlightQuotes?: string[];
  riskFactors: string[];
  recommendations: string[];
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
- verdict: 'legitimate', 'suspicious', or 'scam'
- confidence: 0-100 (how confident you are in your assessment)
- scamProbability: 0-100 (higher = more likely scam)
- reasons: array of specific reasons for your assessment
- highlightQuotes: array of concerning quotes from the content
- riskFactors: array of risk factors identified
- recommendations: array of recommendations for donors

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
- Requests for payment outside platform
- Inconsistent information

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
      verdict: analysis.verdict || 'suspicious',
      confidence: Math.max(0, Math.min(100, analysis.confidence || 70)),
      scamProbability: Math.max(0, Math.min(100, analysis.scamProbability || 50)),
      reasons: Array.isArray(analysis.reasons) ? analysis.reasons : ['Analysis incomplete'],
      highlightQuotes: Array.isArray(analysis.highlightQuotes) ? analysis.highlightQuotes : [],
      riskFactors: Array.isArray(analysis.riskFactors) ? analysis.riskFactors : [],
      recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations : []
    };
    
  } catch (error) {
    console.error('AI Analysis Error:', error);
    // Fallback to neutral analysis
    return {
      verdict: 'suspicious',
      confidence: 50,
      scamProbability: 50,
      reasons: ['AI analysis failed'],
      riskFactors: ['Unable to analyze'],
      recommendations: ['Manual review recommended']
    };
  }
}

export async function analyzeFundraiserWithAI(
  url: string,
  title?: string,
  description?: string,
  additionalText?: string
): Promise<AIAnalysisResult> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const content = `
URL: ${url}
Title: ${title || 'Not provided'}
Description: ${description || 'Not provided'}
Additional Text: ${additionalText || 'Not provided'}

Analyze this fundraising campaign for legitimacy and return JSON:

{
  "verdict": "legitimate" | "suspicious" | "scam",
  "confidence": 0-100,
  "scamProbability": 0-100,
  "reasons": ["reason1", "reason2", "reason3"],
  "highlightQuotes": ["quote1", "quote2"],
  "riskFactors": ["risk1", "risk2"],
  "recommendations": ["rec1", "rec2"]
}

Focus on:
- Urgency language (excessive = suspicious)
- Emotional manipulation tactics
- Lack of specific details about use of funds
- Unrealistic claims or promises
- Poor grammar/spelling (could indicate scam)
- Vague beneficiary information
- Requests for immediate action
- Lack of transparency about organizer
- Inconsistent information
- Requests for payment outside platform

Return only valid JSON.`;

    const result = await model.generateContent(content);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }
    
    const analysis = JSON.parse(jsonMatch[0]);
    
    return {
      verdict: analysis.verdict || 'suspicious',
      confidence: Math.max(0, Math.min(100, analysis.confidence || 70)),
      scamProbability: Math.max(0, Math.min(100, analysis.scamProbability || 50)),
      reasons: Array.isArray(analysis.reasons) ? analysis.reasons : ['Analysis incomplete'],
      highlightQuotes: Array.isArray(analysis.highlightQuotes) ? analysis.highlightQuotes : [],
      riskFactors: Array.isArray(analysis.riskFactors) ? analysis.riskFactors : [],
      recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations : []
    };
    
  } catch (error) {
    console.error('AI analysis error:', error);
    return {
      verdict: 'suspicious',
      confidence: 50,
      scamProbability: 50,
      reasons: ['AI analysis failed'],
      riskFactors: ['Unable to analyze'],
      recommendations: ['Manual review recommended']
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

export async function analyzeCharityWithAI(org: any): Promise<AIAnalysisResult> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const content = `
Analyze this charity organization:

Name: ${org.name}
EIN: ${org.ein}
Status: ${org.status}
Tax-deductible: ${org.pub78Eligible ? 'Yes' : 'No'}
Subsection: ${org.subsection || 'Not specified'}

Return JSON:
{
  "verdict": "legitimate" | "suspicious" | "scam",
  "confidence": 0-100,
  "scamProbability": 0-100,
  "reasons": ["reason1", "reason2"],
  "riskFactors": ["risk1", "risk2"],
  "recommendations": ["rec1", "rec2"]
}

Focus on legitimacy, transparency, and donor safety.`;

    const result = await model.generateContent(content);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }
    
    const analysis = JSON.parse(jsonMatch[0]);
    
    return {
      verdict: analysis.verdict || 'legitimate',
      confidence: Math.max(0, Math.min(100, analysis.confidence || 80)),
      scamProbability: Math.max(0, Math.min(100, analysis.scamProbability || 20)),
      reasons: Array.isArray(analysis.reasons) ? analysis.reasons : ['Charity appears legitimate'],
      riskFactors: Array.isArray(analysis.riskFactors) ? analysis.riskFactors : [],
      recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations : []
    };
    
  } catch (error) {
    console.error('Charity AI analysis error:', error);
    return {
      verdict: 'legitimate',
      confidence: 70,
      scamProbability: 30,
      reasons: ['AI analysis unavailable'],
      riskFactors: [],
      recommendations: ['Verify through official sources']
    };
  }
}