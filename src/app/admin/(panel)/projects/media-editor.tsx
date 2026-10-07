"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import {
  addExternalMedia,
  deleteMedia,
  removeCover,
  reorderMedia,
  updateMedia,
  uploadCover,
  uploadMedia,
} from "../../media-actions";
import { MAX_UPLOAD_BYTES } from "@/lib/projects/media";
import { storageUrl } from "@/lib/projects/case-study";
import SafeImage from "@/components/case-study/SafeImage";
import type { MediaItem } from "@/lib/projects/admin";
import { BTN_PRIMARY, BTN_SECONDARY, INPUT_CLASS, Section } from "./editors";

const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";

function Notice({ text, kind }: { text: string; kind: "ok" | "error" }) {
  return (
    <p
      role={kind === "error" ? "alert" : "status"}
      className={`rounded-lg border px-3 py-2 text-sm ${
        kind === "error"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
      }`}
    >
      {text}
    </p>
  );
}

function srcOf(m: MediaItem): string {
  return m.source_type === "upload" && m.storage_path
    ? storageUrl(m.storage_path)
    : (m.external_url ?? "");
}

function MediaRow({
  item,
  index,
  total,
  onMove,
  onDone,
}: {
  item: MediaItem;
  index: number;
  total: number;
  onMove: (d: -1 | 1) => void;
  onDone: (n: { kind: "ok" | "error"; text: string }) => void;
}) {
  const router = useRouter();
  const [alt, setAlt] = useState(item.alt_text);
  const [caption, setCaption] = useState(item.caption ?? "");
  const [layout, setLayout] = useState<string>(item.layout);
  const [pending, start] = useTransition();
  const dirty =
    alt !== item.alt_text ||
    caption !== (item.caption ?? "") ||
    layout !== item.layout;

  function save() {
    start(async () => {
      const r = await updateMedia(item.id, { alt, caption, layout });
      onDone(r.ok ? { kind: "ok", text: "Media updated." } : { kind: "error", text: r.error });
      if (r.ok) router.refresh();
    });
  }

  function remove() {
    if (!window.confirm("Delete this image? This cannot be undone.")) return;
    start(async () => {
      const r = await deleteMedia(item.id);
      onDone(r.ok ? { kind: "ok", text: "Media deleted." } : { kind: "error", text: r.error });
      if (r.ok) router.refresh();
    });
  }

  return (
    <li className="flex gap-3 rounded-lg border border-navy-200 bg-slate-50 p-3">
      <div className="h-24 w-32 shrink-0 overflow-hidden rounded bg-navy-100">
        <SafeImage
          src={srcOf(item)}
          alt={item.alt_text}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <input
          aria-label="Alt text"
          placeholder="Alt text (required)"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          className={INPUT_CLASS}
        />
        <input
          aria-label="Caption"
          placeholder="Caption (optional)"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className={INPUT_CLASS}
        />
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Layout"
            value={layout}
            onChange={(e) => setLayout(e.target.value)}
            className={`${INPUT_CLASS} !w-auto`}
          >
            <option value="full">Full width</option>
            <option value="half">Half width</option>
            <option value="gallery">Gallery</option>
          </select>
          <span className="text-xs text-navy-400">
            {item.source_type === "upload" ? "Uploaded" : "External URL"}
          </span>
          <button
            type="button"
            disabled={!dirty || pending}
            onClick={save}
            className={BTN_SECONDARY}
          >
            {pending ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-1">
        <button
          type="button"
          aria-label={`Move image ${index + 1} up`}
          disabled={index === 0 || pending}
          onClick={() => onMove(-1)}
          className="rounded border border-navy-200 bg-white p-1 disabled:opacity-30"
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          aria-label={`Move image ${index + 1} down`}
          disabled={index === total - 1 || pending}
          onClick={() => onMove(1)}
          className="rounded border border-navy-200 bg-white p-1 disabled:opacity-30"
        >
          <ArrowDown className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          aria-label={`Delete image ${index + 1}`}
          disabled={pending}
          onClick={remove}
          className="rounded border border-red-200 bg-white p-1 text-red-600 disabled:opacity-30"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </li>
  );
}

export default function MediaEditor({
  projectId,
  cover,
  media,
}: {
  projectId: string;
  cover: { path: string | null; alt: string; caption: string };
  media: MediaItem[];
}) {
  const router = useRouter();
  const [note, setNote] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [pending, start] = useTransition();
  const coverForm = useRef<HTMLFormElement>(null);
  const mediaForm = useRef<HTMLFormElement>(null);
  const [extUrl, setExtUrl] = useState("");
  const [extAlt, setExtAlt] = useState("");

  function checkFile(form: HTMLFormElement | null): boolean {
    const f = (form?.elements.namedItem("file") as HTMLInputElement | null)
      ?.files?.[0];
    if (!f) {
      setNote({ kind: "error", text: "Choose an image to upload." });
      return false;
    }
    if (f.size > MAX_UPLOAD_BYTES) {
      setNote({ kind: "error", text: "File is too large. Maximum size is 8 MB." });
      return false;
    }
    return true;
  }

  function submit(
    e: React.FormEvent<HTMLFormElement>,
    action: (fd: FormData) => Promise<{ ok: boolean; error?: string }>,
    okText: string
  ) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!checkFile(form)) return;
    const fd = new FormData(form);
    fd.set("projectId", projectId);
    start(async () => {
      try {
        const r = await action(fd);
        if (r.ok) {
          setNote({ kind: "ok", text: okText });
          form.reset();
          router.refresh();
        } else setNote({ kind: "error", text: r.error ?? "Upload failed." });
      } catch {
        setNote({
          kind: "error",
          text: "Upload failed. The file may be too large or the connection dropped.",
        });
      }
    });
  }

  function move(index: number, d: -1 | 1) {
    const j = index + d;
    const ids = media.map((m) => m.id);
    [ids[index], ids[j]] = [ids[j], ids[index]];
    start(async () => {
      const r = await reorderMedia(projectId, ids);
      if (r.ok) router.refresh();
      else setNote({ kind: "error", text: r.error });
    });
  }

  return (
    <div className="space-y-6">
      {note ? <Notice {...note} /> : null}

      <Section
        title="Cover image"
        description="Optional. Without a cover the page keeps its typographic hero."
      >
        {cover.path ? (
          <div className="flex flex-wrap items-start gap-4">
            <div className="h-28 w-48 overflow-hidden rounded bg-navy-100">
              <SafeImage
                src={storageUrl(cover.path)}
                alt={cover.alt}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="text-sm text-navy-600">
              <p>Alt: {cover.alt || "—"}</p>
              {cover.caption ? <p>Caption: {cover.caption}</p> : null}
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (!window.confirm("Remove the cover image?")) return;
                  start(async () => {
                    const r = await removeCover(projectId);
                    setNote(
                      r.ok
                        ? { kind: "ok", text: "Cover removed." }
                        : { kind: "error", text: r.error }
                    );
                    if (r.ok) router.refresh();
                  });
                }}
                className="mt-2 text-red-600 underline"
              >
                Remove cover
              </button>
            </div>
          </div>
        ) : null}
        <form
          ref={coverForm}
          onSubmit={(e) => submit(e, uploadCover, "Cover updated.")}
          className="space-y-2"
        >
          <input name="file" type="file" accept={ACCEPT} className="text-sm" />
          <input
            name="alt"
            required
            placeholder="Alt text (required)"
            defaultValue={cover.alt}
            className={INPUT_CLASS}
          />
          <input
            name="caption"
            placeholder="Caption (optional)"
            defaultValue={cover.caption}
            className={INPUT_CLASS}
          />
          <button type="submit" disabled={pending} className={BTN_PRIMARY}>
            {pending ? "Uploading…" : cover.path ? "Replace cover" : "Upload cover"}
          </button>
        </form>
      </Section>

      <Section
        title="Images & visuals"
        description="JPEG, PNG, WebP or AVIF up to 8 MB. SVG is not allowed."
      >
        {media.length > 0 ? (
          <ul className="space-y-3">
            {media.map((m, i) => (
              <MediaRow
                key={m.id}
                item={m}
                index={i}
                total={media.length}
                onMove={(d) => move(i, d)}
                onDone={setNote}
              />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-navy-500">No images yet.</p>
        )}

        <form
          ref={mediaForm}
          onSubmit={(e) => submit(e, uploadMedia, "Image uploaded.")}
          className="space-y-2 rounded-lg border border-dashed border-navy-300 p-3"
        >
          <p className="text-sm font-medium text-navy-800">Upload an image</p>
          <input name="file" type="file" accept={ACCEPT} className="text-sm" />
          <input name="alt" required placeholder="Alt text (required)" className={INPUT_CLASS} />
          <input name="caption" placeholder="Caption (optional)" className={INPUT_CLASS} />
          <select name="layout" defaultValue="full" className={`${INPUT_CLASS} !w-auto`}>
            <option value="full">Full width</option>
            <option value="half">Half width</option>
            <option value="gallery">Gallery</option>
          </select>
          <div>
            <button type="submit" disabled={pending} className={BTN_PRIMARY}>
              {pending ? "Uploading…" : "Upload"}
            </button>
          </div>
        </form>

        <div className="space-y-2 rounded-lg border border-dashed border-navy-300 p-3">
          <p className="text-sm font-medium text-navy-800">
            Or link an external image (https only)
          </p>
          <input
            value={extUrl}
            onChange={(e) => setExtUrl(e.target.value)}
            placeholder="https://…"
            aria-label="External image URL"
            className={INPUT_CLASS}
          />
          <input
            value={extAlt}
            onChange={(e) => setExtAlt(e.target.value)}
            placeholder="Alt text (required)"
            aria-label="External image alt text"
            className={INPUT_CLASS}
          />
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const r = await addExternalMedia({
                  projectId,
                  url: extUrl,
                  alt: extAlt,
                });
                if (r.ok) {
                  setExtUrl("");
                  setExtAlt("");
                  setNote({ kind: "ok", text: "External image added." });
                  router.refresh();
                } else setNote({ kind: "error", text: r.error });
              })
            }
            className={BTN_SECONDARY}
          >
            Add external image
          </button>
        </div>
      </Section>
    </div>
  );
}
