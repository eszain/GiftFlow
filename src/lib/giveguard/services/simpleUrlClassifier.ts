import { config } from '@/lib/giveguard/lib/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface UrlCheckResult {
  ok: boolean;
  platform: string;
  platformVerified: boolean;
  scrapedContent?: {
    title?: string;
    description?: string;
    organizer?: string;
    goal?: string;
    raised?: string;
    donors?: string;
    daysLeft?: string;
  };
  aiAnalysis?: {
    verdict: 'legitimate' | 'suspicious' | 'scam';
    scamProbability: number;
    confidence: number;
    reasons: string[];
    highlightQuotes?: string[];
  };
}

export async function checkFundraiserUrlSimple(url: string): Promise<UrlCheckResult> {
  try {
    // Parse URL
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Check if domain is in allowed hosts
    const isAllowedHost = config.url.allowedHosts.some(allowed => 
      hostname.includes(allowed.toLowerCase())
    );
    
    // Check for suspicious patterns
    const isSuspiciousPattern = config.url.suspiciousPatterns.some(pattern => 
      pattern.test(url)
    );
    
    // Check for blocked domains
    const isBlockedDomain = config.url.blockedDomains.some(blocked => 
      hostname.includes(blocked.toLowerCase())
    );
    
    if (isBlockedDomain) {
      return {
        ok: false,
        platform: 'blocked',
        platformVerified: false,
        aiAnalysis: {
          verdict: 'scam',
          scamProbability: 95,
          confidence: 90,
          reasons: ['Domain is on blocked list']
        }
      };
    }
    
    if (isSuspiciousPattern) {
      return {
        ok: false,
        platform: 'suspicious',
        platformVerified: false,
        aiAnalysis: {
          verdict: 'suspicious',
          scamProbability: 70,
          confidence: 80,
          reasons: ['URL uses suspicious shortening service']
        }
      };
    }
    
    // Determine platform
    let platform = 'unknown';
    if (hostname.includes('gofundme')) platform = 'GoFundMe';
    else if (hostname.includes('fundly')) platform = 'Fundly';
    else if (hostname.includes('kickstarter')) platform = 'Kickstarter';
    else if (hostname.includes('indiegogo')) platform = 'Indiegogo';
    else if (hostname.includes('donorschoose')) platform = 'DonorsChoose';
    else if (hostname.includes('causes')) platform = 'Causes';
    else if (hostname.includes('fundrazr')) platform = 'FundRazr';
    else if (hostname.includes('crowdrise')) platform = 'CrowdRise';
    else if (hostname.includes('youcaring')) platform = 'YouCaring';
    else if (hostname.includes('giveforward')) platform = 'GiveForward';
    else if (hostname.includes('crowdfunder')) platform = 'CrowdFunder';
    else if (hostname.includes('crowdtilt')) platform = 'CrowdTilt';
    else if (hostname.includes('razoo')) platform = 'Razoo';
    else if (hostname.includes('firstgiving')) platform = 'FirstGiving';
    else if (hostname.includes('networkforgood')) platform = 'Network for Good';
    else if (hostname.includes('justgiving')) platform = 'JustGiving';
    else if (hostname.includes('causevox')) platform = 'CauseVox';
    else if (hostname.includes('donately')) platform = 'Donately';
    
    // Try to scrape basic content
    let scrapedContent: any = {};
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; GiveGuard/1.0)',
        },
        timeout: 10000,
      });
      
      if (response.ok) {
        const html = await response.text();
        
        // Simple regex-based scraping
        const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
        const descriptionMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i);
        
        if (titleMatch?.[1]) scrapedContent.title = titleMatch[1].trim();
        if (descriptionMatch?.[1]) scrapedContent.description = descriptionMatch[1].trim();
        
        // Platform-specific scraping
        if (platform === 'GoFundMe') {
          const goalMatch = html.match(/Goal.*?\$([0-9,]+)/i);
          const raisedMatch = html.match(/raised.*?\$([0-9,]+)/i);
          const donorsMatch = html.match(/([0-9]+)\s+donors?/i);
          
          if (goalMatch?.[1]) scrapedContent.goal = `$${goalMatch[1]}`;
          if (raisedMatch?.[1]) scrapedContent.raised = `$${raisedMatch[1]}`;
          if (donorsMatch?.[1]) scrapedContent.donors = donorsMatch[1];
        }
      }
    } catch (scrapeError) {
      console.warn('Failed to scrape content:', scrapeError);
    }
    
    // AI Analysis
    let aiAnalysis;
    if (isAllowedHost && platform !== 'unknown') {
      try {
        aiAnalysis = await analyzeWithAI(url, scrapedContent);
      } catch (aiError) {
        console.warn('AI analysis failed:', aiError);
        aiAnalysis = {
          verdict: 'legitimate' as const,
          scamProbability: 20,
          confidence: 70,
          reasons: ['Platform verified but AI analysis unavailable']
        };
      }
    } else {
      aiAnalysis = {
        verdict: 'suspicious' as const,
        scamProbability: 60,
        confidence: 75,
        reasons: ['Platform not recognized or verified']
      };
    }
    
    return {
      ok: true,
      platform,
      platformVerified: isAllowedHost,
      scrapedContent: Object.keys(scrapedContent).length > 0 ? scrapedContent : undefined,
      aiAnalysis
    };
    
  } catch (error) {
    console.error('URL classification error:', error);
    return {
      ok: false,
      platform: 'error',
      platformVerified: false,
      aiAnalysis: {
        verdict: 'suspicious',
        scamProbability: 50,
        confidence: 50,
        reasons: ['Unable to analyze URL']
      }
    };
  }
}

async function analyzeWithAI(url: string, scrapedContent: any): Promise<{
  verdict: 'legitimate' | 'suspicious' | 'scam';
  scamProbability: number;
  confidence: number;
  reasons: string[];
  highlightQuotes?: string[];
}> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
Analyze this fundraising campaign for legitimacy:

URL: ${url}
Title: ${scrapedContent.title || 'Not available'}
Description: ${scrapedContent.description || 'Not available'}

Return JSON:
{
  "verdict": "legitimate" | "suspicious" | "scam",
  "scamProbability": 0-100,
  "confidence": 0-100,
  "reasons": ["reason1", "reason2", "reason3"],
  "highlightQuotes": ["quote1", "quote2"]
}

Focus on:
- Urgency language (too much = suspicious)
- Emotional manipulation
- Lack of specific details
- Unrealistic claims
- Poor grammar/spelling
- Vague beneficiary information

Return only valid JSON.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }
    
    const analysis = JSON.parse(jsonMatch[0]);
    
    return {
      verdict: analysis.verdict || 'suspicious',
      scamProbability: Math.max(0, Math.min(100, analysis.scamProbability || 50)),
      confidence: Math.max(0, Math.min(100, analysis.confidence || 70)),
      reasons: Array.isArray(analysis.reasons) ? analysis.reasons : ['Analysis incomplete'],
      highlightQuotes: Array.isArray(analysis.highlightQuotes) ? analysis.highlightQuotes : []
    };
    
  } catch (error) {
    console.error('AI analysis error:', error);
    return {
      verdict: 'suspicious',
      scamProbability: 50,
      confidence: 50,
      reasons: ['AI analysis failed']
    };
  }
}