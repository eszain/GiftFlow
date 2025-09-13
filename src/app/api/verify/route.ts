import { NextRequest, NextResponse } from 'next/server';
import { getCharityByEIN, searchCharityByName, eligibleForDeduction } from '@/lib/giveguard/services/charityService';
import { resolveSubject } from '@/lib/giveguard/services/resolver';
import { checkFundraiserUrlSimple } from '@/lib/giveguard/services/simpleUrlClassifier';
import { fetchOpenGraph } from '@/lib/fetchOg';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

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

// Simple charity analysis function
async function analyzeCharityWithAI(org: any): Promise<{
  summary: string;
  legitimacy: 'verified' | 'suspicious' | 'unknown';
  keyInfo: string[];
  recommendations: string[];
}> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
Analyze this charity organization and provide a helpful summary.

Name: ${org.name}
EIN: ${org.ein}
Status: ${org.status}
Tax-deductible: ${org.pub78Eligible ? 'Yes' : 'No'}
Subsection: ${org.subsection || 'Not specified'}

Return JSON:
{
  "summary": "2-3 sentence summary of what this charity does",
  "legitimacy": "verified" | "suspicious" | "unknown",
  "keyInfo": ["info1", "info2", "info3"],
  "recommendations": ["recommendation1", "recommendation2"]
}

Focus on:
1. What the charity does
2. Its legitimacy based on available info
3. Key facts donors should know
4. Recommendations for donors

Return only valid JSON.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const analysis = JSON.parse(jsonMatch[0]);
    
    return {
      summary: analysis.summary || 'Unable to analyze charity',
      legitimacy: analysis.legitimacy || 'unknown',
      keyInfo: Array.isArray(analysis.keyInfo) ? analysis.keyInfo : [],
      recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations : []
    };
    
  } catch (error) {
    console.error('Charity AI Analysis Error:', error);
    return {
      summary: 'Unable to analyze charity - manual review recommended',
      legitimacy: 'unknown',
      keyInfo: ['Analysis failed'],
      recommendations: ['Verify through official sources']
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    if (type === 'charity') {
      const { ein, query } = data;
      
      if (!ein && !query) {
        return NextResponse.json({ error: 'Missing ein or query' }, { status: 400 });
      }

      if (ein) {
        const einSchema = z.string().regex(/^\d{9}$/);
        const normalized = (ein+'').replace(/\D/g,'');
        const parsed = einSchema.safeParse(normalized);
        if (!parsed.success) {
          return NextResponse.json({ error: 'Invalid EIN' }, { status: 400 });
        }
        
        const org = await getCharityByEIN(parsed.data);
        if (!org) {
          return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
        }
        
        const eligible = eligibleForDeduction(org as any);
        const aiSummary = await generateCharitySummary(org);
        const charityAI = await analyzeCharityWithAI(org);
        
        return NextResponse.json({
          subjectType: 'charity',
          org: {
            name: org.name,
            ein: org.ein,
            status: org.status,
            subsection: org.subsection,
            pub78_eligible: org.pub78Eligible
          },
          deductible: eligible,
          rating: org.rating || null,
          sources: org.sources || [],
          aiSummary: aiSummary,
          aiAnalysis: {
            isLegitimate: charityAI.legitimacy === 'verified',
            confidence: charityAI.legitimacy === 'verified' ? 90 : 60,
            riskLevel: charityAI.legitimacy === 'suspicious' ? 'high' : 'low',
            summary: charityAI.summary,
            keyFindings: charityAI.keyInfo,
            recommendations: charityAI.recommendations
          }
        });
      }

      const matches = await searchCharityByName(query);
      if (!matches.length) {
        return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
      }
      return NextResponse.json({ matches });
    }

    if (type === 'fundraiser') {
      const { url, text } = data;
      
      if (!url) {
        return NextResponse.json({ error: 'Missing URL' }, { status: 400 });
      }

      // Fetch Open Graph data for preview
      const preview = await fetchOpenGraph(url);
      
      // Use the simple URL classifier
      const urlCheck = await checkFundraiserUrlSimple(url);
      
      if (!urlCheck.ok) {
        return NextResponse.json({ 
          error: 'NOT_FOUND', 
          message: 'Invalid or inaccessible URL',
          subjectType: 'personal',
          platform: urlCheck.platform,
          platformVerified: urlCheck.platformVerified,
          aiAnalysis: urlCheck.aiAnalysis
        }, { status: 404 });
      }

      // Try to resolve as charity first
      const base = await resolveSubject({ url });

      if (base && base.subjectType === 'charity') {
        // Get AI analysis for charity
        const charityAI = await analyzeCharityWithAI(base.org);
        
        return NextResponse.json({
          subjectType: 'charity',
          org: base.org,
          deductible: base.deductible,
          signals: base.signals,
          platform: urlCheck.platform,
          platformVerified: urlCheck.platformVerified,
          aiAnalysis: {
            isLegitimate: true,
            confidence: 90,
            riskLevel: 'low',
            summary: charityAI.summary,
            keyFindings: charityAI.keyInfo,
            recommendations: charityAI.recommendations,
            platformVerified: urlCheck.platformVerified,
            contentAnalysis: {
              urgencyLevel: 'normal',
              emotionalAppeal: 'appropriate',
              transparency: 'high',
              socialProof: 'strong'
            }
          }
        });
      }

      // For personal fundraisers, use the simple verification
      const scamProb = urlCheck.aiAnalysis?.scamProbability || 30;
      const confidence = urlCheck.aiAnalysis?.confidence || 70;
      const isLegitimate = urlCheck.aiAnalysis?.verdict === 'legitimate' || (scamProb < 40 && confidence > 60);
      
      const aiAnalysis = {
        isLegitimate: isLegitimate,
        confidence: Math.max(confidence, 60),
        riskLevel: urlCheck.aiAnalysis?.verdict === 'scam' ? 'scam' :
                  urlCheck.aiAnalysis?.verdict === 'suspicious' ? 'high' :
                  scamProb > 70 ? 'medium' : 'low',
        summary: `This ${urlCheck.platform || 'fundraising'} campaign ${isLegitimate ? 'appears legitimate' : 
                  urlCheck.aiAnalysis?.verdict === 'suspicious' ? 'shows some concerns' : 'has significant risks'}. ` +
                  `AI analysis indicates ${scamProb}% scam probability with ${Math.max(confidence, 60)}% confidence.`,
        keyFindings: urlCheck.aiAnalysis?.reasons || ['Analysis completed'],
        recommendations: [
          'Verify through official platform channels',
          'Check for recent updates and donor activity',
          'Review organizer profile and history'
        ],
        platformVerified: urlCheck.platformVerified,
        contentAnalysis: {
          urgencyLevel: 'normal',
          emotionalAppeal: 'appropriate',
          transparency: isLegitimate ? 'high' : 'medium',
          socialProof: isLegitimate ? 'strong' : 'weak'
        }
      };
      
      return NextResponse.json({
        subjectType: 'personal',
        platform: urlCheck.platform,
        platformVerified: urlCheck.platformVerified,
        aiAnalysis: aiAnalysis,
        scrapedContent: urlCheck.scrapedContent,
        preview: preview,
        trustScore: urlCheck.aiAnalysis?.scamProbability ? (100 - urlCheck.aiAnalysis.scamProbability) : 50,
        verdict: urlCheck.aiAnalysis?.verdict === 'scam' ? 'scam' : 
                 urlCheck.aiAnalysis?.verdict === 'suspicious' ? 'medium' : 'high',
        deductible: false
      });
    }

    return NextResponse.json({ error: 'Invalid verification type' }, { status: 400 });

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}

