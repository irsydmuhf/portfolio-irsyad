import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const LOGIN_PATH = "/admin/login";

/**
 * Next.js 16: `middleware.ts` was renamed `proxy.ts` (same functionality).
 * Runs before every /admin/* request and does two things:
 *
 * 1. Session refresh — the only place cookies can be written on a GET. The
 *    @supabase/ssr client updates BOTH the outgoing response cookies and the
 *    upstream request cookies, so Server Components see the fresh token
 *    (prevents refresh-token double-use across layers).
 * 2. Optimistic redirect — visitors with no session cookie are sent to the
 *    login page. Per the Next.js authentication guide, proxy performs
 *    optimistic checks only: authoritative authorization (valid user +
 *    admin_users membership) lives in requireAdmin() inside the admin
 *    layout/pages, and data access is enforced again by Postgres RLS.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY — see .env.example"
    );
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Refresh an expired session (no-op without a session cookie).
  await supabase.auth.getUser();

  // The login page must stay reachable without a session.
  if (pathname === LOGIN_PATH) {
    return response;
  }

  const hasSessionCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"));

  if (!hasSessionCookie) {
    const login = new URL(LOGIN_PATH, request.url);
    login.searchParams.set("next", pathname + search);
    return NextResponse.redirect(login);
  }

  return response;
}

export const config = {
  matcher: "/admin/:path*",
};
