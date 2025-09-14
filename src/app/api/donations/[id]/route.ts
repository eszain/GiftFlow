import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

// GET /api/donations/[id] - Get a specific donation
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find user in our database
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! }
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get donation
    const donation = await prisma.donation.findFirst({
      where: {
        id: params.id,
        patronId: dbUser.id // Ensure user can only access their own donations
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

    if (!donation) {
      return NextResponse.json({ error: 'Donation not found' }, { status: 404 });
    }

    return NextResponse.json({
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
      receiptData: donation.receiptData,
      listingTitle: donation.listing.title,
      listingId: donation.listingId,
      createdAt: donation.createdAt,
      updatedAt: donation.updatedAt
    });

  } catch (error) {
    console.error('Error fetching donation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch donation' },
      { status: 500 }
    );
  }
}

// PUT /api/donations/[id] - Update a donation
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { receiptUrl, receiptData } = body;

    // Find user in our database
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! }
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update donation (only allow updating receipt info)
    const donation = await prisma.donation.updateMany({
      where: {
        id: params.id,
        patronId: dbUser.id // Ensure user can only update their own donations
      },
      data: {
        receiptUrl,
        receiptData,
        updatedAt: new Date()
      }
    });

    if (donation.count === 0) {
      return NextResponse.json({ error: 'Donation not found' }, { status: 404 });
    }

    // Get updated donation
    const updatedDonation = await prisma.donation.findUnique({
      where: { id: params.id },
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

    return NextResponse.json({
      success: true,
      donation: {
        id: updatedDonation!.id,
        date: updatedDonation!.donationDate.toISOString().split('T')[0],
        organizationName: updatedDonation!.organizationName,
        ein: updatedDonation!.einNumber,
        amount: updatedDonation!.amountCents,
        amountUSD: updatedDonation!.amountCents / 100,
        currency: updatedDonation!.currency,
        deductible: updatedDonation!.deductible,
        subjectType: updatedDonation!.listing.taxDeductible ? 'charity' : 'personal',
        receiptUrl: updatedDonation!.receiptUrl,
        receiptData: updatedDonation!.receiptData,
        listingTitle: updatedDonation!.listing.title,
        listingId: updatedDonation!.listingId
      }
    });

  } catch (error) {
    console.error('Error updating donation:', error);
    return NextResponse.json(
      { error: 'Failed to update donation' },
      { status: 500 }
    );
  }
}

// DELETE /api/donations/[id] - Delete a donation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find user in our database
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! }
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get donation first to update listing amount
    const donation = await prisma.donation.findFirst({
      where: {
        id: params.id,
        patronId: dbUser.id // Ensure user can only delete their own donations
      }
    });

    if (!donation) {
      return NextResponse.json({ error: 'Donation not found' }, { status: 404 });
    }

    // Check if donation is within 24 hours (as per RLS policy)
    const hoursSinceCreation = (Date.now() - donation.createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation > 24) {
      return NextResponse.json(
        { error: 'Donations can only be deleted within 24 hours of creation' },
        { status: 403 }
      );
    }

    // Delete donation
    await prisma.donation.delete({
      where: { id: params.id }
    });

    // Update listing amount raised (subtract the deleted donation)
    await prisma.listing.update({
      where: { id: donation.listingId },
      data: {
        amountRaised: {
          decrement: donation.amountCents / 100 // Convert cents to decimal
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Donation deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting donation:', error);
    return NextResponse.json(
      { error: 'Failed to delete donation' },
      { status: 500 }
    );
  }
}
