import { NextRequest, NextResponse } from 'next/server';
import { getCharityByEIN, searchCharityByName } from '@/lib/giveguard/services/charityService';
import { analyzeCharityWithAI } from '@/lib/giveguard/services/aiAnalysis';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ein = searchParams.get('ein');
  const query = searchParams.get('query');

  if (ein) {
    const charity = await getCharityByEIN(ein);
    if (!charity) {
      return NextResponse.json({ error: 'Charity not found' }, { status: 404 });
    }
    
    // Generate AI analysis for charity
    const aiAnalysis = await analyzeCharityWithAI(charity);
    
    return NextResponse.json({
      ...charity,
      aiAnalysis
    });
  }

  if (query) {
    const results = await searchCharityByName(query);
    return NextResponse.json({ results });
  }

  return NextResponse.json({ error: 'Missing ein or query parameter' }, { status: 400 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ein, query } = body;

    if (ein) {
      const charity = await getCharityByEIN(ein);
      if (!charity) {
        return NextResponse.json({ error: 'Charity not found' }, { status: 404 });
      }
      
      // Generate AI analysis for charity
      const aiAnalysis = await analyzeCharityWithAI(charity);
      
      return NextResponse.json({
        ...charity,
        aiAnalysis
      });
    }

    if (query) {
      const results = await searchCharityByName(query);
      return NextResponse.json({ results });
    }

    return NextResponse.json({ error: 'Missing ein or query in body' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}