import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { userRolesSchema } from '@/lib/validations/user';

// PATCH /api/users/roles - Update current user's roles (self-assignment only)
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedRoles = userRolesSchema.parse(body);

    // Get current user
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent privilege escalation - users cannot assign admin or moderator roles to themselves
    if (validatedRoles.admin || validatedRoles.moderator) {
      return NextResponse.json({ 
        error: 'Cannot assign admin or moderator roles to yourself' 
      }, { status: 403 });
    }

    // Update user roles (only charity and patron roles allowed for self-assignment)
    const updatedUser = await prisma.user.update({
      where: { clerkUserId: userId },
      data: {
        roles: {
          charity: validatedRoles.charity,
          patron: validatedRoles.patron,
          moderator: false, // Always false for self-assignment
          admin: false, // Always false for self-assignment
        },
      },
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        entityType: 'user',
        entityId: user.id,
        action: 'update_roles_self',
        details: {
          oldRoles: user.roles,
          newRoles: updatedUser.roles,
        },
      },
    });

    return NextResponse.json({
      id: updatedUser.id,
      roles: updatedUser.roles,
      message: 'User roles updated successfully',
    });

  } catch (error) {
    console.error('Role update failed:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/users/roles - Get current user's roles
export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: {
        id: true,
        roles: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      roles: user.roles,
    });

  } catch (error) {
    console.error('Role retrieval failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
