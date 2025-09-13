// src/services/verdict.ts
import type { PlatformCheck } from "./urlChecks";
import type { AiOut } from "./gemini";

export type FinalVerdict = {
  verdict: "LIKELY_LEGIT" | "REVIEW" | "SCAM_LIKELY";
  reason: string;
  ai?: AiOut;
  platform?: PlatformCheck;
  signals?: { label: string; weight?: number }[];
};

export function finalVerdict(p: PlatformCheck, ai: AiOut): FinalVerdict {
  if (!p.allowedHost || !p.https) {
    return {
        verdict: "SCAM_LIKELY",
        reason: p.reason || "Unrecognized or unsafe domain",
        ai: undefined,              // <- hide AI result for clarity
        platform: p,
      };
  }

  const ds = ai.detected_signals || {};
  if (ds.crypto_or_giftcards_only || ds.payment_off_platform) {
    return { verdict: "SCAM_LIKELY", reason: "Off-platform or crypto/giftcards only", ai, platform: p };
  }

  if (p.pathOk && ai.risk_band === "low") {
    return { verdict: "LIKELY_LEGIT", reason: "Known platform + low-risk content", ai, platform: p };
  }

  return { verdict: "REVIEW", reason: "Insufficient or mixed signals", ai, platform: p };
}
