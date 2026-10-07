// Server actions for admin sign-in / sign-out (Phase 4).
// Note: these live in /admin/login (outside the proxy's auth redirect) — the
// actions perform the authentication themselves, per the Next.js docs warning
// that server functions on skipped paths must not rely on the proxy.

"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface LoginState {
  error: string | null;
}

/** Internal paths only — blocks `?next=https://evil.example` open redirects. */
function safeNext(next: string): string {
  return next.startsWith("/") && !next.startsWith("//") ? next : "/admin";
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(String(formData.get("next") ?? ""));

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Readable, specific messages (PRD §45) — never leak Supabase internals.
    if (error.code === "invalid_credentials") {
      return { error: "Invalid email or password." };
    }
    if (error.status === 429 || (error.code ?? "").includes("rate_limit")) {
      return {
        error: "Too many attempts. Please wait a moment and try again.",
      };
    }
    return { error: "Sign-in failed. Please try again." };
  }

  // redirect() throws NEXT_REDIRECT — keep it outside any try/catch.
  redirect(next);
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
