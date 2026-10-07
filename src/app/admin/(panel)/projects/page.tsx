import Link from "next/link";
import { requireAdmin } from "@/lib/admin/require";
import { listProjects } from "@/lib/projects/admin";
import { FeaturedToggle, RowActions } from "./row-actions";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "published", label: "Published" },
  { key: "draft", label: "Drafts" },
] as const;

export default async function ProjectsListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const { supabase } = await requireAdmin();
  const all = await listProjects(supabase);

  const filter = status === "published" || status === "draft" ? status : "all";
  const rows = filter === "all" ? all : all.filter((r) => r.status === filter);

  return (
    <div>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Projects</h1>
          <p className="mt-1 text-sm text-navy-500">
            {all.length} total · drafts are never visible on the public site.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/projects/reorder"
            className="rounded-lg border border-navy-300 bg-white px-3 py-2 text-sm font-medium text-navy-700 hover:bg-slate-50"
          >
            Reorder
          </Link>
          <Link
            href="/admin/projects/new"
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
          >
            + New project
          </Link>
        </div>
      </header>

      <nav className="mt-6 flex gap-2" aria-label="Filter by status">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === "all" ? "/admin/projects" : `/admin/projects?status=${f.key}`}
            aria-current={filter === f.key ? "page" : undefined}
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              filter === f.key
                ? "bg-navy-900 text-white"
                : "bg-white text-navy-600 ring-1 ring-navy-200 hover:bg-slate-50"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      <div className="mt-4 overflow-x-auto rounded-xl border border-navy-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-navy-100 bg-slate-50 text-xs uppercase tracking-wider text-navy-500">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Featured</th>
              <th className="px-4 py-3">Updated</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-100">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/projects/${r.id}/edit`}
                    className="font-medium text-navy-900 hover:text-orange-600"
                  >
                    {r.title}
                  </Link>
                  <p className="text-xs text-navy-400">/{r.slug}</p>
                </td>
                <td className="px-4 py-3 text-navy-600">{r.category || "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      r.status === "published"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {r.status === "published" ? "Published" : "Draft"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <FeaturedToggle id={r.id} featured={r.featured} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-navy-500">
                  {new Date(r.updated_at).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-4 py-3">
                  <RowActions
                    id={r.id}
                    title={r.title}
                    slug={r.slug}
                    published={r.status === "published"}
                  />
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-navy-500">
                  No projects here yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
