import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { fulfillWishSchema } from '@/lib/validations/wish';
import { userRolesSchema } from '@/lib/validations/user';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

// POST /api/wishes/[id]/fulfill - Fulfill a wish (Patron only)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const wishId = params.id;
    const body = await request.json();
    const validatedData = fulfillWishSchema.parse(body);

    // Get user and wish
    const [user, wish] = await Promise.all([
      prisma.user.findUnique({
        where: { clerkUserId: userId },
      }),
      prisma.wish.findUnique({
        where: { id: wishId },
        include: {
          charity: true,
          fulfillments: true,
        },
      }),
    ]);

    if (!user || !wish) {
      return NextResponse.json({ error: 'User or wish not found' }, { status: 404 });
    }

    // Check if user has patron role
    const roles = userRolesSchema.parse(user.roles);
    if (!roles.patron) {
      return NextResponse.json({ error: 'Patron role required' }, { status: 403 });
    }

    // Check email verification
    if (!user.emailVerified) {
      return NextResponse.json({ error: 'Email verification required' }, { status: 403 });
    }

    // Check if wish is eligible for fulfillment
    if (wish.status !== 'ELIGIBLE') {
      return NextResponse.json({ 
        error: 'Wish is not eligible for fulfillment' 
      }, { status: 400 });
    }

    // Check if user is trying to fulfill their own wish
    if (wish.charityId === user.id) {
      return NextResponse.json({ 
        error: 'Cannot fulfill your own wish' 
      }, { status: 400 });
    }

    // Check if wish has a target amount and if fulfillment would exceed it
    if (wish.amountCents) {
      const totalFulfilled = wish.fulfillments
        .filter(f => f.status === 'SUCCEEDED')
        .reduce((sum, f) => sum + f.amountCents, 0);

      if (totalFulfilled + validatedData.amountCents > wish.amountCents) {
        return NextResponse.json({ 
          error: 'Fulfillment amount would exceed wish target' 
        }, { status: 400 });
      }
    }

    // Create fulfillment record
    const fulfillment = await prisma.fulfillment.create({
      data: {
        wishId: wish.id,
        patronId: user.id,
        amountCents: validatedData.amountCents,
        provider: validatedData.provider,
        status: 'INITIATED',
        receiptUrl: validatedData.receiptUrl,
      },
    });

    // Process payment based on provider
    let paymentResult;
    switch (validatedData.provider) {
      case 'STRIPE':
        try {
          // Create Stripe payment intent
          const paymentIntent = await stripe.paymentIntents.create({
            amount: validatedData.amountCents,
            currency: 'usd',
            metadata: {
              wishId: wish.id,
              fulfillmentId: fulfillment.id,
              patronId: user.id,
              charityId: wish.charityId,
            },
            description: `GiftFlow fulfillment: ${wish.title}`,
          });

          paymentResult = {
            success: true,
            paymentIntentId: paymentIntent.id,
            clientSecret: paymentIntent.client_secret,
          };
        } catch (stripeError) {
          console.error('Stripe payment failed:', stripeError);
          paymentResult = {
            success: false,
            error: 'Payment processing failed',
          };
        }
        break;

      case 'DIRECT_VENDOR':
        // For direct vendor payments, we assume the patron handles payment directly
        // and provides a receipt URL
        paymentResult = {
          success: true,
          message: 'Direct vendor payment - receipt required',
        };
        break;

      case 'MANUAL_CHECK':
        // For manual checks, we assume the patron will send a check
        paymentResult = {
          success: true,
          message: 'Manual check payment - confirmation required',
        };
        break;

      default:
        paymentResult = {
          success: false,
          error: 'Invalid payment provider',
        };
    }

    // Update fulfillment status based on payment result
    if (paymentResult.success) {
      await prisma.fulfillment.update({
        where: { id: fulfillment.id },
        data: { status: 'SUCCEEDED' },
      });

      // Check if wish is now fully fulfilled
      const updatedWish = await prisma.wish.findUnique({
        where: { id: wishId },
        include: { fulfillments: true },
      });

      if (updatedWish && updatedWish.amountCents) {
        const totalFulfilled = updatedWish.fulfillments
          .filter(f => f.status === 'SUCCEEDED')
          .reduce((sum, f) => sum + f.amountCents, 0);

        if (totalFulfilled >= updatedWish.amountCents) {
          await prisma.wish.update({
            where: { id: wishId },
            data: { status: 'FULFILLED' },
          });
        }
      }

      // Generate tax receipt (placeholder for now)
      const receiptUrl = await generateTaxReceipt(fulfillment.id, user, wish, validatedData.amountCents);
      
      await prisma.fulfillment.update({
        where: { id: fulfillment.id },
        data: { taxDocsUrl: receiptUrl },
      });

    } else {
      await prisma.fulfillment.update({
        where: { id: fulfillment.id },
        data: { status: 'FAILED' },
      });
    }

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        entityType: 'fulfillment',
        entityId: fulfillment.id,
        action: 'create',
        details: {
          wishId: wish.id,
          amount: validatedData.amountCents,
          provider: validatedData.provider,
          success: paymentResult.success,
        },
      },
    });

    return NextResponse.json({
      fulfillmentId: fulfillment.id,
      status: paymentResult.success ? 'SUCCEEDED' : 'FAILED',
      paymentResult,
      message: paymentResult.success 
        ? 'Wish fulfilled successfully' 
        : 'Fulfillment failed',
    });

  } catch (error) {
    console.error('Wish fulfillment failed:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to generate tax receipt
async function generateTaxReceipt(
  fulfillmentId: string,
  patron: any,
  wish: any,
  amountCents: number
): Promise<string> {
  // This is a placeholder implementation
  // In a real application, you would generate a proper PDF receipt
  const receiptData = {
    fulfillmentId,
    patronName: patron.displayName || 'Anonymous Patron',
    wishTitle: wish.title,
    amount: amountCents / 100,
    date: new Date().toISOString(),
    taxDeductible: true,
    noGoodsOrServices: true,
  };

  // For now, return a placeholder URL
  // In production, you would upload this to a secure storage service
  return `https://giftflow.com/receipts/${fulfillmentId}.pdf`;
}
