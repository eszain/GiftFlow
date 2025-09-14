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

// Legacy types and data for backward compatibility
export type Org = {
  name: string;
  ein: string;           // 9 digits
  status?: string;       // 'eligible' | 'revoked' | ...
  subsection?: string;   // '501(c)(3)' etc
  pub78Eligible?: boolean;
  sources?: any[];
  lastCheckedAt?: Date;
  rating?: any;
};

export const charities: Org[] = [
  {
    name: "Doctors Without Borders USA",
    ein: "133433452",
    status: "eligible",
    subsection: "501(c)(3)",
    pub78Eligible: true,
    sources: [{ name: "IRS Pub 78 (seed)", ref: "local-list" }],
  },
  {
    name: "American Red Cross",
    ein: "530196605",
    status: "eligible",
    subsection: "501(c)(3)",
    pub78Eligible: true,
    sources: [{ name: "IRS Pub 78 (seed)", ref: "local-list" }],
  },
  {
    name: "World Central Kitchen",
    ein: "273521132",
    status: "eligible",
    subsection: "501(c)(3)",
    pub78Eligible: true,
    sources: [{ name: "IRS Pub 78 (seed)", ref: "local-list" }],
  },
];

export type Donation = {
  id: number;
  subjectType: 'charity'|'personal';
  subjectId?: number;
  amount: number;         // cents
  currency: string;
  deductible: boolean;
  createdAt: Date;
};

export const donations: Donation[] = [];

export type Campaign = {
  id: number;
  platform: string;
  url: string;
  title?: string;
  ownerName?: string;
  subjectType: 'charity'|'personal';
  linkedEin?: string;
  createdAt: Date;
};

export const campaigns: Campaign[] = [];