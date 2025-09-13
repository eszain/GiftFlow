import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { updateUserProfileSchema, userRolesSchema } from '@/lib/validations/user';

// GET /api/users - Get current user profile
export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return user profile with roles
    return NextResponse.json({
      id: user.id,
      clerkUserId: user.clerkUserId,
      roles: user.roles,
      displayName: user.displayName,
      city: user.city,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });

  } catch (error) {
    console.error('User retrieval failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/users - Create or update user profile (called after Clerk sign-up)
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateUserProfileSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (existingUser) {
      // Update existing user
      const updatedUser = await prisma.user.update({
        where: { clerkUserId: userId },
        data: {
          displayName: validatedData.displayName,
          city: validatedData.city,
          emailVerified: true, // Assume verified if coming from Clerk
        },
      });

      return NextResponse.json({
        id: updatedUser.id,
        message: 'User profile updated successfully',
      });
    } else {
      // Create new user
      const newUser = await prisma.user.create({
        data: {
          clerkUserId: userId,
          roles: {
            charity: false,
            patron: false,
            moderator: false,
            admin: false,
          },
          displayName: validatedData.displayName,
          city: validatedData.city,
          emailVerified: true,
        },
      });

      // Log audit trail
      await prisma.auditLog.create({
        data: {
          actorUserId: newUser.id,
          entityType: 'user',
          entityId: newUser.id,
          action: 'create',
          details: {
            clerkUserId: userId,
            displayName: validatedData.displayName,
          },
        },
      });

      return NextResponse.json({
        id: newUser.id,
        message: 'User profile created successfully',
      });
    }

  } catch (error) {
    console.error('User creation/update failed:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/users - Update user profile
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateUserProfileSchema.parse(body);

    const updatedUser = await prisma.user.update({
      where: { clerkUserId: userId },
      data: {
        displayName: validatedData.displayName,
        city: validatedData.city,
      },
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        actorUserId: updatedUser.id,
        entityType: 'user',
        entityId: updatedUser.id,
        action: 'update',
        details: {
          changes: validatedData,
        },
      },
    });

    return NextResponse.json({
      id: updatedUser.id,
      message: 'User profile updated successfully',
    });

  } catch (error) {
    console.error('User update failed:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
