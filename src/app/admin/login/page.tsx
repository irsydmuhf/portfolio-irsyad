import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "../auth-actions";
import { createClient } from "@/lib/supabase/server";
import LoginForm, { type Notice } from "./login-form";

export const metadata = {
  title: "Admin Login",
  robots: { index: false, follow: false },
};

const NOTICES: Record<string, Notice> = {
  session: {
    kind: "info",
    text: "Your session has expired. Please log in again.",
  },
  unauthorized: {
    kind: "error",
    text: "This account does not have admin access.",
  },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: membership } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (membership) {
      // Already signed in as admin — nothing to do here.
      redirect("/admin");
    }

    // Signed in, but not a member of admin_users: show the denial with an
    // escape hatch instead of a login form that would succeed and loop.
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-xl border border-navy-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-orange-500">
            Portfolio CMS
          </p>
          <h1 className="mt-3 text-2xl font-bold text-navy-900">
            Admin access required
          </h1>
          <p className="mt-2 text-sm text-navy-600">
            This account does not have admin access. Sign in with the owner
            account, or return to the site.
          </p>
          <div className="mt-6 flex gap-3">
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-60"
              >
                Sign out
              </button>
            </form>
            <Link
              href="/"
              className="rounded-lg border border-navy-300 px-4 py-2 text-sm font-medium text-navy-700 transition-colors hover:bg-slate-50"
            >
              Back to site
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-navy-200 bg-white p-8 shadow-sm">
        <Link
          href="/"
          className="text-sm font-medium text-navy-500 transition-colors hover:text-orange-500"
        >
          ← Back to site
        </Link>
        <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-orange-500">
          Portfolio CMS
        </p>
        <h1 className="mt-2 text-2xl font-bold text-navy-900">Admin login</h1>
        <p className="mt-1 text-sm text-navy-500">Owner access only.</p>
        <LoginForm notice={error ? NOTICES[error] : undefined} next={next} />
      </div>
    </main>
  );
}
