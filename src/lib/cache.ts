// Simple in-memory cache for development
// In production, you'd use Redis or similar

interface CacheEntry {
  value: any;
  expires: number;
}

class SimpleCache {
  private cache = new Map<string, CacheEntry>();
  private defaultTtl = 5 * 60 * 1000; // 5 minutes

  set(key: string, value: any, ttlMs?: number): void {
    const expires = Date.now() + (ttlMs || this.defaultTtl);
    this.cache.set(key, { value, expires });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export const cache = new SimpleCache();

