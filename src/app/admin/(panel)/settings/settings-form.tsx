"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, ExternalLink, FileText, Loader2, Upload, X } from "lucide-react";
import { saveSettings, uploadAvatar, uploadResume } from "../../content-actions";
import { settingsSchema, type QrTarget, type SettingsData } from "@/lib/content/schema";
import { firstIssue } from "@/lib/projects/schema";
import { BTN_PRIMARY, BTN_SECONDARY, Field, INPUT_CLASS, Section, TextArea, TextInput } from "../editors";

const DEFAULT_AVATAR = "/profile/profile.jpg";

function ResumeField({
  value,
  onUploaded,
  onPathChange,
}: {
  value: string;
  onUploaded: (url: string) => void;
  onPathChange: (path: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setMsg(null);
    const fd = new FormData();
    fd.set("file", file);
    const res = await uploadResume(fd);
    setBusy(false);
    if (input.current) input.current.value = "";
    if (res.ok) {
      onUploaded(res.url);
      setMsg({ ok: true, text: "Resume updated — it is already live on the site." });
    } else {
      setMsg({ ok: false, text: res.error });
    }
  }

  return (
    <div className="space-y-3 sm:col-span-2">
      <div>
        <p className="text-sm font-medium text-navy-800">Resume (PDF)</p>
        <p className="mt-0.5 text-xs text-navy-500">
          Visitors download it from “Let&apos;s Connect” and the footer. PDF only, up to 8 MB. Uploading saves
          immediately and replaces the previous file.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={input}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          aria-label="Upload resume PDF"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        <button type="button" onClick={() => input.current?.click()} disabled={busy} className={BTN_SECONDARY}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {busy ? "Uploading…" : value ? "Replace PDF" : "Upload PDF"}
        </button>
        {value && (
          <>
            <a href={value} target="_blank" rel="noopener noreferrer" className={BTN_SECONDARY}>
              <FileText className="h-4 w-4" /> View current resume
            </a>
            <button
              type="button"
              onClick={() => onPathChange("")}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-red-600 hover:bg-red-50"
            >
              <X className="h-4 w-4" /> Hide resume
            </button>
          </>
        )}
      </div>
      {!value && <p className="text-sm text-navy-500">No resume is shown on the site right now.</p>}
      {msg && (
        <p className={`text-sm ${msg.ok ? "text-emerald-700" : "text-red-600"}`} role={msg.ok ? "status" : "alert"}>
          {msg.text}
        </p>
      )}
      <TextInput
        label="Resume path or URL (advanced)"
        hint="Set automatically by upload. A site path like /resume.pdf or an https:// link also works. “Hide resume” needs Save changes."
        value={value}
        onChange={onPathChange}
        maxLength={500}
      />
    </div>
  );
}

const QR_OPTIONS: { value: QrTarget; label: string; field?: keyof SettingsData }[] = [
  { value: "linkedin", label: "LinkedIn", field: "linkedinUrl" },
  { value: "instagram", label: "Instagram", field: "instagramUrl" },
  { value: "github", label: "GitHub", field: "githubUrl" },
  { value: "none", label: "No QR code" },
];

function QrTargetField({
  data,
  onChange,
}: {
  data: SettingsData;
  onChange: (v: QrTarget) => void;
}) {
  const opt = QR_OPTIONS.find((o) => o.value === data.qrTarget) ?? QR_OPTIONS[0];
  const url = opt.field ? String(data[opt.field] ?? "") : "";
  return (
    <Field
      label="ID card QR code opens"
      hint="Visitors can scan the QR on the ID card with their phone (or click it) to open this profile."
    >
      <select
        value={data.qrTarget}
        onChange={(e) => onChange(e.target.value as QrTarget)}
        className={INPUT_CLASS}
      >
        {QR_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {opt.field && !url ? (
        <p role="alert" className="mt-1 text-sm text-amber-700">
          Add your {opt.label} URL under “Contact &amp; resume” — until then the QR code is hidden.
        </p>
      ) : url ? (
        <p className="mt-1 truncate text-xs text-navy-500">Encodes: {url}</p>
      ) : null}
    </Field>
  );
}

export interface PrinterOption {
  id: string;
  title: string;
  hasCover: boolean;
}

function PrinterProjectField({
  value,
  options,
  onChange,
}: {
  value: string;
  options: PrinterOption[];
  onChange: (id: string) => void;
}) {
  const picked = options.find((o) => o.id === value);
  return (
    <Field
      label="Project on the printer"
      hint="The paper coming out of the monitor shows this project's cover and title, and links to its case study."
    >
      <select
        value={picked ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        className={INPUT_CLASS}
      >
        <option value="">None — default “Monthly Report” paper</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.title}
          </option>
        ))}
      </select>
      {value && !picked ? (
        <p role="alert" className="mt-1 text-sm text-amber-700">
          The saved project is no longer published, so the default paper is shown. Pick another or save “None”.
        </p>
      ) : picked && !picked.hasCover ? (
        <p role="alert" className="mt-1 text-sm text-amber-700">
          This project has no cover image, so the default paper is shown. Upload a cover in the project editor.
        </p>
      ) : null}
    </Field>
  );
}

