import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export interface DonationSummary {
  id: string;
  date: string;
  organizationName: string;
  ein?: string;
  amount: number; // in cents
  amountUSD: number; // converted to USD
  currency: string;
  deductible: boolean;
  subjectType: 'charity' | 'personal';
  receiptUrl?: string;
  listingTitle?: string;
  listingId?: string;
}

export interface DonationTotals {
  totalDonated: number;
  totalDeductible: number;
  totalNonDeductible: number;
  donationCount: number;
  year: number;
}

// GET /api/donations/summary - Get donation summary for tax filing
export async function GET(request: NextRequest) {
  try {
    // Authenticate user with Supabase
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get year from query params (default to current year)
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

    // Get donations for the user filtered by year using Supabase directly
    const { data: donations, error: donationsError } = await supabase
      .from('donations')
      .select(`
        *,
        listing:listings(
          title,
          charity_name,
          charity_ein,
          tax_deductible
        )
      `)
      .eq('patron_id', user.id)
      .gte('donation_date', `${year}-01-01`)
      .lt('donation_date', `${year + 1}-01-01`)
      .order('donation_date', { ascending: false });

    if (donationsError) {
      console.error('Error fetching donations:', donationsError);
      return NextResponse.json(
        { error: 'Failed to fetch donations', details: donationsError.message },
        { status: 500 }
      );
    }

    // Convert donations to summary format
    const donationSummaries: DonationSummary[] = (donations || []).map(donation => ({
      id: donation.id,
      date: donation.donation_date.split('T')[0], // YYYY-MM-DD format
      organizationName: donation.organization_name,
      ein: donation.ein_number,
      amount: donation.amount_cents,
      amountUSD: donation.amount_cents / 100, // Convert cents to dollars
      currency: donation.currency,
      deductible: donation.deductible,
      subjectType: donation.listing?.tax_deductible ? 'charity' : 'personal',
      receiptUrl: donation.receipt_url,
      listingTitle: donation.listing?.title,
      listingId: donation.listing_id
    }));

    // Calculate totals
    const totals: DonationTotals = {
      totalDonated: donationSummaries.reduce((sum, d) => sum + d.amountUSD, 0),
      totalDeductible: donationSummaries
        .filter(d => d.deductible)
        .reduce((sum, d) => sum + d.amountUSD, 0),
      totalNonDeductible: donationSummaries
        .filter(d => !d.deductible)
        .reduce((sum, d) => sum + d.amountUSD, 0),
      donationCount: donationSummaries.length,
      year
    };

    return NextResponse.json({
      donations: donationSummaries,
      totals,
      year
    });

  } catch (error) {
    console.error('Error fetching donation summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch donation summary' },
      { status: 500 }
    );
  }
}
