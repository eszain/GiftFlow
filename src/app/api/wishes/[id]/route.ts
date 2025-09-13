import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { userRolesSchema } from '@/lib/validations/user';

// GET /api/wishes/[id] - Get wish details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    const wishId = params.id;

    // Get wish with related data
    const wish = await prisma.wish.findUnique({
      where: { id: wishId },
      include: {
        charity: {
          select: {
            id: true,
            displayName: true,
            city: true,
          },
        },
        documents: true,
        fulfillments: {
          include: {
            patron: {
              select: {
                id: true,
                displayName: true,
              },
            },
          },
        },
      },
    });

    if (!wish) {
      return NextResponse.json({ error: 'Wish not found' }, { status: 404 });
    }

    // Check access permissions
    if (wish.status !== 'ELIGIBLE') {
      // Only allow access to non-eligible wishes for:
      // 1. The wish owner (charity)
      // 2. Moderators and admins
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const user = await prisma.user.findUnique({
        where: { clerkUserId: userId },
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const roles = userRolesSchema.parse(user.roles);
      const isOwner = wish.charityId === user.id;
      const isModerator = roles.moderator || roles.admin;

      if (!isOwner && !isModerator) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Redact PII for public access
    const response = {
      id: wish.id,
      type: wish.type,
      title: wish.title,
      description: wish.description,
      city: wish.city,
      amountCents: wish.amountCents,
      status: wish.status,
      tags: wish.tags,
      createdAt: wish.createdAt,
      updatedAt: wish.updatedAt,
      verificationDecision: wish.verificationDecision,
      documents: wish.documents.map(doc => ({
        id: doc.id,
        docType: doc.docType,
        // Don't expose URLs or OCR text publicly
      })),
      fulfillments: wish.fulfillments.map(fulfillment => ({
        id: fulfillment.id,
        amountCents: fulfillment.amountCents,
        status: fulfillment.status,
        createdAt: fulfillment.createdAt,
        // Redact patron information for public view
      })),
    };

    // Add full details for authorized users
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { clerkUserId: userId },
      });

      if (user) {
        const roles = userRolesSchema.parse(user.roles);
        const isOwner = wish.charityId === user.id;
        const isModerator = roles.moderator || roles.admin;

        if (isOwner || isModerator) {
          response.documents = wish.documents.map(doc => ({
            id: doc.id,
            url: doc.url,
            docType: doc.docType,
            ocrText: doc.ocrText,
            createdAt: doc.createdAt,
          }));

          response.fulfillments = wish.fulfillments.map(fulfillment => ({
            id: fulfillment.id,
            amountCents: fulfillment.amountCents,
            provider: fulfillment.provider,
            status: fulfillment.status,
            receiptUrl: fulfillment.receiptUrl,
            taxDocsUrl: fulfillment.taxDocsUrl,
            createdAt: fulfillment.createdAt,
            patron: fulfillment.patron,
          }));
        }
      }
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Wish retrieval failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/wishes/[id] - Update wish (Charity owner only)
export async function PATCH(
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

    // Get user and wish
    const [user, wish] = await Promise.all([
      prisma.user.findUnique({
        where: { clerkUserId: userId },
      }),
      prisma.wish.findUnique({
        where: { id: wishId },
      }),
    ]);

    if (!user || !wish) {
      return NextResponse.json({ error: 'User or wish not found' }, { status: 404 });
    }

    // Check ownership
    if (wish.charityId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Only allow updates to draft or rejected wishes
    if (!['DRAFT', 'REJECTED'].includes(wish.status)) {
      return NextResponse.json({ 
        error: 'Cannot update wish in current status' 
      }, { status: 400 });
    }

    // Update wish
    const updatedWish = await prisma.wish.update({
      where: { id: wishId },
      data: {
        title: body.title,
        description: body.description,
        city: body.city,
        amountCents: body.amountCents,
        tags: body.tags,
        status: 'UNDER_REVIEW', // Reset to review if updated
        verificationDecision: null, // Clear previous decision
      },
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        entityType: 'wish',
        entityId: wishId,
        action: 'update',
        details: {
          changes: body,
        },
      },
    });

    return NextResponse.json({
      id: updatedWish.id,
      status: updatedWish.status,
      message: 'Wish updated successfully',
    });

  } catch (error) {
    console.error('Wish update failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/wishes/[id] - Delete wish (Charity owner only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const wishId = params.id;

    // Get user and wish
    const [user, wish] = await Promise.all([
      prisma.user.findUnique({
        where: { clerkUserId: userId },
      }),
      prisma.wish.findUnique({
        where: { id: wishId },
      }),
    ]);

    if (!user || !wish) {
      return NextResponse.json({ error: 'User or wish not found' }, { status: 404 });
    }

    // Check ownership
    if (wish.charityId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Only allow deletion of draft or rejected wishes
    if (!['DRAFT', 'REJECTED'].includes(wish.status)) {
      return NextResponse.json({ 
        error: 'Cannot delete wish in current status' 
      }, { status: 400 });
    }

    // Delete wish (cascade will handle related records)
    await prisma.wish.delete({
      where: { id: wishId },
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        entityType: 'wish',
        entityId: wishId,
        action: 'delete',
        details: {
          title: wish.title,
        },
      },
    });

    return NextResponse.json({
      message: 'Wish deleted successfully',
    });

  } catch (error) {
    console.error('Wish deletion failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
