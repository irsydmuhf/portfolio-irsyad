import Link from "next/link";
import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/admin/require";
import { logoutAction } from "../auth-actions";

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

/**
 * Guarded shell for the admin panel (route group keeps /admin/login and the
 * transitional legacy editors outside this layout). requireAdmin() is the
 * authoritative check behind the proxy's optimistic redirect.
 */
export default async function AdminPanelLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = await requireAdmin();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <aside className="flex w-60 shrink-0 flex-col border-r border-navy-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-orange-500">
            Portfolio CMS
          </p>

          <nav className="mt-4 flex flex-col gap-1">
            <Link
              href="/admin"
              className="rounded-lg bg-orange-50 px-3 py-2 text-sm font-medium text-orange-700"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/projects"
              className="rounded-lg px-3 py-2 text-sm font-medium text-navy-700 transition-colors hover:bg-slate-50"
            >
              Projects
            </Link>
          </nav>

          <div className="mt-auto space-y-3 pt-8">
            <Link
              href="/"
              className="block text-sm text-navy-500 transition-colors hover:text-orange-500"
            >
              ← View site
            </Link>
            <p
              className="truncate text-xs text-navy-400"
              title={user.email ?? ""}
            >
              {user.email}
            </p>
            <form action={logoutAction}>
              <button
                type="submit"
                className="w-full rounded-lg border border-navy-300 px-3 py-2 text-sm font-medium text-navy-700 transition-colors hover:bg-slate-50"
              >
                Sign out
              </button>
            </form>
          </div>
        </aside>

        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
