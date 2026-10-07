import { requireAdmin } from "@/lib/admin/require";
import { listProjects } from "@/lib/projects/admin";
import ProjectForm, { emptyProject } from "../project-form";

export const metadata = { title: "New project" };

export default async function NewProjectPage() {
  const { supabase } = await requireAdmin();
  const all = await listProjects(supabase);
  const categories = [...new Set(all.map((p) => p.category).filter(Boolean))];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-navy-900">New project</h1>
      <ProjectForm
        initial={emptyProject()}
        meta={{ status: "draft", hasCover: false, mediaCount: 0 }}
        categories={categories}
        relatedOptions={all.map((p) => ({
          id: p.id,
          title: p.title,
          status: p.status,
        }))}
      />
    </div>
  );
}
