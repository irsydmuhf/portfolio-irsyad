import { requireAdmin } from "@/lib/admin/require";
import { toExperience, type ExperienceRow } from "@/lib/content/rows";
import { PageHeader } from "../content-list";
import LoadError from "../load-error";
import ExperienceEditor from "./experience-editor";

export default async function AdminExperiencePage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("experiences")
    .select("*")
    .order("display_order", { ascending: true });

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Experience"
        description="Work history for the homepage timeline. Each save is live immediately; use the arrows to reorder."
      />
      {error ? (
        <LoadError what="experience" message={error.message} />
      ) : (
        <ExperienceEditor initial={((data ?? []) as ExperienceRow[]).map(toExperience)} />
      )}
    </div>
  );
}
