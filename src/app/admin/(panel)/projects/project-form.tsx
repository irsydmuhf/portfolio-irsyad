"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react";
import {
  publishProject,
  saveProject,
  unpublishProject,
} from "../../project-actions";
import {
  LINK_TYPES,
  firstIssue,
  isHttps,
  projectInputSchema,
  slugify,
  validateForPublish,
  type ProjectData,
} from "@/lib/projects/schema";
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  Field,
  INPUT_CLASS,
  Reorderable,
  Section,
  TagInput,
  TextArea,
  TextInput,
} from "./editors";

export interface FormMeta {
  id?: string;
  status: "draft" | "published";
  hasCover: boolean;
  mediaCount: number;
}

export interface RelatedOption {
  id: string;
  title: string;
  status: string;
}

const lines = (v: string) => v.split("\n");
const clean = (v: string[]) => v.map((s) => s.trim()).filter(Boolean);

/** Drop blank list rows before validation/saving. */
function normalize(d: ProjectData): ProjectData {
  return {
    ...d,
    keyQuestions: clean(d.keyQuestions),
    technicalAnalytics: clean(d.technicalAnalytics),
    technicalProcessing: clean(d.technicalProcessing),
    technicalAutomation: clean(d.technicalAutomation),
    technicalVisualization: clean(d.technicalVisualization),
    privateMeta: {
      ...d.privateMeta,
      originalWorkTitles: clean(d.privateMeta.originalWorkTitles),
      internalSourceReferences: clean(d.privateMeta.internalSourceReferences),
    },
  };
}

