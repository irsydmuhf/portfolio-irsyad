import Link from "next/link";
import { requireAdmin } from "@/lib/admin/require";

interface ProjectRow {
  slug: string;
  status: string;
  featured: boolean;
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-navy-200 bg-white p-5">
      <p className="text-sm text-navy-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-navy-900">{value}</p>
    </div>
  );
}

export default async function AdminDashboard() {
  const { supabase } = await requireAdmin();

  const { data, error, count } = await supabase
    .from("projects")
    .select("slug, status, featured", { count: "exact" })
    .order("display_order", { ascending: true });

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        Could not load projects: {error.message}
      </div>
    );
  }

  const rows = (data ?? []) as ProjectRow[];
  const published = rows.filter((r) => r.status === "published").length;
  const drafts = rows.filter((r) => r.status === "draft").length;
  const featured = rows.filter((r) => r.featured).length;

  return (
    <div>
      <header>
        <h1 className="text-2xl font-bold text-navy-900">Dashboard</h1>
        <p className="mt-1 text-sm text-navy-500">
          Content lives in Supabase; published rows appear on the site within
          5 minutes (or instantly once publish revalidation lands).
        </p>
      </header>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total projects" value={count ?? rows.length} />
        <StatCard label="Published" value={published} />
        <StatCard label="Drafts" value={drafts} />
        <StatCard label="Featured" value={featured} />
      </div>

      <section className="mt-8 rounded-xl border border-navy-200 bg-white">
        <div className="border-b border-navy-100 px-5 py-4">
          <h2 className="font-semibold text-navy-900">Projects</h2>
          <p className="mt-1 text-sm text-navy-500">
            Full list, editing, reorder and media arrive in the next phases —
            see plans/portfolio-cms-v2.md.
          </p>
        </div>
        <ul className="divide-y divide-navy-100">
          {rows.map((row) => (
            <li
              key={row.slug}
              className="flex items-center justify-between px-5 py-3 text-sm"
            >
              <span className="text-navy-700">{row.slug}</span>
              <span className="flex items-center gap-3">
                {row.featured ? (
                  <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                    Featured
                  </span>
                ) : null}
                <span
                  className={
                    row.status === "published"
                      ? "rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700"
                      : "rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
                  }
                >
                  {row.status}
                </span>
              </span>
            </li>
          ))}
          {rows.length === 0 ? (
            <li className="px-5 py-4 text-sm text-navy-500">
              No projects yet.
            </li>
          ) : null}
        </ul>
      </section>

      {process.env.NODE_ENV === "development" ? (
        <section className="mt-8 rounded-xl border border-orange-200 bg-orange-50 p-5">
          <h2 className="font-semibold text-orange-800">
            Interim JSON workflow (development only)
          </h2>
          <p className="mt-1 text-sm text-orange-700">
            Until the CMS editor ships, edit content via{" "}
            <code className="rounded bg-white px-1">src/data/projects.json</code>{" "}
            then re-run <code className="rounded bg-white px-1">npm run db:migrate</code>{" "}
            to sync it into Supabase.
          </p>
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            <Link
              href="/admin/new"
              className="rounded-lg border border-orange-300 bg-white px-3 py-1.5 font-medium text-orange-800 transition-colors hover:bg-orange-100"
            >
              + New project (JSON)
            </Link>
            {rows.map((row) => (
              <Link
                key={row.slug}
                href={`/admin/edit/${row.slug}`}
                className="rounded-lg border border-orange-200 bg-white px-3 py-1.5 text-orange-800 transition-colors hover:bg-orange-100"
              >
                Edit {row.slug}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
