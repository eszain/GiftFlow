import { Router } from "express";
import { z } from "zod";
import { checkFundraiserUrl } from "../../../services/urlChecks";
import { fetchOpenGraph } from "../../../lib/fetchOg";

// OPTIONAL: your AI risk-banding + summary that ONLY uses user-provided text.
// If you already built these, import and call them here.
// import { analyzeWithGemini } from "../services/ai/gemini";
// import { summarizeFundraiser } from "../services/ai/summary";

const router = Router();

const bodySchema = z.object({
  url: z.string().url(),
  // user-consented text; never scrape page bodies
  text: z.string().max(8000).optional(),
});

router.post("/verify/fundraiser", async (req, res) => {
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "BAD_REQUEST", message: parsed.error.flatten() });

  const { url, text } = parsed.data;

  // 1) Deterministic URL checks
  const p = checkFundraiserUrl(url);

  // Scam-likely on host/protocol failures; do not show AI
  if (!p.allowedHost || !p.https) {
    return res.json({
      subjectType: "personal",
      platform: p.platform,
      allowedHost: p.allowedHost,
      https: p.https,
      pathOk: p.pathOk,
      verdict: "SCAM_LIKELY",
      reason: p.reason || "Unrecognized or unsafe domain",
      preview: undefined,
      ai: undefined,
      summary: undefined,
      deductible: false
    });
  }

  // 2) OG metadata (safe, public) — only for valid platform/paths
  let preview = p.pathOk ? await fetchOpenGraph(url) : undefined;

  // 3) Optional AI (user text only) — bands + reasons; no % confidence
  // const ai = text ? await analyzeWithGemini(url, text) : undefined;
  // const summary = (text && p.pathOk) ? await summarizeFundraiser(text) : undefined;

  // 4) Conservative verdict
  // If you have AI: LIKELY_LEGIT only when (p.pathOk && ai.risk_band==='low'); else REVIEW.
  const verdict = p.pathOk ? "REVIEW" : "REVIEW";
  const reason = p.pathOk ? "Insufficient or mixed signals" : "Unrecognized path for this platform";

  return res.json({
    subjectType: "personal",
    platform: p.platform,
    allowedHost: p.allowedHost,
    https: p.https,
    pathOk: p.pathOk,
    verdict,
    reason,
    preview,          // { title, description, image }
    // ai,            // enable if you wire Gemini
    // summary,       // enable if you wire Gemini summary
    deductible: false
  });
});

export default router;
