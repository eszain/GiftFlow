import { cache } from '@/lib/cache';
import { config } from '@/lib/giveguard/lib/config';

export interface CharityOrg {
  name: string;
  ein: string;
  status: string;
  subsection?: string;
  pub78Eligible: boolean;
  rating?: number;
  sources?: Array<{ name: string; url?: string }>;
}

export interface CharitySearchResult {
  name: string;
  ein: string;
  city?: string;
  state?: string;
  subsection?: string;
  pub78Eligible: boolean;
}

// Mock IRS API - In production, you'd use the real IRS API
export async function getCharityByEIN(ein: string): Promise<CharityOrg | null> {
  const cacheKey = `charity:ein:${ein}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock data - replace with real IRS API call
    const mockCharity: CharityOrg = {
      name: 'Sample Charity Organization',
      ein: ein,
      status: 'Active',
      subsection: '501(c)(3)',
      pub78Eligible: true,
      rating: 4.2,
      sources: [
        { name: 'IRS Pub 78', url: 'https://apps.irs.gov/app/eos/' },
        { name: 'Charity Navigator', url: 'https://www.charitynavigator.org/' }
      ]
    };

    cache.set(cacheKey, mockCharity, config.charity.cacheTtl);
    return mockCharity;
    
  } catch (error) {
    console.error('Error fetching charity by EIN:', error);
    return null;
  }
}

export async function searchCharityByName(query: string): Promise<CharitySearchResult[]> {
  const cacheKey = `charity:search:${query.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Mock search results - replace with real search API
    const mockResults: CharitySearchResult[] = [
      {
        name: `${query} Foundation`,
        ein: '123456789',
        city: 'New York',
        state: 'NY',
        subsection: '501(c)(3)',
        pub78Eligible: true
      },
      {
        name: `${query} Charity Inc.`,
        ein: '987654321',
        city: 'Los Angeles',
        state: 'CA',
        subsection: '501(c)(3)',
        pub78Eligible: true
      }
    ];

    cache.set(cacheKey, mockResults, config.charity.cacheTtl);
    return mockResults;
    
  } catch (error) {
    console.error('Error searching charity by name:', error);
    return [];
  }
}

export function eligibleForDeduction(org: CharityOrg): boolean {
  // Basic eligibility check
  return org.pub78Eligible && org.status === 'Active';
}