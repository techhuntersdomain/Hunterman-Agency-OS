import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Auth gate for the whole app. In Next.js 16 the `middleware` file convention
 * was renamed to `proxy` (same capability). This runs before every matched
 * route and:
 *
 *   1. Refreshes the Supabase auth session cookie (so server reads see a valid
 *      user and tokens don't silently expire mid-session).
 *   2. Redirects unauthenticated requests to `/login`, and bounces already
 *      signed-in users away from `/login`.
 *
 * IMPORTANT: the proxy is the first line of defense, not the only one. Next.js
 * routes Server Actions as POSTs to the page they live on, so a matcher change
 * could silently drop coverage. Each Server Action therefore re-checks auth
 * itself (see `ensureAuthed` in the leads actions), and the dashboard layout
 * calls `requireUser()` server-side. Defense in depth.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Do not run other logic between client creation and getUser() — see the
  // Supabase SSR docs. getUser() revalidates the token against the auth server.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isLoginRoute = pathname === "/login";

  if (!user && !isLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // Preserve where they were headed so login can send them back.
    if (pathname && pathname !== "/") url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  if (user && isLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Run on everything except Next internals and static assets.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
