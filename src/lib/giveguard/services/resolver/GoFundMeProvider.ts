import { ResolveResult, Signal } from './types';
/** Demo-only heuristic based on URL text. */
export async function resolveGoFundMe(url: string): Promise<Partial<ResolveResult> | null> {
  const signals: Signal[] = [{ label: 'GoFundMe URL detected', proof: url }];
  const lower = url.toLowerCase();
  const looksCharity = lower.includes('charity');
  if (looksCharity) {
    signals.push({ label: 'Looks like charity fundraiser (needs EIN to confirm)' });
    return { subjectType: 'charity', signals };
  }
  return { subjectType: 'personal', signals };
}
