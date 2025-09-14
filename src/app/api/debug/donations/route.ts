import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Debug endpoint to test donations table
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Test if donations table exists and is accessible
    const { data: donations, error: donationsError } = await supabase
      .from('donations')
      .select('*')
      .limit(5);

    if (donationsError) {
      return NextResponse.json({
        error: 'Donations table error',
        details: donationsError.message,
        code: donationsError.code,
        hint: donationsError.hint
      }, { status: 500 });
    }

    // Test if we can insert a test donation
    const testDonation = {
      patron_id: user.id,
      listing_id: 'test-listing-id', // This will fail foreign key constraint, but we can see the error
      organization_name: 'Test Organization',
      ein_number: '12-3456789',
      amount_cents: 1000, // $10.00
      currency: 'USD',
      deductible: true,
      donation_date: new Date().toISOString()
    };

    const { data: insertData, error: insertError } = await supabase
      .from('donations')
      .insert(testDonation)
      .select();

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email
      },
      donationsTable: {
        exists: true,
        recordCount: donations?.length || 0,
        sampleRecords: donations
      },
      insertTest: {
        attempted: true,
        success: !insertError,
        error: insertError?.message,
        data: insertData
      }
    });

  } catch (error) {
    console.error('Debug donations error:', error);
    return NextResponse.json(
      { 
        error: 'Debug failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
