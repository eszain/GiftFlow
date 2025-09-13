// Strict platform checks: host allowlist, https, and path patterns.
const ALLOWED_HOSTS = new Set([
    "www.gofundme.com", "gofundme.com",
    "www.givebutter.com", "givebutter.com",
    "www.justgiving.com", "justgiving.com",
  ]);
  
  export type PlatformCheck = {
    allowedHost: boolean;
    https: boolean;
    pathOk: boolean;
    platform: "gofundme" | "givebutter" | "justgiving" | "unknown";
    reason?: string;
  };
  
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
  