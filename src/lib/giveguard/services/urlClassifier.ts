import { config } from '@/lib/giveguard/lib/config';

export interface URLClassification {
  platform: string;
  isAllowed: boolean;
  isSuspicious: boolean;
  isBlocked: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
}

export function classifyURL(url: string): URLClassification {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Check if domain is in allowed hosts
    const isAllowed = config.url.allowedHosts.some(allowed => 
      hostname.includes(allowed.toLowerCase())
    );
    
    // Check for suspicious patterns
    const isSuspicious = config.url.suspiciousPatterns.some(pattern => 
      pattern.test(url)
    );
    
    // Check for blocked domains
    const isBlocked = config.url.blockedDomains.some(blocked => 
      hostname.includes(blocked.toLowerCase())
    );
    
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
    
    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    let confidence = 70;
    
    if (isBlocked) {
      riskLevel = 'critical';
      confidence = 95;
    } else if (isSuspicious) {
      riskLevel = 'high';
      confidence = 85;
    } else if (isAllowed && platform !== 'unknown') {
      riskLevel = 'low';
      confidence = 80;
    } else if (platform !== 'unknown') {
      riskLevel = 'medium';
      confidence = 60;
    } else {
      riskLevel = 'high';
      confidence = 50;
    }
    
    return {
      platform,
      isAllowed,
      isSuspicious,
      isBlocked,
      riskLevel,
      confidence
    };
    
  } catch (error) {
    return {
      platform: 'invalid',
      isAllowed: false,
      isSuspicious: true,
      isBlocked: false,
      riskLevel: 'critical',
      confidence: 90
    };
  }
}