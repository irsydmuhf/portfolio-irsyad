"use client";

import { useId, useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import {
  deleteTechItem,
  moveTechItem,
  saveTechItem,
  uploadTechLogo,
} from "../../content-actions";
import { techItemSchema, type TechItemData } from "@/lib/content/schema";
import { TECH_ICON_OPTIONS } from "@/lib/content/tech-icons";
import TechIcon, { tileColors } from "@/components/home/TechIcon";
import ContentList from "../content-list";
import { BTN_SECONDARY, Field, INPUT_CLASS, TextInput } from "../editors";

const empty = (): TechItemData => ({
  name: "",
  iconSlug: "",
  letters: "",
  color: "",
  imagePath: "",
});

function LogoUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    const fd = new FormData();
    fd.set("file", file);
    const res = await uploadTechLogo(fd);
    setBusy(false);
    if (input.current) input.current.value = "";
    if (res.ok) onChange(res.url);
    else setError(res.error);
  }

  return (
    <Field
      label="Custom logo image (optional)"
      hint="PNG with a transparent background works best (JPG/WebP/AVIF also accepted, max 8 MB). Overrides the logo and letters."
      htmlFor={id}
    >
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={input}
          id={id}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/avif"
          className="sr-only"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        <button type="button" onClick={() => input.current?.click()} disabled={busy} className={BTN_SECONDARY}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {value ? "Replace image" : "Upload image"}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-red-600 hover:bg-red-50"
          >
            <X className="h-4 w-4" /> Remove image
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </Field>
  );
}

export default function TechEditor({ initial }: { initial: TechItemData[] }) {
  return (
    <ContentList
      initial={initial}
      makeNew={empty}
      schema={techItemSchema}
      save={saveTechItem}
      remove={deleteTechItem}
      move={moveTechItem}
      itemLabel="tool"
      addLabel="Add tool"
      emptyText="No tools yet. The Tech Stack grid is hidden until you add one."
      summary={(t) => t.name}
      renderFields={(t, set) => {
        const fallbackColor = tileColors({ ...t, color: "" }).bg;
        return (
          <div className="grid gap-5 sm:grid-cols-[1fr_auto]">
            <div className="space-y-4">
              <TextInput label="Name" required value={t.name} onChange={(v) => set({ name: v })} placeholder="Apache Airflow" maxLength={60} />

              <Field label="Logo" hint="Brand logos from the built-in library. Choose “None” to show letters instead.">
                <select
                  value={t.iconSlug}
                  onChange={(e) => set({ iconSlug: e.target.value })}
                  className={INPUT_CLASS}
                >
                  <option value="">None (use letters)</option>
                  {TECH_ICON_OPTIONS.map((o) => (
                    <option key={o.slug} value={o.slug}>
                      {o.title}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput
                  label="Letters"
                  hint="Max 4 characters; used when there is no logo."
                  value={t.letters}
                  onChange={(v) => set({ letters: v })}
                  placeholder="BI"
                  maxLength={4}
                />
                <Field label="Tile color" hint="Empty = logo's brand color.">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      aria-label="Pick tile color"
                      value={/^#[0-9a-f]{6}$/i.test(t.color) ? t.color : fallbackColor}
                      onChange={(e) => set({ color: e.target.value.toUpperCase() })}
                      className="h-9 w-11 cursor-pointer rounded-lg border border-navy-300 bg-white p-1"
                    />
                    <input
                      aria-label="Tile color hex"
                      value={t.color}
                      onChange={(e) => set({ color: e.target.value.trim() })}
                      placeholder={fallbackColor}
                      maxLength={7}
                      className={INPUT_CLASS}
                    />
                    {t.color && (
                      <button
                        type="button"
                        onClick={() => set({ color: "" })}
                        className="shrink-0 text-xs text-navy-500 underline"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </Field>
              </div>

              <LogoUpload value={t.imagePath} onChange={(url) => set({ imagePath: url })} />
            </div>

            <div className="flex flex-col items-center gap-2 rounded-xl border border-navy-100 bg-slate-50 px-6 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-navy-400">Preview</p>
              <TechIcon item={{ ...t, name: t.name || "Tool" }} size={64} showLabel />
            </div>
          </div>
        );
      }}
    />
  );
}
