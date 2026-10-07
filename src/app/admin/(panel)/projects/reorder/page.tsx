import Link from "next/link";
import { requireAdmin } from "@/lib/admin/require";
import { listProjects } from "@/lib/projects/admin";
import ReorderList from "./reorder-list";

export const metadata = { title: "Reorder projects" };

export default async function ReorderPage() {
  const { supabase } = await requireAdmin();
  const projects = await listProjects(supabase);

  return (
    <div>
      <Link
        href="/admin/projects"
        className="text-sm text-navy-500 hover:text-orange-500"
      >
        ← Projects
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-navy-900">Reorder projects</h1>
      <p className="mt-1 text-sm text-navy-500">
        Drag the handle, or focus a row and use the arrow buttons. The homepage
        shows published, featured projects in this order.
      </p>
      <ReorderList
        initial={projects.map((p) => ({
          id: p.id,
          title: p.title,
          category: p.category,
          status: p.status,
          featured: p.featured,
        }))}
      />
    </div>
  );
}
