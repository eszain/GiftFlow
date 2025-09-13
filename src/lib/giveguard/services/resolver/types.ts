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

