import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

// GET /api/donations - Get all donations for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get year from query params (default to current year)
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

    // Find user in our database
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! }
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get donations for the user filtered by year
    const donations = await prisma.donation.findMany({
      where: {
        patronId: dbUser.id,
        donationDate: {
          gte: new Date(year, 0, 1), // Start of year
          lt: new Date(year + 1, 0, 1) // Start of next year
        }
      },
      include: {
        listing: {
          select: {
            title: true,
            charityName: true,
            charityEin: true,
            taxDeductible: true
          }
        }
      },
      orderBy: {
        donationDate: 'desc'
      }
    });

    // Transform donations to match the expected format
    const transformedDonations = donations.map(donation => ({
      id: donation.id,
      date: donation.donationDate.toISOString().split('T')[0],
      organizationName: donation.organizationName,
      ein: donation.einNumber,
      amount: donation.amountCents,
      amountUSD: donation.amountCents / 100, // Convert cents to dollars
      currency: donation.currency,
      deductible: donation.deductible,
      subjectType: donation.listing.taxDeductible ? 'charity' : 'personal',
      receiptUrl: donation.receiptUrl,
      listingTitle: donation.listing.title,
      listingId: donation.listingId
    }));

    // Calculate totals
    const totals = {
      totalDonated: transformedDonations.reduce((sum, d) => sum + d.amountUSD, 0),
      totalDeductible: transformedDonations
        .filter(d => d.deductible)
        .reduce((sum, d) => sum + d.amountUSD, 0),
      totalNonDeductible: transformedDonations
        .filter(d => !d.deductible)
        .reduce((sum, d) => sum + d.amountUSD, 0),
      donationCount: transformedDonations.length,
      year
    };

    return NextResponse.json({
      donations: transformedDonations,
      totals,
      year
    });

  } catch (error) {
    console.error('Error fetching donations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch donations' },
      { status: 500 }
    );
  }
}

// POST /api/donations - Create a new donation
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      listingId,
      amountCents,
      currency = 'USD',
      receiptUrl,
      receiptData
    } = body;

    // Validate required fields
    if (!listingId || !amountCents) {
      return NextResponse.json(
        { error: 'Missing required fields: listingId, amountCents' },
        { status: 400 }
      );
    }

    // Find user in our database
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! }
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get listing details
    const listing = await prisma.listing.findUnique({
      where: { id: listingId }
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Create donation
    const donation = await prisma.donation.create({
      data: {
        patronId: dbUser.id,
        listingId: listingId,
        organizationName: listing.charityName,
        einNumber: listing.charityEin,
        amountCents: parseInt(amountCents),
        currency,
        deductible: listing.taxDeductible,
        receiptUrl,
        receiptData,
        donationDate: new Date()
      },
      include: {
        listing: {
          select: {
            title: true,
            charityName: true,
            charityEin: true,
            taxDeductible: true
          }
        }
      }
    });

    // Update listing amount raised
    await prisma.listing.update({
      where: { id: listingId },
      data: {
        amountRaised: {
          increment: amountCents / 100 // Convert cents to decimal
        }
      }
    });

    return NextResponse.json({
      success: true,
      donation: {
        id: donation.id,
        date: donation.donationDate.toISOString().split('T')[0],
        organizationName: donation.organizationName,
        ein: donation.einNumber,
        amount: donation.amountCents,
        amountUSD: donation.amountCents / 100,
        currency: donation.currency,
        deductible: donation.deductible,
        subjectType: donation.listing.taxDeductible ? 'charity' : 'personal',
        receiptUrl: donation.receiptUrl,
        listingTitle: donation.listing.title,
        listingId: donation.listingId
      }
    });

  } catch (error) {
    console.error('Error creating donation:', error);
    return NextResponse.json(
      { error: 'Failed to create donation' },
      { status: 500 }
    );
  }
}
