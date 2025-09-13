import { resolveByEIN } from './IRSProvider';
import { resolveGoFundMe } from './GoFundMeProvider';
import { ResolveResult } from './types';
import { eligibleForDeduction } from '../charityService';

function makeCacheKey(input: { url?: string; ein?: string }) {
  return input.ein ? `ein:${input.ein}` : `url:${input.url}`;
}

export async function resolveSubject(input: { url?: string; ein?: string }): Promise<ResolveResult | null> {
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
