export interface TrustScoreFactors {
  platformVerified: boolean;
  domainAge?: number;
  sslCertificate: boolean;
  socialMediaPresence?: boolean;
  contactInformation: boolean;
  transparency: number; // 0-100
  urgencyLevel: 'low' | 'medium' | 'high';
  emotionalAppeal: 'low' | 'medium' | 'high';
}

export function calculateTrustScore(factors: TrustScoreFactors): number {
  let score = 0;
  
  // Platform verification (40 points)
  if (factors.platformVerified) {
    score += 40;
  }
  
  // SSL Certificate (10 points)
  if (factors.sslCertificate) {
    score += 10;
  }
  
  // Contact information (15 points)
  if (factors.contactInformation) {
    score += 15;
  }
  
  // Transparency (20 points)
  score += Math.round(factors.transparency * 0.2);
  
  // Social media presence (10 points)
  if (factors.socialMediaPresence) {
    score += 10;
  }
  
  // Domain age bonus (5 points)
  if (factors.domainAge && factors.domainAge > 365) {
    score += 5;
  }
  
  // Penalties for high urgency/emotional appeal
  if (factors.urgencyLevel === 'high') {
    score -= 10;
  }
  
  if (factors.emotionalAppeal === 'high') {
    score -= 5;
  }
  
  return Math.max(0, Math.min(100, score));
}

export function getTrustLevel(score: number): 'high' | 'medium' | 'low' | 'very-low' {
  if (score >= 80) return 'high';
  if (score >= 60) return 'medium';
  if (score >= 40) return 'low';
  return 'very-low';
}

// Legacy types and functions for backward compatibility
export type TrustSignal = { label: string; weight: number; proof?: string };

export function computeTrustScore(signals: TrustSignal[]): { score: number; verdict: 'low'|'medium'|'high' } {
  const base = signals.reduce((acc, s) => acc + s.weight, 0);
  const score = Math.max(0, Math.min(100, base));
  let verdict: 'low'|'medium'|'high' = 'low';
  if (score > 70) verdict = 'high';
  else if (score >= 40) verdict = 'medium';
  return { score, verdict };
}