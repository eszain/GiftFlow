import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          req.cookies.set({
            name,
            value,
            ...options,
          });
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          res.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          });
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          res.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Get the current session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Define protected routes
  const protectedApiRoutes = [
    "/api/wishes(.*)", "/api/fulfillments(.*)", "/api/analytics(.*)",
    "/api/moderation(.*)", "/api/admin(.*)", "/api/internal(.*)",
  ];

  const protectedPageRoutes = [
    "/dashboard(.*)", "/create-wish(.*)", "/my-wishes(.*)",
    "/fulfill(.*)", "/moderation(.*)", "/admin(.*)",
  ];

  const isProtectedApi = protectedApiRoutes.some(route => 
    new RegExp(route.replace('(.*)', '.*')).test(req.nextUrl.pathname)
  );

  const isProtectedPage = protectedPageRoutes.some(route => 
    new RegExp(route.replace('(.*)', '.*')).test(req.nextUrl.pathname)
  );

  // Check API routes
  if (isProtectedApi && !session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check page routes
  if (isProtectedPage && !session) {
    const signInUrl = new URL('/login', req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }

  return res;
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};