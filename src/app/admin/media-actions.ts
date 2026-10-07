"use server";

// Media + cover server actions (Phase 8). Same guard pattern as project
// actions: requireAdmin -> validate -> RLS/storage policies as last boundary.

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin/require";
import { checkUpload } from "@/lib/projects/media";
import { isHttps } from "@/lib/projects/schema";
import type { ActionResult } from "./project-actions";

const BUCKET = "portfolio-media";
const GENERIC = "Something went wrong. Please try again.";
const LAYOUTS = ["full", "half", "gallery"] as const;
type Layout = (typeof LAYOUTS)[number];

function fail(error: string, detail?: unknown): { ok: false; error: string } {
  if (detail) console.error("[cms:media]", error, detail);
  return { ok: false, error };
}

const isUuid = (v: unknown): v is string =>
  typeof v === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

async function afterChange(supabase: SupabaseClient, projectId: string) {
  const { data } = await supabase
    .from("projects")
    .select("slug, status")
    .eq("id", projectId)
    .maybeSingle();
  if (data?.status === "published") {
    revalidatePath("/");
    revalidatePath(`/projects/${data.slug}`);
  }
  revalidatePath("/admin", "layout");
}

/** Remove a storage object, but only inside this project's own folder. */
async function removeOwnObject(
  supabase: SupabaseClient,
  projectId: string,
  path: string | null
) {
  if (!path || !path.startsWith(`projects/${projectId}/`)) return;
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) console.error("[cms:media] storage cleanup failed", error);
}

