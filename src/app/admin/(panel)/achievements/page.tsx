import { requireAdmin } from "@/lib/admin/require";
import { toAchievement, type AchievementRow } from "@/lib/content/rows";
import { PageHeader } from "../content-list";
import LoadError from "../load-error";
import AchievementsEditor from "./achievements-editor";

export default async function AdminAchievementsPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("achievements")
    .select("*")
    .order("display_order", { ascending: true });

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Certifications & Achievements"
        description="The horizontal timeline at the bottom of the profile card. Keep them in chronological order (oldest first)."
      />
      {error ? (
        <LoadError what="achievements" message={error.message} />
      ) : (
        <AchievementsEditor initial={((data ?? []) as AchievementRow[]).map(toAchievement)} />
      )}
    </div>
  );
}
