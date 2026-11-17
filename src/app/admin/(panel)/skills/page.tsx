import { requireAdmin } from "@/lib/admin/require";
import { toSkillCategory, type SkillCategoryRow } from "@/lib/content/rows";
import { PageHeader } from "../content-list";
import LoadError from "../load-error";
import SkillsEditor from "./skills-editor";

export default async function AdminSkillsPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("skill_categories")
    .select("*")
    .order("display_order", { ascending: true });

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Skills"
        description="Skill pills grouped by category. Each save is live immediately."
      />
      {error ? (
        <LoadError what="skills" message={error.message} />
      ) : (
        <SkillsEditor initial={((data ?? []) as SkillCategoryRow[]).map(toSkillCategory)} />
      )}
    </div>
  );
}
