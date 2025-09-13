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

