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

