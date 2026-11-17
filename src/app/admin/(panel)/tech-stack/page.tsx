import { requireAdmin } from "@/lib/admin/require";
import { toTechItem, type TechItemRow } from "@/lib/content/rows";
import { PageHeader } from "../content-list";
import LoadError from "../load-error";
import TechEditor from "./tech-editor";

export default async function AdminTechStackPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("tech_stack")
    .select("*")
    .order("display_order", { ascending: true });

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Tech Stack"
        description="Logo tiles on the homepage. Pick a built-in logo, use letters, or upload your own PNG. Each save is live immediately."
      />
      {error ? (
        <LoadError what="tech stack" message={error.message} />
      ) : (
        <TechEditor initial={((data ?? []) as TechItemRow[]).map(toTechItem)} />
      )}
    </div>
  );
}
