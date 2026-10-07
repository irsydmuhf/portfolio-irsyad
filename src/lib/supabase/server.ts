// Supabase client for Server Components, Server Actions and Route Handlers.
// Auth state rides on request cookies. Cookie writes are honoured in Server
// Actions (sign-in/out) and swallowed in Server Components, where the proxy
// is responsible for persisting session refreshes.

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY — see .env.example"
    );
  }

  return createServerClient(url, anon, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component: writing cookies is not allowed
          // here. The proxy already refreshed the session for this request.
        }
      },
    },
  });
}