function AvatarField({
  value,
  onUploaded,
  onPathChange,
}: {
  value: string;
  onUploaded: (url: string) => void;
  onPathChange: (path: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setMsg(null);
    const fd = new FormData();
    fd.set("file", file);
    const res = await uploadAvatar(fd);
    setBusy(false);
    if (input.current) input.current.value = "";
    if (res.ok) {
      onUploaded(res.url);
      setMsg({ ok: true, text: "Photo updated — it is already live on the site." });
    } else {
      setMsg({ ok: false, text: res.error });
    }
  }

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
      <div className="relative h-36 w-28 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-coral-400 to-coral-600 p-2 shadow-sm">
        <div className="h-full w-full overflow-hidden rounded-[45%_55%_50%_50%/50%_45%_55%_50%] bg-white/50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value || DEFAULT_AVATAR} alt="Current profile photo" className="h-full w-full object-cover" />
        </div>
      </div>
      <div className="min-w-0 flex-1 space-y-3">
        <div>
          <p className="text-sm font-medium text-navy-800">Profile photo</p>
          <p className="mt-0.5 text-xs text-navy-500">
            Shown on the ID card. Portrait, at least 800 px tall; JPG, PNG, WebP or AVIF up to 8 MB. Uploading saves
            immediately.
          </p>
        </div>
        <input
          ref={input}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/avif"
          className="sr-only"
          aria-label="Upload profile photo"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        <button type="button" onClick={() => input.current?.click()} disabled={busy} className={BTN_SECONDARY}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {busy ? "Uploading…" : "Upload new photo"}
        </button>
        {msg && (
          <p className={`text-sm ${msg.ok ? "text-emerald-700" : "text-red-600"}`} role={msg.ok ? "status" : "alert"}>
            {msg.text}
          </p>
        )}
        <TextInput
          label="Photo path or URL (advanced)"
          hint="Set automatically by upload. A site path like /profile/profile.jpg also works."
          value={value}
          onChange={onPathChange}
          maxLength={500}
        />
      </div>
    </div>
  );
}

