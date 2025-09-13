import { charities, Org } from '../store';

export async function getCharityByEIN(ein: string): Promise<Org | null> {
  return charities.find(c => c.ein === ein) || null;
}

export async function searchCharityByName(q: string): Promise<Pick<Org,'name'|'ein'>[]> {
  return charities
    .filter(c => c.name.toLowerCase().includes(q.toLowerCase()))
    .slice(0,5)
    .map(c => ({ name: c.name, ein: c.ein }));
}

export function eligibleForDeduction(org?: { pub78Eligible?: boolean | null, subsection?: string | null }): boolean {
  return !!(org?.pub78Eligible && (org?.subsection || '').includes('501'));
}
