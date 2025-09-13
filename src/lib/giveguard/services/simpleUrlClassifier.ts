import { JSDOM } from "jsdom";
import { analyzeFundraiserContent } from "./aiAnalysis";

export type SimpleUrlCheck = {
  ok: boolean;
  platform?: string;
  isFundraiser?: boolean;
  platformVerified: boolean;
  aiAnalysis?: {
    scamProbability: number;
    confidence: number;
    reasons: string[];
    verdict: 'legitimate' | 'suspicious' | 'scam';
  };
};

const ALLOWLIST = [
  { host: "gofundme.com", platform: "gofundme" },
  { host: "www.gofundme.com", platform: "gofundme" },
  { host: "givebutter.com", platform: "givebutter" },
  { host: "www.justgiving.com", platform: "justgiving" },
  { host: "fundly.com", platform: "fundly" },
  { host: "www.fundly.com", platform: "fundly" }
];

export async function checkFundraiserUrlSimple(rawUrl: string): Promise<SimpleUrlCheck> {
  try {
    // Validate URL
    let url: URL;
    try {
      url = new URL(rawUrl.trim());
    } catch {
      return { 
        ok: false, 
        platformVerified: false,
        aiAnalysis: {
          scamProbability: 100,
          confidence: 100,
          reasons: ['Invalid URL format'],
          verdict: 'scam'
        }
      };
    }

    // Check if it's a known platform
    const host = url.host.toLowerCase();
    const allow = ALLOWLIST.find(a => host === a.host || host.endsWith('.' + a.host));
    const platform = allow?.platform || 'unknown';
    const platformVerified = !!allow;

    if (!platformVerified) {
      return {
        ok: true,
        platform: 'unknown',
        platformVerified: false,
        aiAnalysis: {
          scamProbability: 80,
          confidence: 70,
          reasons: ['Unknown platform - cannot verify legitimacy'],
          verdict: 'suspicious'
        }
      };
    }

    // Fetch page content
    let html = "";
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(url.toString(), {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      });
      
      clearTimeout(timeout);

      if (!res.ok) {
        console.log(`HTTP ${res.status} - ${res.statusText}`);
        // For 404s, still return platform verification but with limited analysis
        if (res.status === 404) {
          return {
            ok: true,
            platform,
            platformVerified: true,
            aiAnalysis: {
              scamProbability: 20,
              confidence: 70,
              reasons: ['Platform verified - page may be private or removed'],
              verdict: 'legitimate'
            }
          };
        }
        throw new Error(`HTTP ${res.status}`);
      }

      html = await res.text();
    } catch (e: any) {
      console.error('Fetch error:', e.message);
      // Return basic platform verification even if we can't fetch content
      return {
        ok: true,
        platform,
        platformVerified: true,
        aiAnalysis: {
          scamProbability: 20,
          confidence: 70,
          reasons: ['Platform verified but content analysis unavailable'],
          verdict: 'legitimate'
        }
      };
    }

    // Extract basic content
    const dom = new JSDOM(html);
    const $ = (selector: string) => dom.window.document.querySelector(selector);
    const $$ = (selector: string) => dom.window.document.querySelectorAll(selector);
    const title = $('title')?.textContent || $('meta[property="og:title"]')?.getAttribute('content') || '';
    const description = $('meta[name="description"]')?.getAttribute('content') || $('meta[property="og:description"]')?.getAttribute('content') || '';
    const pageText = dom.window.document.body?.textContent || '';

    // Use AI to analyze the content
    let aiAnalysis = null;
    try {
      aiAnalysis = await analyzeFundraiserContent({
        title,
        description,
        pageText,
        url: url.toString()
      });
    } catch (error) {
      console.error('AI analysis failed:', error);
      // Fallback analysis
      aiAnalysis = {
        scamProbability: 20,
        confidence: 50,
        reasons: ['AI analysis failed - platform verified'],
        verdict: 'legitimate'
      };
    }

    return {
      ok: true,
      platform,
      platformVerified: true,
      isFundraiser: true,
      aiAnalysis
    };

  } catch (error) {
    console.error('URL check error:', error);
    return {
      ok: false,
      platformVerified: false,
      aiAnalysis: {
        scamProbability: 50,
        confidence: 30,
        reasons: ['Analysis failed due to technical error'],
        verdict: 'suspicious'
      }
    };
  }
}
