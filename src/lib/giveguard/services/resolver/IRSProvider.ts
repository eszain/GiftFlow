import { getCharityByEIN } from '../charityService';
import { ResolveResult, Signal } from './types';

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