async function storeFile(
  supabase: SupabaseClient,
  projectId: string,
  file: File
): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  const buf = new Uint8Array(await file.arrayBuffer());
  const check = checkUpload(buf.byteLength, buf.slice(0, 16));
  if (!check.ok) return check;

  const path = `projects/${projectId}/${randomUUID()}.${check.ext}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buf, { contentType: check.mime, upsert: false });
  if (error) {
    console.error("[cms:media] upload failed", error);
    return { ok: false, error: "Upload failed. Your draft is still saved — try again." };
  }
  return { ok: true, path };
}

function layoutOf(v: unknown): Layout {
  return (LAYOUTS as readonly string[]).includes(String(v))
    ? (String(v) as Layout)
    : "full";
}

// ------------------------------------------------------------------ media
export async function uploadMedia(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const { supabase } = await requireAdmin();
  const projectId = formData.get("projectId");
  const file = formData.get("file");
  const alt = String(formData.get("alt") ?? "").trim();
  const caption = String(formData.get("caption") ?? "").trim();

  if (!isUuid(projectId)) return fail("Invalid project.");
  if (!(file instanceof File) || file.size === 0)
    return fail("Choose an image to upload.");
  if (!alt) return fail("Alt text is required for accessibility.");
  if (alt.length > 300) return fail("Alt text is too long (max 300 characters).");

  const stored = await storeFile(supabase, projectId, file);
  if (!stored.ok) return fail(stored.error);

  const { data: last } = await supabase
    .from("project_media")
    .select("media_order")
    .eq("project_id", projectId)
    .order("media_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("project_media")
    .insert({
      project_id: projectId,
      source_type: "upload",
      storage_path: stored.path,
      alt_text: alt,
      caption: caption || null,
      layout: layoutOf(formData.get("layout")),
      media_order: (last?.media_order ?? -1) + 1,
    })
    .select("id")
    .single();
  if (error || !data) {
    await removeOwnObject(supabase, projectId, stored.path);
    return fail(GENERIC, error);
  }
  await afterChange(supabase, projectId);
  return { ok: true, id: data.id };
}

export async function addExternalMedia(input: {
  projectId: string;
  url: string;
  alt: string;
  caption?: string;
  layout?: string;
}): Promise<ActionResult<{ id: string }>> {
  const { supabase } = await requireAdmin();
  const url = String(input.url ?? "").trim();
  const alt = String(input.alt ?? "").trim();
  if (!isUuid(input.projectId)) return fail("Invalid project.");
  if (!isHttps(url)) return fail("External images must use a valid https:// URL.");
  if (!alt) return fail("Alt text is required for accessibility.");

  const { data: last } = await supabase
    .from("project_media")
    .select("media_order")
    .eq("project_id", input.projectId)
    .order("media_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("project_media")
    .insert({
      project_id: input.projectId,
      source_type: "external",
      external_url: url,
      alt_text: alt.slice(0, 300),
      caption: input.caption?.trim() || null,
      layout: layoutOf(input.layout),
      media_order: (last?.media_order ?? -1) + 1,
    })
    .select("id")
    .single();
  if (error || !data) return fail(GENERIC, error);
  await afterChange(supabase, input.projectId);
  return { ok: true, id: data.id };
}

export async function updateMedia(
  id: string,
  patch: { alt: string; caption: string; layout: string }
): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  if (!isUuid(id)) return fail("Invalid media item.");
  const alt = patch.alt.trim();
  if (!alt) return fail("Alt text is required for accessibility.");

  const { data, error } = await supabase
    .from("project_media")
    .update({
      alt_text: alt.slice(0, 300),
      caption: patch.caption.trim() || null,
      layout: layoutOf(patch.layout),
    })
    .eq("id", id)
    .select("project_id")
    .maybeSingle();
  if (error) return fail(GENERIC, error);
  if (!data) return fail("This media item no longer exists.");
  await afterChange(supabase, data.project_id);
  return { ok: true };
}

export async function reorderMedia(
  projectId: string,
  orderedIds: string[]
): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  if (!isUuid(projectId) || !orderedIds.every(isUuid)) return fail("Invalid order.");
  const results = await Promise.all(
    orderedIds.map((id, i) =>
      supabase
        .from("project_media")
        .update({ media_order: i })
        .eq("id", id)
        .eq("project_id", projectId)
    )
  );
  const bad = results.find((r) => r.error);
  if (bad) return fail(GENERIC, bad.error);
  await afterChange(supabase, projectId);
  return { ok: true };
}

export async function deleteMedia(id: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  if (!isUuid(id)) return fail("Invalid media item.");

  const { data: row, error: getErr } = await supabase
    .from("project_media")
    .select("project_id, source_type, storage_path")
    .eq("id", id)
    .maybeSingle();
  if (getErr) return fail(GENERIC, getErr);
  if (!row) return fail("This media item no longer exists.");

  const { error } = await supabase.from("project_media").delete().eq("id", id);
  if (error) return fail(GENERIC, error);

  if (row.source_type === "upload") {
    await removeOwnObject(supabase, row.project_id, row.storage_path);
  }
  await afterChange(supabase, row.project_id);
  return { ok: true };
}

// ------------------------------------------------------------------ cover
export async function uploadCover(
  formData: FormData
): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const projectId = formData.get("projectId");
  const file = formData.get("file");
  const alt = String(formData.get("alt") ?? "").trim();
  const caption = String(formData.get("caption") ?? "").trim();

  if (!isUuid(projectId)) return fail("Invalid project.");
  if (!(file instanceof File) || file.size === 0)
    return fail("Choose an image to upload.");
  if (!alt) return fail("Alt text is required for accessibility.");

  const { data: cur } = await supabase
    .from("projects")
    .select("cover_storage_path")
    .eq("id", projectId)
    .maybeSingle();
  if (!cur) return fail("This project no longer exists.");

  const stored = await storeFile(supabase, projectId, file);
  if (!stored.ok) return fail(stored.error);

  const { error } = await supabase
    .from("projects")
    .update({
      cover_storage_path: stored.path,
      cover_alt: alt.slice(0, 300),
      cover_caption: caption || null,
    })
    .eq("id", projectId);
  if (error) {
    await removeOwnObject(supabase, projectId, stored.path);
    return fail(GENERIC, error);
  }
  await removeOwnObject(supabase, projectId, cur.cover_storage_path);
  await afterChange(supabase, projectId);
  return { ok: true };
}

export async function removeCover(projectId: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  if (!isUuid(projectId)) return fail("Invalid project.");
  const { data: cur } = await supabase
    .from("projects")
    .select("cover_storage_path")
    .eq("id", projectId)
    .maybeSingle();
  if (!cur) return fail("This project no longer exists.");

  const { error } = await supabase
    .from("projects")
    .update({ cover_storage_path: null, cover_alt: null, cover_caption: null })
    .eq("id", projectId);
  if (error) return fail(GENERIC, error);
  await removeOwnObject(supabase, projectId, cur.cover_storage_path);
  await afterChange(supabase, projectId);
  return { ok: true };
}
