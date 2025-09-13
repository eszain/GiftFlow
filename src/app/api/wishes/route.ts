import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { createWishSchema } from '@/lib/validations/wish';
import { runVerificationPipeline, saveVerificationResults } from '@/lib/tax-verifier/pipeline';
import { userRolesSchema } from '@/lib/validations/user';

// POST /api/wishes - Create a new wish (Charity only)
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has charity role
    const roles = userRolesSchema.parse(user.roles);
    if (!roles.charity) {
      return NextResponse.json({ error: 'Charity role required' }, { status: 403 });
    }

    // Check email verification
    if (!user.emailVerified) {
      return NextResponse.json({ error: 'Email verification required' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createWishSchema.parse(body);

    // Create wish in database
    const wish = await prisma.wish.create({
      data: {
        charityId: user.id,
        type: validatedData.type,
        title: validatedData.title,
        description: validatedData.description,
        city: validatedData.city,
        amountCents: validatedData.amountCents,
        tags: validatedData.tags,
        status: validatedData.type === 'PREVERIFIED' ? 'ELIGIBLE' : 'UNDER_REVIEW',
      },
    });

    // Run verification pipeline for custom wishes
    if (validatedData.type === 'CUSTOM') {
      try {
        const verificationResult = await runVerificationPipeline({
          wishId: wish.id,
          type: validatedData.type,
          title: validatedData.title,
          description: validatedData.description,
          category: validatedData.tags[0] || 'general',
          documents: validatedData.documents,
          vendorLinks: validatedData.vendorLinks,
        });

        await saveVerificationResults(wish.id, verificationResult);

        // Update wish status based on verification result
        await prisma.wish.update({
          where: { id: wish.id },
          data: {
            status: verificationResult.result === 'eligible' ? 'ELIGIBLE' : 
                    verificationResult.result === 'reject' ? 'REJECTED' : 'UNDER_REVIEW',
          },
        });

      } catch (error) {
        console.error('Verification pipeline failed:', error);
        // Wish remains in UNDER_REVIEW status for manual review
      }
    }

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        entityType: 'wish',
        entityId: wish.id,
        action: 'create',
        details: {
          type: validatedData.type,
          title: validatedData.title,
          amount: validatedData.amountCents,
        },
      },
    });

    return NextResponse.json({
      id: wish.id,
      status: wish.status,
      message: validatedData.type === 'PREVERIFIED' 
        ? 'Wish created and published successfully'
        : 'Wish created and submitted for verification',
    });

  } catch (error) {
    console.error('Wish creation failed:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/wishes - Get public wish catalog (filtered and paginated)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const query = searchParams.get('query') || undefined;
    const city = searchParams.get('city') || undefined;
    const tags = searchParams.get('tags')?.split(',') || undefined;
    const type = searchParams.get('type') as 'PREVERIFIED' | 'CUSTOM' | undefined;
    const minAmount = searchParams.get('minAmount') ? parseInt(searchParams.get('minAmount')!) : undefined;
    const maxAmount = searchParams.get('maxAmount') ? parseInt(searchParams.get('maxAmount')!) : undefined;
    const sortBy = searchParams.get('sortBy') as 'newest' | 'amount' | 'relevance' || 'newest';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    // Build where clause
    const where: any = {
      status: 'ELIGIBLE', // Only show eligible wishes publicly
    };

    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (tags && tags.length > 0) {
      where.tags = { hasSome: tags };
    }

    if (type) {
      where.type = type;
    }

    if (minAmount !== undefined || maxAmount !== undefined) {
      where.amountCents = {};
      if (minAmount !== undefined) where.amountCents.gte = minAmount;
      if (maxAmount !== undefined) where.amountCents.lte = maxAmount;
    }

    // Build order by clause
    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'amount') {
      orderBy = { amountCents: 'desc' };
    } else if (sortBy === 'relevance' && query) {
      // For relevance, we'll use a simple text search score
      orderBy = { createdAt: 'desc' };
    }

    // Execute query
    const [wishes, total] = await Promise.all([
      prisma.wish.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          type: true,
          title: true,
          description: true,
          city: true,
          amountCents: true,
          tags: true,
          createdAt: true,
          // Redact charity information for public view
          charity: {
            select: {
              city: true,
              // Don't include displayName or other PII
            },
          },
        },
      }),
      prisma.wish.count({ where }),
    ]);

    return NextResponse.json({
      wishes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Wish retrieval failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
