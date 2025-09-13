
import { Router } from 'express';
import { z } from 'zod';
import { getCharityByEIN, searchCharityByName, eligibleForDeduction } from '../services/charityService';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Generate AI summary for charity
async function generateCharitySummary(org: any): Promise<string | null> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `Create a brief, helpful summary (2-3 sentences) for this charity:
    
Name: ${org.name}
EIN: ${org.ein}
Status: ${org.status}
Tax-deductible: ${org.pub78Eligible ? 'Yes' : 'No'}

Focus on what the charity does and its legitimacy. Be concise and informative.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
    
  } catch (error) {
    console.error('AI charity summary generation failed:', error);
    return null;
  }
}

const router = Router();
const einSchema = z.string().regex(/^\d{9}$/);

router.get('/verify/charity', async (req, res) => {
  const { ein, query } = req.query as Record<string,string|undefined>;
  if (!ein && !query) return res.status(400).json({ error: 'Missing ein or query' });

  if (ein) {
    const normalized = (ein+'').replace(/\D/g,'');
    const parsed = einSchema.safeParse(normalized);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid EIN' });
    const org = await getCharityByEIN(parsed.data);
    if (!org) return res.status(404).json({ error: 'NOT_FOUND' });
    const eligible = eligibleForDeduction(org as any);
    
    // Generate AI summary
    const aiSummary = await generateCharitySummary(org);
    
    return res.json({
      org: {
        name: org.name,
        ein: org.ein,
        status: org.status,
        subsection: org.subsection,
        pub78_eligible: org.pub78Eligible
      },
      eligible_for_tax_deduction: eligible,
      rating: org.rating || null,
      sources: org.sources || [],
      aiSummary: aiSummary
    });
  }

  const matches = await searchCharityByName(query!);
  if (!matches.length) return res.status(404).json({ error: 'NOT_FOUND' });
  return res.json({ matches });
});

export default router;
