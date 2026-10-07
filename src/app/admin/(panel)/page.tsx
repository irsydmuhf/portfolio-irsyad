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
          Content lives in Supabase. Publishing, unpublishing and edits update the
          public site immediately.
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
            <Link href="/admin/projects" className="text-orange-600 underline">
              Manage projects
            </Link>{" "}
            · create, edit, preview, publish and reorder.
          </p>
        </div>
        <ul className="divide-y divide-navy-100">
          {rows.map((row) => (
            <li
              key={row.slug}
              className="flex items-center justify-between px-5 py-3 text-sm"
            >
              <Link
                href="/admin/projects"
                className="text-navy-700 hover:text-orange-600"
              >
                {row.slug}
              </Link>
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
    </div>
  );
}
