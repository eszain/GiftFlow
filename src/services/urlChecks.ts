export interface URLCheckResult {
  isValid: boolean;
  isHttps: boolean;
  domain: string;
  path: string;
  queryParams: Record<string, string>;
  isShortened: boolean;
  redirects: string[];
}

export function validateURL(url: string): URLCheckResult {
  try {
    const urlObj = new URL(url);
    
    // Check if it's a shortened URL
    const shortenedDomains = [
      'bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'short.link',
      'url.short', 'link.short', 'tiny.cc', 'is.gd', 'v.gd',
      'qr.ae', 'ow.ly', 'buff.ly', 'rebrand.ly', 'bit.do',
      'short.io', 'cutt.ly', 'short.link', 'tiny.one', 'short.url'
    ];
    
    const isShortened = shortenedDomains.some(domain => 
      urlObj.hostname.toLowerCase().includes(domain)
    );
    
    // Extract query parameters
    const queryParams: Record<string, string> = {};
    urlObj.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });
    
    return {
      isValid: true,
      isHttps: urlObj.protocol === 'https:',
      domain: urlObj.hostname,
      path: urlObj.pathname,
      queryParams,
      isShortened,
      redirects: [] // Would be populated by following redirects
    };
  } catch (error) {
    return {
      isValid: false,
      isHttps: false,
      domain: '',
      path: '',
      queryParams: {},
      isShortened: false,
      redirects: []
    };
  }
}

export async function followRedirects(url: string, maxRedirects: number = 5): Promise<string[]> {
  const redirects: string[] = [];
  let currentUrl = url;
  
  for (let i = 0; i < maxRedirects; i++) {
    try {
      const response = await fetch(currentUrl, {
        method: 'HEAD',
        redirect: 'manual'
      });
      
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (location) {
          redirects.push(location);
          currentUrl = location;
        } else {
          break;
        }
      } else {
        break;
      }
    } catch (error) {
      break;
    }
  }
  
  return redirects;
}

// Legacy types and functions for backward compatibility
export type PlatformCheck = {
  allowedHost: boolean;
  https: boolean;
  pathOk: boolean;
  platform: "gofundme" | "givebutter" | "justgiving" | "unknown";
  reason?: string;
};

// Strict platform checks: host allowlist, https, and path patterns.
const ALLOWED_HOSTS = new Set([
    "www.gofundme.com", "gofundme.com",
    "www.givebutter.com", "givebutter.com",
    "www.justgiving.com", "justgiving.com",
  ]);
  
export function checkFundraiserUrl(raw: string): PlatformCheck {
  let u: URL;
  try { u = new URL(raw); } catch { 
    return { allowedHost:false, https:false, pathOk:false, platform:"unknown", reason:"Invalid URL" };
  }

  const allowedHost = ALLOWED_HOSTS.has(u.hostname);
  const https = u.protocol === "https:";
  let platform: PlatformCheck["platform"] = "unknown";
  if (u.hostname.includes("gofundme")) platform = "gofundme";
  else if (u.hostname.includes("givebutter")) platform = "givebutter";
  else if (u.hostname.includes("justgiving")) platform = "justgiving";

  // Simple, demo-safe path patterns:
  let pathOk = true;
  if (platform === "gofundme") pathOk = /^\/f\/[a-z0-9\-]+/i.test(u.pathname) && !u.pathname.includes("/manage");
  if (platform === "givebutter") pathOk = /^\/(campaign|donate)\/[a-z0-9\-]+/i.test(u.pathname);
  if (platform === "justgiving") pathOk = /^\/page\/[a-z0-9\-]+/i.test(u.pathname);

  return { allowedHost, https, pathOk, platform, reason: allowedHost ? undefined : "Unrecognized host" };
}