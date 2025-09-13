import fetch from "node-fetch";
import { cacheGet, cacheSet } from "./cache";

export type OgData = { title?: string; description?: string; image?: string; };

export async function fetchOpenGraph(url: string, timeoutMs = 5000): Promise<OgData> {
  const cacheKey = `og:${url}`;
  const cached = cacheGet<OgData>(cacheKey);
  if (cached) return cached;

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "GiveGuard/1.0 (+demo)",
        "Accept": "text/html,application/xhtml+xml",
      },
      signal: ctrl.signal as any,
    });
    if (!res.ok) return {};

    const html = await res.text();

    const pick = (re: RegExp) => html.match(re)?.[1]?.trim();
    const title = pick(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
               || pick(/<meta[^>]+name=["']title["'][^>]+content=["']([^"']+)["']/i);
    const description = pick(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)
                     || pick(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
    const image = pick(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);

    const og = { title, description, image };
    cacheSet(cacheKey, og, 24 * 60 * 60 * 1000); // 24h
    return og;
  } catch {
    return {};
  } finally {
    clearTimeout(t);
  }
}
