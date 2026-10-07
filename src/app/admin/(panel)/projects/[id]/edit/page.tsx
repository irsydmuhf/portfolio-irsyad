import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/require";
import { getProjectRecord, listProjects } from "@/lib/projects/admin";
import MediaEditor from "../../media-editor";
import ProjectForm from "../../project-form";

export const metadata = { title: "Edit project" };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const { supabase } = await requireAdmin();
  const [record, all] = await Promise.all([
    getProjectRecord(supabase, id),
    listProjects(supabase),
  ]);
  if (!record) notFound();

  const categories = [...new Set(all.map((p) => p.category).filter(Boolean))];
  const {
    status,
    updatedAt: _u,
    publishedAt: _p,
    coverStoragePath,
    coverAlt,
    coverCaption,
    media,
    ...initial
  } = record;
  void [_u, _p];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-navy-900">
        Edit: {record.title}
      </h1>
      <ProjectForm
        initial={initial}
        meta={{
          id: record.id,
          status,
          hasCover: Boolean(coverStoragePath),
          mediaCount: media.length,
        }}
        categories={categories}
        relatedOptions={all
          .filter((p) => p.id !== record.id)
          .map((p) => ({ id: p.id, title: p.title, status: p.status }))}
      />

      <div className="mt-6">
        <MediaEditor
          projectId={record.id}
          cover={{ path: coverStoragePath, alt: coverAlt, caption: coverCaption }}
          media={media}
        />
      </div>
    </div>
  );
}
