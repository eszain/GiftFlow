import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { donations, charities } from '@/lib/giveguard/store';

export interface DonationSummary {
  id: number;
  date: string;
  organizationName: string;
  ein?: string;
  amount: number; // in cents
  amountUSD: number; // converted to USD
  currency: string;
  deductible: boolean;
  subjectType: 'charity' | 'personal';
  receiptUrl?: string;
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

    // For now, we'll use the in-memory donations array
    // In production, you'd fetch from a proper database filtered by user ID
    const userDonations = donations.filter(donation => {
      const donationYear = new Date(donation.createdAt).getFullYear();
      return donationYear === year;
    });

    // Convert donations to summary format
    const donationSummaries: DonationSummary[] = userDonations.map(donation => {
      let organizationName = 'Unknown Organization';
      let ein: string | undefined;

      if (donation.subjectType === 'charity') {
        // Find charity by EIN or subjectId
        const charity = charities.find(c => 
          c.ein === donation.subjectId?.toString() || 
          c.ein === donation.subjectId?.toString()
        );
        if (charity) {
          organizationName = charity.name;
          ein = charity.ein;
        }
      } else {
        organizationName = 'Personal Fundraiser';
      }

      // Convert amount to USD (assuming all amounts are in cents)
      const amountUSD = donation.currency === 'USD' ? donation.amount / 100 : donation.amount / 100;

      return {
        id: donation.id,
        date: donation.createdAt.toISOString().split('T')[0], // YYYY-MM-DD format
        organizationName,
        ein,
        amount: donation.amount,
        amountUSD,
        currency: donation.currency,
        deductible: donation.deductible,
        subjectType: donation.subjectType,
        receiptUrl: `/receipts/${donation.id}` // Placeholder for receipt URL
      };
    });

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
