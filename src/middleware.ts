import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define protected API routes
const isProtectedApi = createRouteMatcher([
  "/api/wishes(.*)",
  "/api/fulfillments(.*)",
  "/api/analytics(.*)",
  "/api/moderation(.*)",
  "/api/admin(.*)",
  "/api/internal(.*)",
  "/api/users(.*)",
]);

// Define protected pages
const isProtectedPage = createRouteMatcher([
  "/dashboard(.*)",
  "/create-wish(.*)",
  "/my-wishes(.*)",
  "/fulfill(.*)",
  "/moderation(.*)",
  "/admin(.*)",
  "/wishes(.*)",
  "/analytics(.*)",
]);

// Define role selection page
const isRoleSelectionPage = createRouteMatcher([
  "/role-selection",
]);

export default clerkMiddleware((auth, req) => {
  const { userId } = auth();
  
  // Protect API routes
  if (isProtectedApi(req)) {
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // Handle role selection page
  if (isRoleSelectionPage(req)) {
    if (!userId) {
      const signInUrl = new URL('/sign-in', req.url);
      signInUrl.searchParams.set('redirect_url', req.url);
      return NextResponse.redirect(signInUrl);
    }
    // Allow access to role selection page for authenticated users
    return NextResponse.next();
  }

  // Protect pages
  if (isProtectedPage(req)) {
    if (!userId) {
      // Redirect to sign-in page
      const signInUrl = new URL('/sign-in', req.url);
      signInUrl.searchParams.set('redirect_url', req.url);
      return NextResponse.redirect(signInUrl);
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
