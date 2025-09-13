import { JSDOM } from "jsdom";
import { analyzeFundraiserContent, quickScamCheck } from "./aiAnalysis";

export type UrlCheck = {
  ok: boolean;
  platform?: string;         // 'gofundme' | 'justgiving' | 'givebutter' | ...
  isFundraiser?: boolean;
  riskScore: number;         // 0-100 higher = safer
  verdict: "low" | "medium" | "high" | "scam"; // risk verdict (low = risky, scam = likely scam)
  signals: { label: string; weight: number; proof?: string }[];
  isScam?: boolean;          // explicit scam flag
  scamReasons?: string[];    // reasons why it's flagged as scam
  aiAnalysis?: {             // AI analysis results
    scamProbability: number;
    confidence: number;
    reasons: string[];
    verdict: 'legitimate' | 'suspicious' | 'scam';
  };
};

const ALLOWLIST = [
  { host: "gofundme.com", platform: "gofundme", pathHints: [/^\/f\//, /^\/manage\//] },
  { host: "www.gofundme.com", platform: "gofundme", pathHints: [/^\/f\//] },
  { host: "givebutter.com", platform: "givebutter", pathHints: [/^\/.*/] },
  { host: "www.justgiving.com", platform: "justgiving", pathHints: [/^\/page\//, /^\/fundraising\//] },
  // add more legit platforms as needed
];

const BLOCK_KEYWORDS = [
  "gift card only",
  "crypto only", 
  "send bitcoin",
  "wire me",
  "western union",
  "urgent help needed",
  "send money directly",
  "venmo only",
  "cashapp only",
  "zelle only",
  "paypal friends",
  "no platform fees",
  "contact me directly",
  "dm me for details",
  "text me at",
  "call me at",
  "whatsapp me",
  "telegram me",
  "send to my bank",
  "wire transfer",
  "money order",
  "cash only",
  "bitcoin address",
  "ethereum address",
  "crypto wallet",
  "blockchain",
  "nft",
  "investment opportunity",
  "get rich quick",
  "guaranteed returns",
  "double your money",
  "easy money",
  "work from home",
  "no experience needed",
  "make money fast",
  "financial freedom",
  "passive income",
  "side hustle",
  "mlm",
  "pyramid scheme",
  "ponzi scheme",
  "forex trading",
  "binary options",
  "cryptocurrency investment",
  "trading signals",
  "pump and dump",
  "rug pull",
  "honeypot",
  "scam",
  "fraud",
  "fake",
  "phishing",
  "identity theft",
  "social security number",
  "ssn",
  "credit card number",
  "bank account",
  "routing number",
  "account number",
  "pin number",
  "password",
  "login credentials",
  "verify your account",
  "suspended account",
  "account locked",
  "urgent verification",
  "immediate action required",
  "act now",
  "limited time",
  "exclusive offer",
  "secret method",
  "insider information",
  "government grant",
  "free money",
  "no strings attached",
  "guaranteed approval",
  "pre-approved",
  "congratulations you won",
  "you have been selected",
  "claim your prize",
  "claim your reward",
  "claim your money",
  "unclaimed funds",
  "inheritance",
  "lottery winner",
  "sweepstakes winner",
  "contest winner",
  "prize winner",
  "winner notification",
  "winner announcement",
  "winner selection",
  "winner list",
  "winner board",
  "winner circle",
  "winner club",
  "winner society",
  "winner association",
  "winner group",
  "winner community",
  "winner network",
  "winner platform",
  "winner website",
  "winner portal",
  "winner dashboard",
  "winner panel",
  "winner interface",
  "winner system",
  "winner program",
  "winner service",
  "winner solution",
  "winner tool",
  "winner app",
  "winner software",
  "winner application",
  "winner platform",
  "winner website",
  "winner portal",
  "winner dashboard",
  "winner panel",
  "winner interface",
  "winner system",
  "winner program",
  "winner service",
  "winner solution",
  "winner tool",
  "winner app",
  "winner software",
  "winner application"
];

function scoreToVerdict(score: number, scamReasons: string[] = []): UrlCheck["verdict"] {
  // If we have strong scam indicators, flag as scam regardless of score
  if (scamReasons.length >= 2 || score < 20) return "scam";
  if (score > 80) return "high";     // likely safe
  if (score >= 50) return "medium";  // unsure
  return "low";                      // risky
}

// Enhanced GoFundMe validation patterns
const GOFUNDME_PATTERNS = {
  // Valid GoFundMe campaign ID pattern (alphanumeric, 6-20 chars)
  CAMPAIGN_ID: /^\/f\/[a-zA-Z0-9]{6,20}$/,
  // Valid GoFundMe manage pattern
  MANAGE_PATTERN: /^\/manage\/[a-zA-Z0-9]{6,20}$/,
  // Suspicious patterns that might be fake
  SUSPICIOUS_PATTERNS: [
    /\/f\/[0-9]+$/,  // Just numbers
    /\/f\/[a-z]{1,3}$/,  // Too short
    /\/f\/[A-Z]{1,3}$/,  // Too short, all caps
    /\/f\/[^a-zA-Z0-9]/,  // Special characters
  ]
};

// Additional scam detection patterns
const SCAM_PATTERNS = {
  // Urgency tactics
  URGENCY: /\b(urgent|emergency|asap|immediately|right now|don't wait|limited time|act now|hurry|quick|fast)\b/gi,
  // Emotional manipulation
  EMOTIONAL: /\b(desperate|dying|sick|cancer|hospital|medical|surgery|treatment|life or death|critical|severe)\b/gi,
  // Money requests
  MONEY_REQUESTS: /\b(send money|wire money|transfer money|give money|donate directly|pay directly|cash only|venmo|cashapp|zelle|paypal friends)\b/gi,
  // Fake authority
  FAKE_AUTHORITY: /\b(government|irs|fbi|cia|police|lawyer|attorney|judge|court|official|verified|certified|licensed)\b/gi,
  // Too good to be true
  TOO_GOOD: /\b(free money|guaranteed|no risk|100% safe|instant|immediate|easy money|get rich|double your|triple your)\b/gi
};

// Check if URL looks like a real GoFundMe campaign
function validateGoFundMeUrl(url: URL): { isValid: boolean; signals: UrlCheck["signals"] } {
  const signals: UrlCheck["signals"] = [];
  const pathname = url.pathname;
  
  // Check if it matches valid GoFundMe patterns
  if (GOFUNDME_PATTERNS.CAMPAIGN_ID.test(pathname)) {
    signals.push({ label: "Valid GoFundMe campaign ID format", weight: +25, proof: pathname });
    return { isValid: true, signals };
  }
  
  if (GOFUNDME_PATTERNS.MANAGE_PATTERN.test(pathname)) {
    signals.push({ label: "Valid GoFundMe manage URL format", weight: +20, proof: pathname });
    return { isValid: true, signals };
  }
  
  // Check for suspicious patterns
  const suspiciousMatch = GOFUNDME_PATTERNS.SUSPICIOUS_PATTERNS.find(pattern => pattern.test(pathname));
  if (suspiciousMatch) {
    signals.push({ label: "Suspicious GoFundMe URL pattern", weight: -30, proof: pathname });
    return { isValid: false, signals };
  }
  
  // Generic GoFundMe path but not matching expected patterns
  if (pathname.startsWith('/f/')) {
    signals.push({ label: "GoFundMe-like path but unusual format", weight: -10, proof: pathname });
    return { isValid: false, signals };
  }
  
  return { isValid: false, signals };
}

export async function checkFundraiserUrl(rawUrl: string): Promise<UrlCheck> {
  const signals: UrlCheck["signals"] = [];
  let risk = 0;

  // Validate & normalize
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return { ok: false, riskScore: 0, verdict: "low", signals: [{ label: "Invalid URL", weight: -50 }] };
  }

  // Allowlist check
  const host = url.host.toLowerCase();
  const pathname = url.pathname || "/";
  const allow = ALLOWLIST.find(a => host.endsWith(a.host));
  
  if (allow) {
    signals.push({ label: `Known platform: ${allow.platform}`, weight: +30, proof: host });
    risk += 30;
    
    // Enhanced GoFundMe validation
    if (allow.platform === "gofundme") {
      const gfmValidation = validateGoFundMeUrl(url);
      signals.push(...gfmValidation.signals);
      if (!gfmValidation.isValid) {
        risk -= 40; // Major penalty for invalid GoFundMe URLs
      }
    }
  } else {
    signals.push({ label: "Unknown domain", weight: -30, proof: host });
    risk -= 30;
  }

  // Fetch page (public only) with small timeout
  let html = "";
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 7000); // 7s timeout

    const res = await fetch(url.toString(), {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
    });
    clearTimeout(t);

    const status = res.status;
    if (status === 200) {
      signals.push({ label: "HTTP 200 OK", weight: +15 });
      risk += 15;
      html = await res.text();
    } else {
      signals.push({ label: `Non-200 status: ${status}`, weight: -20 });
      risk -= 20;
    }
  } catch (e: any) {
    signals.push({ label: "Fetch error", weight: -25, proof: String(e?.message || e) });
    risk -= 25;
  }

  let platform: string | undefined = allow?.platform;
  let isFundraiser = false;

  if (html) {
    const dom = new JSDOM(html);
    const $ = (selector: string) => dom.window.document.querySelector(selector);
    const $$ = (selector: string) => dom.window.document.querySelectorAll(selector);

    // OG/meta sanity
    const ogTitle = $('meta[property="og:title"]')?.getAttribute("content") || $("title")?.textContent || "";
    const ogSite = $('meta[property="og:site_name"]')?.getAttribute("content") || "";
    if (ogTitle) { signals.push({ label: "Page has title/OG title", weight: +5, proof: ogTitle.slice(0,80) }); risk += 5; }
    if (ogSite)  { signals.push({ label: "OG site_name present", weight: +5, proof: ogSite }); risk += 5; }

    // Basic fundraiser heuristics by platform
    if (platform === "gofundme") {
      const pathLooksRight = [/^\/f\//].some(rx => rx.test(pathname));
      if (pathLooksRight) { signals.push({ label: "GoFundMe path looks like a fundraiser", weight: +20, proof: pathname }); risk += 20; }
      const hasDonateButton = Array.from($$('a,button')).some(el => (el.textContent || "").toLowerCase().includes("donate"));
      if (hasDonateButton) { signals.push({ label: "Donate button detected", weight: +10 }); risk += 10; }

      isFundraiser = pathLooksRight || hasDonateButton;
    }

    if (platform === "givebutter" || platform === "justgiving") {
      const donateish = Array.from($$('a,button')).some(el => (el.textContent || "").toLowerCase().match(/donate|give|donation/));
      if (donateish) { signals.push({ label: "Donate UI detected", weight: +10 }); risk += 10; }
      isFundraiser = donateish || (pathname.length > 1);
    }

    // Enhanced scam detection
    const lowerText = dom.window.document.body?.textContent?.toLowerCase() || '';
    const pageTitle = $('title')?.textContent?.toLowerCase() || '';
    const pageDescription = $('meta[name="description"]')?.getAttribute('content')?.toLowerCase() || '';
    const allText = `${lowerText} ${pageTitle} ${pageDescription}`;
    
    // Check for basic suspicious keywords
    const susHits = BLOCK_KEYWORDS.filter(k => allText.includes(k));
    if (susHits.length) {
      signals.push({ label: `Suspicious keywords found: ${susHits.slice(0, 3).join(", ")}`, weight: -25 });
      risk -= 25;
    }
    
    // Check for scam patterns
    let scamScore = 0;
    const scamPatterns = Object.entries(SCAM_PATTERNS);
    
    for (const [patternName, pattern] of scamPatterns) {
      const matches = allText.match(pattern);
      if (matches) {
        const severity = patternName === 'MONEY_REQUESTS' ? -30 : 
                        patternName === 'FAKE_AUTHORITY' ? -25 :
                        patternName === 'TOO_GOOD' ? -20 :
                        patternName === 'URGENCY' ? -15 : -10;
        
        signals.push({ 
          label: `${patternName.replace('_', ' ').toLowerCase()} detected`, 
          weight: severity, 
          proof: matches.slice(0, 2).join(', ') 
        });
        scamScore += severity;
      }
    }
    
    risk += scamScore;
    
    // Check for legitimate fundraiser indicators
    const legitimateIndicators = [
      'goal', 'raised', 'donors', 'days left', 'campaign', 'fundraiser',
      'help', 'support', 'medical', 'emergency', 'family', 'community'
    ];
    
    const legitimateHits = legitimateIndicators.filter(indicator => 
      allText.includes(indicator)
    );
    
    if (legitimateHits.length >= 3) {
      signals.push({ label: `Legitimate fundraiser indicators found (${legitimateHits.length})`, weight: +15 });
      risk += 15;
    }
    
    // Check for social proof elements
    const socialProofElements = [
      'donated', 'shares', 'comments', 'likes', 'followers',
      'verified', 'trusted', 'secure', 'protected'
    ];
    
    const socialProofHits = socialProofElements.filter(element => 
      allText.includes(element)
    );
    
    if (socialProofHits.length >= 2) {
      signals.push({ label: `Social proof elements found (${socialProofHits.length})`, weight: +10 });
      risk += 10;
    }
  }

  // AI Analysis (only if we have content and it's not clearly legitimate)
  let aiAnalysis = null;
  if (html && risk < 80) { // Only run AI on uncertain cases to save costs
    try {
      const pageTitle = $('title')?.textContent || '';
      const pageDescription = $('meta[name="description"]')?.getAttribute('content') || '';
      const pageText = dom.window.document.body?.textContent || '';
      
      aiAnalysis = await analyzeFundraiserContent({
        title: pageTitle,
        description: pageDescription,
        pageText: pageText,
        url: url.toString()
      });
      
      // Add AI signals
      if (aiAnalysis.scamProbability > 70) {
        signals.push({ 
          label: `AI detected high scam probability (${aiAnalysis.scamProbability}%)`, 
          weight: -30,
          proof: aiAnalysis.reasons.slice(0, 2).join(', ')
        });
        risk -= 30;
      } else if (aiAnalysis.scamProbability > 40) {
        signals.push({ 
          label: `AI detected suspicious content (${aiAnalysis.scamProbability}%)`, 
          weight: -15,
          proof: aiAnalysis.reasons.slice(0, 1).join(', ')
        });
        risk -= 15;
      } else if (aiAnalysis.scamProbability < 20) {
        signals.push({ 
          label: `AI analysis suggests legitimate content (${aiAnalysis.scamProbability}%)`, 
          weight: +10
        });
        risk += 10;
      }
    } catch (error) {
      console.error('AI analysis failed:', error);
      // Continue without AI analysis
    }
  }

  // Final touches
  if (!allow) {
    // Unknown domains need stronger evidence to lift risk; cap to medium at best
    risk = Math.min(risk, 60);
  }

  // Detect scam indicators
  const scamReasons: string[] = [];
  
  // Check for strong scam indicators
  if (risk < 20) {
    scamReasons.push("Very low trust score");
  }
  
  // Check for multiple suspicious patterns
  const suspiciousSignals = signals.filter(s => s.weight < -20);
  if (suspiciousSignals.length >= 3) {
    scamReasons.push("Multiple suspicious patterns detected");
  }
  
  // Check for money request patterns
  const moneyRequestSignals = signals.filter(s => 
    s.label.toLowerCase().includes('money request') || 
    s.label.toLowerCase().includes('send money')
  );
  if (moneyRequestSignals.length > 0) {
    scamReasons.push("Direct money requests detected");
  }
  
  // Check for fake authority claims
  const fakeAuthoritySignals = signals.filter(s => 
    s.label.toLowerCase().includes('fake authority')
  );
  if (fakeAuthoritySignals.length > 0) {
    scamReasons.push("Fake authority claims detected");
  }
  
  // Check for invalid GoFundMe URLs
  const invalidGfmSignals = signals.filter(s => 
    s.label.toLowerCase().includes('suspicious gofundme') ||
    s.label.toLowerCase().includes('unusual format')
  );
  if (invalidGfmSignals.length > 0) {
    scamReasons.push("Invalid or suspicious GoFundMe URL format");
  }

  // Clamp score
  const riskScore = Math.max(0, Math.min(100, risk));
  const verdict = scoreToVerdict(riskScore, scamReasons);
  const isScam = verdict === "scam";

  // If on a known platform and path/controls look like a fundraiser → isFundraiser true
  if (allow && isFundraiser) {
    return { 
      ok: true, 
      platform, 
      isFundraiser: true, 
      riskScore, 
      verdict, 
      signals,
      isScam,
      scamReasons: isScam ? scamReasons : undefined,
      aiAnalysis: aiAnalysis || undefined
    };
  }

  // If unknown domain but looks okay, keep medium at best
  return { 
    ok: true, 
    platform, 
    isFundraiser: !!isFundraiser, 
    riskScore, 
    verdict, 
    signals,
    isScam,
    scamReasons: isScam ? scamReasons : undefined,
    aiAnalysis: aiAnalysis || undefined
  };
}
