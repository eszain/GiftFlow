import { Metadata } from 'next';

export interface OpenGraphData {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  siteName?: string;
}

export async function fetchOpenGraph(url: string): Promise<OpenGraphData | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GiveGuard/1.0; +https://giftflow.com)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
      timeout: 10000,
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

    return Object.keys(result).length > 0 ? result : null;
    
  } catch (error) {
    console.error('Failed to fetch Open Graph data:', error);
    return null;
  }
}

