import { requireAdmin } from "@/lib/admin/require";
import { toEducation, type EducationRow } from "@/lib/content/rows";
import { PageHeader } from "../content-list";
import LoadError from "../load-error";
import EducationEditor from "./education-editor";

export default async function AdminEducationPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("educations")
    .select("*")
    .order("display_order", { ascending: true });

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Education"
        description="Schools and programs for the Education timeline. Each save is live immediately."
      />
      {error ? (
        <LoadError what="education" message={error.message} />
      ) : (
        <EducationEditor initial={((data ?? []) as EducationRow[]).map(toEducation)} />
      )}
    </div>
  );
}
