import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { clerkUserId, role } = body;

    // Verify the user is setting their own role
    if (clerkUserId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate role
    if (!['patron', 'charity'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { clerkUserId: userId }
    });

    if (user) {
      // Update existing user's role
      const updatedRoles = {
        ...(user.roles as any),
        [role]: true,
        roleSelected: true
      };

      user = await prisma.user.update({
        where: { clerkUserId: userId },
        data: {
          roles: updatedRoles,
          roleSelected: true
        }
      });
    } else {
      // Create new user with role
      const roles = {
        charity: role === 'charity',
        patron: role === 'patron',
        moderator: false,
        admin: false
      };

      user = await prisma.user.create({
        data: {
          clerkUserId: userId,
          roles: roles,
          roleSelected: true,
          displayName: null, // Will be updated from Clerk profile
          city: null,
          emailVerified: false
        }
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        roles: user.roles,
        roleSelected: user.roleSelected
      }
    });

  } catch (error) {
    console.error('Error setting user role:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
        roleSelected: true,
        displayName: true,
        city: true,
        emailVerified: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        roles: user.roles,
        roleSelected: user.roleSelected,
        displayName: user.displayName,
        city: user.city,
        emailVerified: user.emailVerified
      }
    });

  } catch (error) {
    console.error('Error fetching user roles:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { roles } = body;

    // Validate roles object
    if (!roles || typeof roles !== 'object') {
      return NextResponse.json({ error: 'Invalid roles format' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update user roles
    const updatedUser = await prisma.user.update({
      where: { clerkUserId: userId },
      data: {
        roles: roles
      }
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        roles: updatedUser.roles
      }
    });

  } catch (error) {
    console.error('Error updating user roles:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}