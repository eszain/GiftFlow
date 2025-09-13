import { getCharityByEIN, eligibleForDeduction } from '../charityService';
import { resolveByEIN } from './IRSProvider';
import { resolveGoFundMe } from './GoFundMeProvider';
import { ResolveResult } from './types';

export interface ResolvedSubject {
  subjectType: 'charity' | 'personal';
  org?: any;
  deductible?: boolean;
  signals?: string[];
}

export async function resolveSubject({ url, ein, name }: {
  url?: string;
  ein?: string;
  name?: string;
}): Promise<ResolvedSubject | null> {
  try {
    // If EIN provided, try to resolve as charity
    if (ein) {
      const org = await getCharityByEIN(ein);
      if (org) {
        return {
          subjectType: 'charity',
          org,
          deductible: eligibleForDeduction(org),
          signals: ['EIN provided', 'IRS verification']
        };
      }
    }
    
    // If URL provided, try to extract charity info
    if (url) {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      
      // Check if it's a known charity domain
      const charityDomains = [
        'redcross.org',
        'unicef.org',
        'doctorswithoutborders.org',
        'savechildren.org',
        'worldwildlife.org',
        'nature.org',
        'cancer.org',
        'heart.org',
        'diabetes.org',
        'alz.org',
        'parkinsons.org',
        'arthritis.org',
        'lupus.org',
        'crohnsandcolitis.org',
        'autism.org',
        'specialolympics.org',
        'goodwill.org',
        'salvationarmy.org',
        'unitedway.org',
        'feedingamerica.org',
        'foodbank.org',
        'habitat.org',
        'bigbrothersbigsisters.org',
        'boysandgirlsclubs.org',
        'ymca.org',
        'ywca.org',
        'scouts.org',
        'girlscouts.org',
        '4h.org',
        'boyscouts.org',
        'girlscouts.org',
        'campfire.org',
        'boysandgirlsclubs.org',
        'bigbrothersbigsisters.org',
        'mentor.org',
        'cityyear.org',
        'americorps.org',
        'peacecorps.org',
        'habitat.org',
        'rebuildingtogether.org',
        'volunteermatch.org',
        'idealist.org',
        'dosomething.org',
        'volunteer.gov',
        'serve.gov',
        'nationalservice.gov',
        'corporationfornationalservice.gov',
        'americorps.gov',
        'peacecorps.gov'
      ];
      
      const isCharityDomain = charityDomains.some(domain => hostname.includes(domain));
      
      if (isCharityDomain) {
        // Mock charity data for known domains
        const mockOrg = {
          name: hostname.split('.')[0].replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          ein: '123456789',
          status: 'Active',
          subsection: '501(c)(3)',
          pub78Eligible: true
        };
        
        return {
          subjectType: 'charity',
          org: mockOrg,
          deductible: true,
          signals: ['Known charity domain', 'Official website']
        };
      }
    }
    
    // Default to personal fundraiser
    return {
      subjectType: 'personal',
      deductible: false,
      signals: ['Personal fundraiser', 'Individual campaign']
    };
    
  } catch (error) {
    console.error('Subject resolution error:', error);
    return null;
  }
}

// Legacy function for backward compatibility
function makeCacheKey(input: { url?: string; ein?: string }) {
  return input.ein ? `ein:${input.ein}` : `url:${input.url}`;
}

export async function resolveSubjectLegacy(input: { url?: string; ein?: string }): Promise<ResolveResult | null> {
  let result: ResolveResult = { subjectType: 'personal', deductible: false, signals: [], cacheKey: makeCacheKey(input) };

  if (input.ein) {
    const einPart = await resolveByEIN(input.ein);
    if (einPart) result = { ...result, ...einPart };
  }
  if (input.url && input.url.includes('gofundme.com')) {
    const gf = await resolveGoFundMe(input.url);
    if (gf) result = { ...result, ...gf };
  }

  if (result.subjectType === 'charity') {
    result.deductible = eligibleForDeduction({ pub78Eligible: result.org?.pub78_eligible, subsection: result.org?.subsection || null });
  } else {
    result.deductible = false;
  }

  return result;
}