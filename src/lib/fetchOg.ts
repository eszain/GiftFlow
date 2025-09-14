import { cacheGet, cacheSet } from "./cache";

export interface OpenGraphData {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  siteName?: string;
}

// Legacy type alias for backward compatibility
export type OgData = OpenGraphData;

export async function fetchOpenGraph(url: string, timeoutMs = 10000): Promise<OpenGraphData | null> {
  const cacheKey = `og:${url}`;
  const cached = cacheGet<OpenGraphData>(cacheKey);
  if (cached) return cached;

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GiveGuard/1.0; +https://giftflow.com)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
      signal: ctrl.signal as any,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    
    // Simple regex-based OG tag extraction
    const titleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"[^>]*>/i) ||
                      html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:title"[^>]*>/i);
    
    const descriptionMatch = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"[^>]*>/i) ||
                            html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:description"[^>]*>/i);
    
    const imageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"[^>]*>/i) ||
                      html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:image"[^>]*>/i);
    
    const urlMatch = html.match(/<meta[^>]*property="og:url"[^>]*content="([^"]*)"[^>]*>/i) ||
                    html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:url"[^>]*>/i);
    
    const siteNameMatch = html.match(/<meta[^>]*property="og:site_name"[^>]*content="([^"]*)"[^>]*>/i) ||
                         html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:site_name"[^>]*>/i);

    // Fallback to regular title tag
    const fallbackTitleMatch = !titleMatch && html.match(/<title[^>]*>([^<]*)<\/title>/i);

    const result: OpenGraphData = {};
    
    if (titleMatch?.[1]) result.title = titleMatch[1];
    else if (fallbackTitleMatch?.[1]) result.title = fallbackTitleMatch[1];
    
    if (descriptionMatch?.[1]) result.description = descriptionMatch[1];
    if (imageMatch?.[1]) result.image = imageMatch[1];
    if (urlMatch?.[1]) result.url = urlMatch[1];
    if (siteNameMatch?.[1]) result.siteName = siteNameMatch[1];

    const finalResult = Object.keys(result).length > 0 ? result : null;
    if (finalResult) {
      cacheSet(cacheKey, finalResult, 24 * 60 * 60 * 1000); // 24h
    }
    return finalResult;
    
  } catch (error) {
    console.error('Failed to fetch Open Graph data:', error);
    return null;
  } finally {
    clearTimeout(t);
  }
}
