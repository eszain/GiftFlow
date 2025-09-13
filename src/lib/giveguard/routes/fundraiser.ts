import { NextRequest, NextResponse } from 'next/server';
import { checkFundraiserUrlSimple } from '@/lib/giveguard/services/simpleUrlClassifier';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: 'Missing URL' }, { status: 400 });
    }

    const result = await checkFundraiserUrlSimple(url);
    
    if (!result.ok) {
      return NextResponse.json({ 
        error: 'URL verification failed',
        details: result 
      }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ 
      error: 'Verification failed' 
    }, { status: 500 });
  }
}

