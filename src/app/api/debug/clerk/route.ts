import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// GET /api/debug/clerk - Debug Clerk authentication (remove in production)
export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
  }

  try {
    const { userId, sessionId, orgId } = auth();
    
    return NextResponse.json({
      message: 'Clerk authentication status',
      auth: {
        userId: userId || 'NOT AUTHENTICATED',
        sessionId: sessionId || 'NO SESSION',
        orgId: orgId || 'NO ORG',
        isAuthenticated: !!userId,
      },
      environment: {
        clerkPublishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? 'SET' : 'NOT SET',
        clerkSecretKey: process.env.CLERK_SECRET_KEY ? 'SET' : 'NOT SET',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      message: 'Clerk authentication error',
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: {
        clerkPublishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? 'SET' : 'NOT SET',
        clerkSecretKey: process.env.CLERK_SECRET_KEY ? 'SET' : 'NOT SET',
      },
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
