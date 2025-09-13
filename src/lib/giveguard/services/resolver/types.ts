export interface ProviderResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface CharityProvider {
  name: string;
  search(query: string): Promise<ProviderResult>;
  getByEIN(ein: string): Promise<ProviderResult>;
}

export interface FundraiserProvider {
  name: string;
  extractData(url: string): Promise<ProviderResult>;
  verify(url: string): Promise<ProviderResult>;
}

// Legacy types for backward compatibility
export type Signal = { label: string; weight?: number; proof?: string };

export type ResolveResult = {
  subjectType: 'charity' | 'personal';
  title?: string;
  org?: { name: string; ein?: string; subsection?: string; pub78_eligible?: boolean };
  deductible: boolean;
  signals: Signal[];
  cacheKey: string;
};