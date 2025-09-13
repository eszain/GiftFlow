import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { assignRolesSchema, userRolesSchema } from '@/lib/validations/user';

// PATCH /api/users/[id]/roles - Assign roles to user (Admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const targetUserId = params.id;
    const body = await request.json();
    const validatedData = assignRolesSchema.parse(body);

    // Get current user and check admin role
    const currentUser = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const currentUserRoles = userRolesSchema.parse(currentUser.roles);
    if (!currentUserRoles.admin) {
      return NextResponse.json({ error: 'Admin role required' }, { status: 403 });
    }

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    // Prevent self-demotion of admin role
    if (targetUserId === currentUser.id && !validatedData.roles.admin) {
      return NextResponse.json({ 
        error: 'Cannot remove admin role from yourself' 
      }, { status: 400 });
    }

    // Update user roles
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        roles: validatedData.roles,
      },
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        actorUserId: currentUser.id,
        entityType: 'user',
        entityId: targetUserId,
        action: 'update_roles',
        details: {
          oldRoles: targetUser.roles,
          newRoles: validatedData.roles,
          targetUserId,
        },
      },
    });

    return NextResponse.json({
      id: updatedUser.id,
      roles: updatedUser.roles,
      message: 'User roles updated successfully',
    });

  } catch (error) {
    console.error('Role assignment failed:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/users/[id]/roles - Get user roles (Admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const targetUserId = params.id;

    // Get current user and check admin role
    const currentUser = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const currentUserRoles = userRolesSchema.parse(currentUser.roles);
    if (!currentUserRoles.admin) {
      return NextResponse.json({ error: 'Admin role required' }, { status: 403 });
    }

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        displayName: true,
        roles: true,
        createdAt: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: targetUser.id,
      displayName: targetUser.displayName,
      roles: targetUser.roles,
      createdAt: targetUser.createdAt,
    });

  } catch (error) {
    console.error('Role retrieval failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
