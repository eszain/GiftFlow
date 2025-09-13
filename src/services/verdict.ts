export interface VerdictFactors {
  platformVerified: boolean;
  aiAnalysis: {
    verdict: 'legitimate' | 'suspicious' | 'scam';
    confidence: number;
    scamProbability: number;
  };
  urlCheck: {
    isValid: boolean;
    isHttps: boolean;
    isShortened: boolean;
  };
  contentAnalysis?: {
    urgencyLevel: 'low' | 'medium' | 'high';
    emotionalAppeal: 'low' | 'medium' | 'high';
    transparency: 'low' | 'medium' | 'high';
  };
}

export interface Verdict {
  overall: 'LEGITIMATE' | 'REVIEW' | 'SUSPICIOUS' | 'SCAM';
  confidence: number;
  reasoning: string[];
  recommendations: string[];
}

export function generateVerdict(factors: VerdictFactors): Verdict {
  const reasoning: string[] = [];
  const recommendations: string[] = [];
  let confidence = 0;
  
  // Platform verification check
  if (factors.platformVerified) {
    reasoning.push('Platform is verified and trusted');
    confidence += 30;
  } else {
    reasoning.push('Platform is not verified or unknown');
    confidence -= 20;
  }
  
  // AI Analysis
  if (factors.aiAnalysis.verdict === 'legitimate') {
    reasoning.push('AI analysis indicates legitimate campaign');
    confidence += 25;
  } else if (factors.aiAnalysis.verdict === 'suspicious') {
    reasoning.push('AI analysis shows suspicious indicators');
    confidence -= 15;
    recommendations.push('Review campaign details carefully');
  } else if (factors.aiAnalysis.verdict === 'scam') {
    reasoning.push('AI analysis indicates potential scam');
    confidence -= 30;
    recommendations.push('Do not donate to this campaign');
  }
  
  // URL Check
  if (factors.urlCheck.isValid && factors.urlCheck.isHttps) {
    reasoning.push('URL is valid and uses HTTPS');
    confidence += 10;
  } else {
    reasoning.push('URL has security concerns');
    confidence -= 10;
  }
  
  if (factors.urlCheck.isShortened) {
    reasoning.push('URL is shortened, which can be suspicious');
    confidence -= 15;
    recommendations.push('Consider accessing the original URL');
  }
  
  // Content Analysis
  if (factors.contentAnalysis) {
    if (factors.contentAnalysis.urgencyLevel === 'high') {
      reasoning.push('High urgency language detected');
      confidence -= 10;
      recommendations.push('Be cautious of high-pressure tactics');
    }
    
    if (factors.contentAnalysis.emotionalAppeal === 'high') {
      reasoning.push('High emotional appeal detected');
      confidence -= 5;
    }
    
    if (factors.contentAnalysis.transparency === 'low') {
      reasoning.push('Low transparency in campaign details');
      confidence -= 15;
      recommendations.push('Request more specific information');
    }
  }
  
  // Determine overall verdict
  let overall: 'LEGITIMATE' | 'REVIEW' | 'SUSPICIOUS' | 'SCAM';
  
  if (confidence >= 70 && factors.platformVerified) {
    overall = 'LEGITIMATE';
  } else if (confidence >= 40) {
    overall = 'REVIEW';
    recommendations.push('Manual review recommended');
  } else if (confidence >= 0) {
    overall = 'SUSPICIOUS';
    recommendations.push('Exercise extreme caution');
  } else {
    overall = 'SCAM';
    recommendations.push('Do not proceed with donation');
  }
  
  // Default recommendations
  if (recommendations.length === 0) {
    recommendations.push('Verify through official channels');
    recommendations.push('Check organizer credentials');
    recommendations.push('Review campaign updates');
  }
  
  return {
    overall,
    confidence: Math.max(0, Math.min(100, confidence)),
    reasoning,
    recommendations
  };
}

// Legacy types and functions for backward compatibility
export type FinalVerdict = {
  verdict: "LIKELY_LEGIT" | "REVIEW" | "SCAM_LIKELY";
  reason: string;
  ai?: any;
  platform?: any;
  signals?: { label: string; weight?: number }[];
};

export function finalVerdict(p: any, ai: any): FinalVerdict {
  if (!p.allowedHost || !p.https) {
    return {
        verdict: "SCAM_LIKELY",
        reason: p.reason || "Unrecognized or unsafe domain",
        ai: undefined,              // <- hide AI result for clarity
        platform: p,
      };
  }

  const ds = ai.detected_signals || {};
  if (ds.crypto_or_giftcards_only || ds.payment_off_platform) {
    return { verdict: "SCAM_LIKELY", reason: "Off-platform or crypto/giftcards only", ai, platform: p };
  }

  if (p.pathOk && ai.risk_band === "low") {
    return { verdict: "LIKELY_LEGIT", reason: "Known platform + low-risk content", ai, platform: p };
  }

  return { verdict: "REVIEW", reason: "Insufficient or mixed signals", ai, platform: p };
}