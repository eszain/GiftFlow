export type TrustSignal = { label: string; weight: number; proof?: string };

export function computeTrustScore(signals: TrustSignal[]): { score: number; verdict: 'low'|'medium'|'high' } {
  const base = signals.reduce((acc, s) => acc + s.weight, 0);
  const score = Math.max(0, Math.min(100, base));
  let verdict: 'low'|'medium'|'high' = 'low';
  if (score > 70) verdict = 'high';
  else if (score >= 40) verdict = 'medium';
  return { score, verdict };
}
