import { requireAdmin } from "@/lib/admin/require";
import { toSettings, type SettingsRow } from "@/lib/content/rows";
import { PageHeader } from "../content-list";
import LoadError from "../load-error";
import SettingsForm from "./settings-form";

export default async function AdminSettingsPage() {
  const { supabase } = await requireAdmin();
  const [{ data, error }, { data: projectRows }] = await Promise.all([
    supabase.from("site_settings").select("*").eq("id", "main").maybeSingle(),
    supabase
      .from("projects")
      .select("id, title, cover_storage_path")
      .eq("status", "published")
      .order("display_order", { ascending: true }),
  ]);
  const printerOptions = (
    (projectRows ?? []) as { id: string; title: string; cover_storage_path: string | null }[]
  ).map((p) => ({ id: p.id, title: p.title, hasCover: Boolean(p.cover_storage_path) }));

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Profile & Site"
        description="Your photo, bio, contact links and SEO text. Saving updates the live site immediately."
      />
      {error ? (
        <LoadError what="site settings" message={error.message} />
      ) : !data ? (
        <LoadError what="site settings" message="The settings row is missing — run npm run db:apply to seed it." />
      ) : (
        <SettingsForm initial={toSettings(data as SettingsRow)} printerOptions={printerOptions} />
      )}
    </div>
  );
}
