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
]);

// Define protected pages
const isProtectedPage = createRouteMatcher([
  "/dashboard(.*)",
  "/create-wish(.*)",
  "/my-wishes(.*)",
  "/fulfill(.*)",
  "/moderation(.*)",
  "/admin(.*)",
]);

export default clerkMiddleware((auth, req) => {
  // Protect API routes
  if (isProtectedApi(req)) {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // Protect pages
  if (isProtectedPage(req)) {
    const { userId } = auth();
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