export default function SettingsForm({
  initial,
  printerOptions,
}: {
  initial: SettingsData;
  printerOptions: PrinterOption[];
}) {
  const [data, setData] = useState<SettingsData>(initial);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  const set = (patch: Partial<SettingsData>) => {
    setData((d) => ({ ...d, ...patch }));
    setDirty(true);
    setStatus(null);
  };

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = settingsSchema.safeParse(data);
    if (!parsed.success) {
      setStatus({ ok: false, text: firstIssue(parsed.error) });
      return;
    }
    setBusy(true);
    const res = await saveSettings(data);
    setBusy(false);
    if (res.ok) {
      setDirty(false);
      setStatus({ ok: true, text: "Saved — the live site is updated." });
    } else {
      setStatus({ ok: false, text: res.error });
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 pb-24">
      <Section title="Profile" description="Bio, photo and the name on the ID card.">
        <AvatarField
          value={data.avatarPath}
          // Upload already persisted avatar_path; keep the form in sync without marking it dirty.
          onUploaded={(url) => setData((d) => ({ ...d, avatarPath: url }))}
          onPathChange={(v) => set({ avatarPath: v })}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Display name" required value={data.displayName} onChange={(v) => set({ displayName: v })} maxLength={120} />
          <TextInput
            label="Role line"
            hint="Shown on the yellow sticky note in the hero. Keep it short."
            value={data.roleLine}
            onChange={(v) => set({ roleLine: v })}
            placeholder="Data Analyst & Engineer"
            maxLength={160}
          />
          <TextInput label="Location" value={data.location} onChange={(v) => set({ location: v })} placeholder="Indonesia" maxLength={120} />
          <QrTargetField data={data} onChange={(v) => set({ qrTarget: v })} />
        </div>
        <TextArea
          label="Bio (Behind the Data)"
          hint="Leave an empty line between paragraphs."
          rows={7}
          value={data.bio}
          onChange={(v) => set({ bio: v })}
          counter={1200}
        />
      </Section>

      <Section title="Hero" description="The badge and tagline around the PORTFOLIO monitor.">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput
            label="Availability badge"
            hint="Leave empty to hide the green badge."
            value={data.availabilityText}
            onChange={(v) => set({ availabilityText: v })}
            placeholder="Available for Work"
            maxLength={80}
          />
          <TextInput
            label="Tagline"
            hint="Blue line under “Behind the Data”."
            value={data.tagline}
            onChange={(v) => set({ tagline: v })}
            maxLength={200}
          />
          <PrinterProjectField
            value={data.printerProjectId}
            options={printerOptions}
            onChange={(id) => set({ printerProjectId: id })}
          />
        </div>
      </Section>

      <Section title="Contact & resume" description="Let's Connect list and footer links.">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Email" required value={data.email} onChange={(v) => set({ email: v })} maxLength={200} />
          <TextInput label="LinkedIn URL" value={data.linkedinUrl} onChange={(v) => set({ linkedinUrl: v })} placeholder="https://linkedin.com/in/…" maxLength={300} />
          <TextInput label="LinkedIn label" hint="Empty = derived from the URL." value={data.linkedinLabel} onChange={(v) => set({ linkedinLabel: v })} maxLength={200} />
          <TextInput label="GitHub URL" value={data.githubUrl} onChange={(v) => set({ githubUrl: v })} placeholder="https://github.com/…" maxLength={300} />
          <TextInput label="GitHub label" hint="Empty = derived from the URL." value={data.githubLabel} onChange={(v) => set({ githubLabel: v })} maxLength={200} />
          <TextInput label="Instagram URL" hint="Optional. Shown in Let's Connect and the footer." value={data.instagramUrl} onChange={(v) => set({ instagramUrl: v })} placeholder="https://instagram.com/…" maxLength={300} />
          <ResumeField
            value={data.resumeUrl}
            // Upload already persisted resume_url; keep the form in sync without marking it dirty.
            onUploaded={(url) => setData((d) => ({ ...d, resumeUrl: url }))}
            onPathChange={(v) => set({ resumeUrl: v })}
          />
        </div>
      </Section>

      <Section title="SEO" description="Search and link-preview text. Empty keeps the built-in defaults.">
        <TextInput label="Page title" value={data.seoTitle} onChange={(v) => set({ seoTitle: v })} maxLength={160} />
        <TextArea label="Meta description" rows={3} value={data.seoDescription} onChange={(v) => set({ seoDescription: v })} counter={320} />
      </Section>

      {/* sticky save bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-navy-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-end gap-4 px-6 py-3 lg:pl-[17rem]">
          <span aria-live="polite" className="min-w-0 text-sm">
            {status ? (
              <span className={`inline-flex items-center gap-1.5 ${status.ok ? "text-emerald-700" : "text-red-600"}`}>
                {status.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                {status.text}
              </span>
            ) : dirty ? (
              <span className="text-amber-700">Unsaved changes</span>
            ) : null}
          </span>
          <a href="/" target="_blank" rel="noopener noreferrer" className={BTN_SECONDARY}>
            <ExternalLink className="h-4 w-4" /> View site
          </a>
          <button type="submit" disabled={busy || !dirty} className={BTN_PRIMARY}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Save changes
          </button>
        </div>
      </div>
    </form>
  );
}
