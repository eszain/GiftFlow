import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { userRolesSchema } from '@/lib/validations/user';
import { z } from 'zod';

const moderationDecisionSchema = z.object({
  wishId: z.string().uuid(),
  decision: z.enum(['approve', 'reject']),
  notes: z.string().optional(),
});

// GET /api/moderation/wishes - Get wishes pending moderation review
export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user and check moderator role
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const roles = userRolesSchema.parse(user.roles);
    if (!roles.moderator && !roles.admin) {
      return NextResponse.json({ error: 'Moderator role required' }, { status: 403 });
    }

    // Get wishes pending review
    const wishes = await prisma.wish.findMany({
      where: {
        status: 'UNDER_REVIEW',
        type: 'CUSTOM',
      },
      include: {
        charity: {
          select: {
            id: true,
            displayName: true,
            city: true,
          },
        },
        documents: {
          select: {
            id: true,
            docType: true,
            ocrText: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc', // Oldest first
      },
    });

    return NextResponse.json({
      wishes: wishes.map(wish => ({
        id: wish.id,
        title: wish.title,
        description: wish.description,
        city: wish.city,
        amountCents: wish.amountCents,
        tags: wish.tags,
        createdAt: wish.createdAt,
        verificationDecision: wish.verificationDecision,
        charity: wish.charity,
        documents: wish.documents,
      })),
    });

  } catch (error) {
    console.error('Moderation queue retrieval failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/moderation/wishes - Make moderation decision
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = moderationDecisionSchema.parse(body);

    // Get user and check moderator role
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const roles = userRolesSchema.parse(user.roles);
    if (!roles.moderator && !roles.admin) {
      return NextResponse.json({ error: 'Moderator role required' }, { status: 403 });
    }

    // Get wish
    const wish = await prisma.wish.findUnique({
      where: { id: validatedData.wishId },
    });

    if (!wish) {
      return NextResponse.json({ error: 'Wish not found' }, { status: 404 });
    }

    // Check if wish is in review status
    if (wish.status !== 'UNDER_REVIEW') {
      return NextResponse.json({ 
        error: 'Wish is not pending review' 
      }, { status: 400 });
    }

    // Update wish status based on decision
    const newStatus = validatedData.decision === 'approve' ? 'ELIGIBLE' : 'REJECTED';
    
    const updatedWish = await prisma.wish.update({
      where: { id: validatedData.wishId },
      data: {
        status: newStatus,
        verificationDecision: {
          result: validatedData.decision === 'approve' ? 'eligible' : 'reject',
          reasons: validatedData.decision === 'approve' 
            ? ['Approved by moderator'] 
            : ['Rejected by moderator'],
          policyRefs: ['Moderator review'],
          moderatorNotes: validatedData.notes,
          moderatorId: user.id,
          moderatedAt: new Date().toISOString(),
        },
      },
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        entityType: 'wish',
        entityId: validatedData.wishId,
        action: validatedData.decision,
        details: {
          decision: validatedData.decision,
          notes: validatedData.notes,
          previousStatus: wish.status,
          newStatus: newStatus,
        },
      },
    });

    return NextResponse.json({
      wishId: updatedWish.id,
      status: updatedWish.status,
      message: `Wish ${validatedData.decision}d successfully`,
    });

  } catch (error) {
    console.error('Moderation decision failed:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
