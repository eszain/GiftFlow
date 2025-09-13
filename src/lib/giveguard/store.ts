// Simple in-memory store for GiveGuard
// In production, you'd use a proper database

interface StoreEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

class GiveGuardStore {
  private store = new Map<string, StoreEntry>();

  set(key: string, data: any, ttlMs: number = 5 * 60 * 1000): void {
    this.store.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }

  get(key: string): any | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.store.delete(key);
      return null;
    }

    return entry.data;
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.store.delete(key);
      }
    }
  }
}

export const giveGuardStore = new GiveGuardStore();

// Clean up expired entries every 5 minutes
setInterval(() => {
  giveGuardStore.cleanup();
}, 5 * 60 * 1000);