export default function ProjectForm({
  initial,
  meta,
  categories,
  relatedOptions,
}: {
  initial: ProjectData;
  meta: FormMeta;
  categories: string[];
  relatedOptions: RelatedOption[];
}) {
  const router = useRouter();
  const [data, setData] = useState<ProjectData>(initial);
  const [baseline, setBaseline] = useState(() => JSON.stringify(initial));
  const [slugTouched, setSlugTouched] = useState(Boolean(meta.id));
  const [message, setMessage] = useState<
    { kind: "ok" | "error"; text: string } | null
  >(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const busy = useRef(false);

  const dirty = JSON.stringify(data) !== baseline;
  const published = meta.status === "published";

  // §46 unsaved-changes warning.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  function patch(p: Partial<ProjectData>) {
    setData((d) => ({ ...d, ...p }));
    setMessage(null);
  }

  function setTitle(title: string) {
    setData((d) => ({
      ...d,
      title,
      slug: slugTouched ? d.slug : slugify(title),
    }));
    setMessage(null);
  }

  function patchMeta(p: Partial<ProjectData["privateMeta"]>) {
    setData((d) => ({ ...d, privateMeta: { ...d.privateMeta, ...p } }));
    setMessage(null);
  }

  const report = useMemo(
    () =>
      validateForPublish({
        title: data.title,
        category: data.category,
        summary: data.summary,
        description: data.description,
        businessProblem: data.businessProblem,
        steps: data.steps,
        tools: data.tools,
        insights: data.insights,
        links: data.links,
        impactSummary: data.impactSummary,
        hasCover: meta.hasCover,
        mediaCount: meta.mediaCount,
        contentVerified: data.privateMeta.contentVerified,
        confidentialityConfirmed: data.privateMeta.confidentialityConfirmed,
      }),
    [data, meta.hasCover, meta.mediaCount]
  );

  function save(after?: () => void) {
    if (busy.current) return;
    const payload = { ...normalize(data), id: meta.id };
    const parsed = projectInputSchema.safeParse(payload);
    if (!parsed.success) {
      setMessage({ kind: "error", text: firstIssue(parsed.error) });
      return;
    }
    busy.current = true;
    startTransition(async () => {
      try {
        const res = await saveProject(parsed.data);
        if (!res.ok) {
          setMessage({ kind: "error", text: res.error });
          return;
        }
        setBaseline(JSON.stringify(data));
        setMessage({ kind: "ok", text: "Draft saved." });
        if (!meta.id) {
          router.replace(`/admin/projects/${res.id}/edit`);
        } else {
          router.refresh();
          after?.();
        }
      } catch {
        setMessage({
          kind: "error",
          text: "Could not reach the server. Check your connection and try again.",
        });
      } finally {
        busy.current = false;
      }
    });
  }

  function changeStatus(kind: "publish" | "unpublish") {
    if (!meta.id || busy.current) return;
    if (dirty) {
      setMessage({
        kind: "error",
        text: "Save your changes first — publishing uses the saved version.",
      });
      return;
    }
    busy.current = true;
    startTransition(async () => {
      try {
        const res =
          kind === "publish"
            ? await publishProject(meta.id!)
            : await unpublishProject(meta.id!);
        if (!res.ok) {
          setMessage({ kind: "error", text: res.error });
          return;
        }
        setWarnings(
          "warnings" in res ? (res.warnings as string[]) : []
        );
        setMessage({
          kind: "ok",
          text:
            kind === "publish"
              ? "Published. The public page is live."
              : "Unpublished. The public URL now returns 404.",
        });
        router.refresh();
      } catch {
        setMessage({
          kind: "error",
          text: "Could not reach the server. Check your connection and try again.",
        });
      } finally {
        busy.current = false;
      }
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="space-y-6"
    >
      {/* ------------------------------------------------ sticky action bar */}
      <div className="sticky top-0 z-10 -mx-2 flex flex-wrap items-center gap-3 rounded-xl border border-navy-200 bg-white/95 px-4 py-3 backdrop-blur">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            published
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {meta.id ? (published ? "Published" : "Draft") : "New draft"}
        </span>
        {dirty ? (
          <span className="text-xs text-amber-700">Unsaved changes</span>
        ) : null}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {meta.id ? (
            <Link
              href={`/admin/projects/${meta.id}/preview`}
              className={BTN_SECONDARY}
            >
              Preview
            </Link>
          ) : null}
          {published && data.slug ? (
            <Link
              href={`/projects/${data.slug}`}
              target="_blank"
              className={BTN_SECONDARY}
            >
              View live <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          ) : null}
          <button type="submit" disabled={pending} className={BTN_PRIMARY}>
            {pending ? "Saving…" : published ? "Save changes" : "Save Draft"}
          </button>
        </div>
      </div>

      {message ? (
        <p
          role={message.kind === "error" ? "alert" : "status"}
          className={`rounded-lg border px-3 py-2 text-sm ${
            message.kind === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {message.text}
        </p>
      ) : null}

      {/* ------------------------------------------------------------ basics */}
      <Section title="Basics">
        <TextInput
          label="Title"
          required
          value={data.title}
          onChange={setTitle}
          maxLength={120}
        />
        <div>
          <TextInput
            label="Slug"
            required
            value={data.slug}
            onChange={(v) => {
              setSlugTouched(true);
              patch({ slug: slugify(v) });
            }}
            hint="Used in the public URL: /projects/<slug>. Lowercase, hyphens only."
            disabled={published}
          />
          {published ? (
            <p className="mt-1 flex items-center gap-1 text-xs text-amber-700">
              <AlertTriangle className="h-3.5 w-3.5" />
              Slug is locked while published — changing it would break the
              public URL.
            </p>
          ) : null}
        </div>
        <div>
          <TextInput
            label="Category"
            value={data.category}
            onChange={(v) => patch({ category: v })}
            list="category-options"
            hint="Pick an existing category or type a new one."
          />
          <datalist id="category-options">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <TextArea
          label="Summary"
          value={data.summary}
          onChange={(v) => patch({ summary: v })}
          rows={2}
          counter={240}
          hint="Shown on cards and as the page subtitle. 240 characters or fewer recommended."
        />
        <TextArea
          label="Description (overview)"
          value={data.description}
          onChange={(v) => patch({ description: v })}
          rows={6}
          hint="Markdown supported. Raw HTML is not rendered."
        />
        <label className="flex items-center gap-2 text-sm text-navy-800">
          <input
            type="checkbox"
            checked={data.featured}
            onChange={(e) => patch({ featured: e.target.checked })}
            className="h-4 w-4 rounded border-navy-300"
          />
          Featured (show in Selected Work on the homepage)
        </label>
      </Section>

      <Section title="Context">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Role" value={data.role} onChange={(v) => patch({ role: v })} />
          <TextInput label="Domain" value={data.domain} onChange={(v) => patch({ domain: v })} />
          <TextInput
            label="Data context"
            value={data.dataContext}
            onChange={(v) => patch({ dataContext: v })}
          />
          <TextInput
            label="Project period"
            value={data.projectPeriod}
            onChange={(v) => patch({ projectPeriod: v })}
            hint="Optional. Hidden on the page when empty."
          />
          <TextInput label="Focus" value={data.focus} onChange={(v) => patch({ focus: v })} />
          <TextInput
            label="Project type"
            value={data.projectType}
            onChange={(v) => patch({ projectType: v })}
            hint="e.g. Professional, Certification"
          />
        </div>
        <TagInput
          label="Tools"
          required
          value={data.tools}
          onChange={(v) => patch({ tools: v })}
          hint="Press Enter or comma after each tool."
        />
      </Section>

      {/* ------------------------------------------------------ narrative */}
      <Section title="Business problem">
        <TextArea
          label="Business problem"
          value={data.businessProblem}
          onChange={(v) => patch({ businessProblem: v })}
          rows={4}
        />
        <Field label="Key questions">
          <Reorderable
            items={data.keyQuestions}
            onChange={(v) => patch({ keyQuestions: v })}
            makeNew={() => ""}
            addLabel="Add question"
            itemLabel="question"
            render={(q, set) => (
              <input
                aria-label="Key question"
                value={q}
                onChange={(e) => set(e.target.value)}
                className={INPUT_CLASS}
              />
            )}
          />
        </Field>
      </Section>

      <Section
        title="What I did (process steps)"
        description="Rendered automatically as a process diagram. Use 2–8 steps; order matters."
      >
        <Reorderable
          items={data.steps}
          onChange={(v) => patch({ steps: v })}
          makeNew={() => ({ title: "", description: "" })}
          addLabel="Add step"
          itemLabel="step"
          max={8}
          emptyText="No steps yet."
          render={(s, set) => (
            <>
              <input
                aria-label="Step title"
                placeholder="Step title"
                value={s.title}
                onChange={(e) => set({ ...s, title: e.target.value })}
                className={INPUT_CLASS}
              />
              <textarea
                aria-label="Step description"
                placeholder="Short description (optional)"
                rows={2}
                value={s.description}
                onChange={(e) => set({ ...s, description: e.target.value })}
                className={INPUT_CLASS}
              />
            </>
          )}
        />
        <TextArea
          label="Approach (narrative)"
          value={data.approachSummary}
          onChange={(v) => patch({ approachSummary: v })}
          rows={4}
          hint="Optional. Markdown supported."
        />
        <TextArea
          label="Solution / implementation"
          value={data.solutionSummary}
          onChange={(v) => patch({ solutionSummary: v })}
          rows={5}
          hint="Markdown. Use '- ' bullet lines for a list."
        />
      </Section>

      <Section title="Insights & impact">
        <Reorderable
          items={data.insights}
          onChange={(v) => patch({ insights: v })}
          makeNew={() => ({ title: "", description: "" })}
          addLabel="Add insight"
          itemLabel="insight"
          emptyText="No insights yet."
          render={(i, set) => (
            <>
              <input
                aria-label="Insight title"
                placeholder="Insight title"
                value={i.title}
                onChange={(e) => set({ ...i, title: e.target.value })}
                className={INPUT_CLASS}
              />
              <textarea
                aria-label="Insight description"
                placeholder="Description"
                rows={3}
                value={i.description}
                onChange={(e) => set({ ...i, description: e.target.value })}
                className={INPUT_CLASS}
              />
            </>
          )}
        />
        <TextArea
          label="Business impact"
          value={data.impactSummary}
          onChange={(v) => patch({ impactSummary: v })}
          rows={4}
        />
      </Section>

      <Section
        title="Technical details"
        description="One item per line."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              ["technicalProcessing", "Data processing"],
              ["technicalAutomation", "Automation"],
              ["technicalAnalytics", "Analytics"],
              ["technicalVisualization", "Visualization"],
            ] as const
          ).map(([key, label]) => (
            <TextArea
              key={key}
              label={label}
              rows={4}
              value={data[key].join("\n")}
              onChange={(v) => patch({ [key]: lines(v) })}
            />
          ))}
        </div>
      </Section>

      <Section title="Public links">
        <Reorderable
          items={data.links}
          onChange={(v) => patch({ links: v })}
          makeNew={() => ({
            type: "github" as const,
            label: "",
            url: "https://",
          })}
          addLabel="Add link"
          itemLabel="link"
          max={12}
          emptyText="No links yet."
          render={(l, set) => (
            <>
              <div className="grid gap-2 sm:grid-cols-[10rem_1fr]">
                <select
                  aria-label="Link type"
                  value={l.type}
                  onChange={(e) =>
                    set({ ...l, type: e.target.value as typeof l.type })
                  }
                  className={INPUT_CLASS}
                >
                  {LINK_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <input
                  aria-label="Link label"
                  placeholder="Label (e.g. View Source Code)"
                  value={l.label}
                  onChange={(e) => set({ ...l, label: e.target.value })}
                  className={INPUT_CLASS}
                />
              </div>
              <input
                aria-label="Link URL"
                placeholder="https://"
                value={l.url}
                onChange={(e) => set({ ...l, url: e.target.value })}
                className={INPUT_CLASS}
              />
              {l.url && !isHttps(l.url) ? (
                <p className="text-xs text-amber-700">
                  HTTPS is recommended for public links.
                </p>
              ) : null}
            </>
          )}
        />
      </Section>

      <Section
        title="Related projects"
        description="Only published projects are shown publicly."
      >
        {relatedOptions.length === 0 ? (
          <p className="text-sm text-navy-500">No other projects yet.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {relatedOptions.map((o) => (
              <li key={o.id}>
                <label className="flex items-center gap-2 text-sm text-navy-800">
                  <input
                    type="checkbox"
                    checked={data.related.includes(o.id)}
                    onChange={(e) =>
                      patch({
                        related: e.target.checked
                          ? [...data.related, o.id]
                          : data.related.filter((r) => r !== o.id),
                      })
                    }
                    className="h-4 w-4 rounded border-navy-300"
                  />
                  {o.title}
                  {o.status !== "published" ? (
                    <span className="text-xs text-navy-400">(draft)</span>
                  ) : null}
                </label>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* ----------------------------------------------------- internal only */}
      <Section
        tone="internal"
        title="INTERNAL / NOT PUBLIC"
        description="Private provenance. Stored separately and never shown on the public site."
      >
        <TextArea
          label="Original work titles (one per line)"
          rows={2}
          value={data.privateMeta.originalWorkTitles.join("\n")}
          onChange={(v) => patchMeta({ originalWorkTitles: lines(v) })}
        />
        <TextArea
          label="Internal source references (one per line)"
          rows={2}
          value={data.privateMeta.internalSourceReferences.join("\n")}
          onChange={(v) => patchMeta({ internalSourceReferences: lines(v) })}
        />
        <TextArea
          label="Internal notes"
          rows={3}
          value={data.privateMeta.internalNotes}
          onChange={(v) => patchMeta({ internalNotes: v })}
        />
        <TextArea
          label="Confidentiality notes"
          rows={2}
          value={data.privateMeta.confidentialityNotes}
          onChange={(v) => patchMeta({ confidentialityNotes: v })}
        />
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-navy-800">
            Confidentiality checklist (required to publish)
          </legend>
          <p className="text-xs text-navy-600">
            Before publishing, confirm: no company, client or employer names,
            no internal system or table names, no real customer data, no
            internal links or credentials, and metrics are not confidential.
          </p>
          <label className="flex items-start gap-2 text-sm text-navy-800">
            <input
              type="checkbox"
              checked={data.privateMeta.contentVerified}
              onChange={(e) =>
                patchMeta({ contentVerified: e.target.checked })
              }
              className="mt-0.5 h-4 w-4 rounded border-navy-300"
            />
            I verified that the content is accurate.
          </label>
          <label className="flex items-start gap-2 text-sm text-navy-800">
            <input
              type="checkbox"
              checked={data.privateMeta.confidentialityConfirmed}
              onChange={(e) =>
                patchMeta({ confidentialityConfirmed: e.target.checked })
              }
              className="mt-0.5 h-4 w-4 rounded border-navy-300"
            />
            I confirm that nothing confidential is included.
          </label>
        </fieldset>
      </Section>

      {/* ------------------------------------------------------ publish panel */}
      {meta.id ? (
        <Section
          title="Publish"
          description={
            published
              ? "This project is live. Unpublishing makes its URL return 404."
              : "Publishing makes this project visible to everyone."
          }
        >
          {report.errors.length > 0 ? (
            <ul className="space-y-1 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {report.errors.map((e) => (
                <li key={e}>• {e}</li>
              ))}
            </ul>
          ) : (
            <p className="flex items-center gap-2 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> All required items are
              complete.
            </p>
          )}
          {(warnings.length ? warnings : report.warnings).length > 0 ? (
            <ul className="space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              {(warnings.length ? warnings : report.warnings).map((w) => (
                <li key={w}>• {w}</li>
              ))}
            </ul>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {published ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => changeStatus("unpublish")}
                className={BTN_SECONDARY}
              >
                {pending ? "Working…" : "Unpublish"}
              </button>
            ) : (
              <button
                type="button"
                disabled={pending || report.errors.length > 0}
                onClick={() => changeStatus("publish")}
                className={BTN_PRIMARY}
              >
                {pending ? "Working…" : "Publish"}
              </button>
            )}
          </div>
        </Section>
      ) : (
        <p className="text-sm text-navy-500">
          Save the draft first to enable media upload, preview and publishing.
        </p>
      )}
    </form>
  );
}
