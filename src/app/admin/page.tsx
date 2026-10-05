import Link from "next/link";
import { connection } from "next/server";
import { readProjects, isAdminEnabled } from "./store";
import AdminDisabled from "./disabled";
import DeleteButton from "./delete-button";

export const metadata = { title: "Admin — Projects" };

export default async function AdminPage() {
  if (!isAdminEnabled()) {
    return <AdminDisabled />;
  }

  await connection();
  const projects = await readProjects();

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-900">
            Admin — Projects
          </h1>
          <p className="mt-1 text-sm text-charcoal-500">
            {projects.length} project{projects.length !== 1 && "s"} in
            src/data/projects.json
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/"
            className="rounded-lg border border-charcoal-300 bg-white px-4 py-2 text-sm font-medium text-charcoal-700 transition-colors hover:bg-charcoal-50"
          >
            View Site
          </Link>
          <Link
            href="/admin/new"
            className="rounded-lg bg-accent-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-600"
          >
            + New Project
          </Link>
        </div>
      </header>

      {projects.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-charcoal-300 bg-white p-10 text-center">
          <p className="text-charcoal-600">No projects yet.</p>
          <Link
            href="/admin/new"
            className="mt-2 inline-block text-sm font-medium text-accent-600 hover:underline"
          >
            Create your first project →
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {projects.map((project) => (
            <li
              key={project.slug}
              className="flex items-center justify-between gap-4 rounded-lg border border-charcoal-200 bg-white px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-charcoal-900">
                  {project.title}
                </p>
                <p className="truncate text-xs text-charcoal-500">
                  /{project.slug} · {project.category} ·{" "}
                  {project.tools.join(", ")}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href={`/projects/${project.slug}`}
                  className="rounded-lg border border-charcoal-200 px-3 py-1.5 text-sm text-charcoal-600 hover:bg-charcoal-50"
                >
                  View
                </Link>
                <Link
                  href={`/admin/edit/${project.slug}`}
                  className="rounded-lg border border-accent-200 px-3 py-1.5 text-sm text-accent-600 hover:bg-accent-50"
                >
                  Edit
                </Link>
                <DeleteButton slug={project.slug} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
