import Link from "next/link";
import { notFound } from "next/navigation";
import CaseStudyView from "@/components/case-study/CaseStudyView";
import { requireAdmin } from "@/lib/admin/require";
import { loadCaseStudy } from "@/lib/projects/queries";

export const metadata = {
  title: "Draft preview",
  robots: { index: false, follow: false },
};

// Always fresh: previews must reflect the latest saved draft.
export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const { supabase } = await requireAdmin();
  const project = await loadCaseStudy(supabase, { id, publishedOnly: false });
  if (!project) notFound();

  const { data: status } = await supabase
    .from("projects")
    .select("status")
    .eq("id", id)
    .maybeSingle();

  return (
    <div className="-m-8">
      <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 bg-amber-400 px-6 py-2 text-sm font-semibold text-amber-950">
        <span>
          DRAFT PREVIEW — {status?.status === "published" ? "published" : "not public"}
        </span>
        <Link
          href={`/admin/projects/${id}/edit`}
          className="rounded bg-amber-950 px-3 py-1 text-xs font-semibold text-amber-50"
        >
          ← Back to editor
        </Link>
      </div>
      <div className="bg-slate-50">
        <CaseStudyView project={project} backHref="/admin/projects" />
      </div>
    </div>
  );
}
