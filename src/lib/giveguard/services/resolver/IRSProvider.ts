import { ProviderResult, ResolveResult, Signal } from './types';
import { getCharityByEIN } from '../charityService';

export class IRSProvider {
  name = 'IRS';

  async search(query: string): Promise<ProviderResult> {
    try {
      // Mock IRS search - replace with real API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        success: true,
        data: {
          results: [
            {
              name: `${query} Foundation`,
              ein: '123456789',
              city: 'New York',
              state: 'NY',
              subsection: '501(c)(3)',
              pub78Eligible: true
            }
          ]
        }
      };
    } catch (error) {
      return {
        success: false,
        error: 'IRS search failed'
      };
    }
  }

  async getByEIN(ein: string): Promise<ProviderResult> {
    try {
      // Mock IRS lookup - replace with real API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return {
        success: true,
        data: {
          name: 'Sample Charity Organization',
          ein: ein,
          status: 'Active',
          subsection: '501(c)(3)',
          pub78Eligible: true
        }
      };
    } catch (error) {
      return {
        success: false,
        error: 'IRS lookup failed'
      };
    }
  }
}

// Legacy function for backward compatibility
export async function resolveByEIN(ein: string): Promise<Partial<ResolveResult> | null> {
  const org = await getCharityByEIN(ein);
  if (!org) return null;
  const signals: Signal[] = [{ label: 'IRS Pub 78 (seed) match', proof: `EIN ${ein}` }];
  return {
    subjectType: 'charity',
    org: { name: org.name, ein: org.ein, subsection: org.subsection || undefined, pub78_eligible: !!org.pub78Eligible },
    signals
  };
}