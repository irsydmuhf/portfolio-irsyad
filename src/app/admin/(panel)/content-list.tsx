"use client";

// Generic save-and-live list editor for the content tables (Phase 15):
// each entry is a card with its own Save / Delete / ↑ / ↓. Saving goes
// straight to the live site (no draft stage), so every action reports its
// outcome inline.

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import type { ZodType } from "zod";
import { firstIssue } from "@/lib/projects/schema";
import { BTN_PRIMARY, BTN_SECONDARY } from "./editors";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

interface Entry<T> {
  key: string;
  data: T;
  dirty: boolean;
  open: boolean;
  busy: "save" | "delete" | "move" | null;
  error: string | null;
  savedAt: number | null;
}

let seq = 0;
const nextKey = () => `e${++seq}`;

export interface ContentListProps<T extends { id?: string }> {
  initial: T[];
  makeNew: () => T;
  /** Card header text when collapsed. */
  summary: (item: T) => ReactNode;
  renderFields: (item: T, set: (patch: Partial<T>) => void) => ReactNode;
  schema: ZodType;
  save: (item: T) => Promise<Result<{ id: string }>>;
  remove: (id: string) => Promise<Result>;
  move: (id: string, direction: "up" | "down") => Promise<Result>;
  itemLabel: string;
  addLabel: string;
  emptyText: string;
}

export default function ContentList<T extends { id?: string }>({
  initial,
  makeNew,
  summary,
  renderFields,
  schema,
  save,
  remove,
  move,
  itemLabel,
  addLabel,
  emptyText,
}: ContentListProps<T>) {
  const [entries, setEntries] = useState<Entry<T>[]>(() =>
    initial.map((data) => ({
      key: nextKey(),
      data,
      dirty: false,
      open: false,
      busy: null,
      error: null,
      savedAt: null,
    }))
  );
  const anyDirty = entries.some((e) => e.dirty);
  const listRef = useRef<HTMLOListElement>(null);

  // Warn before leaving with unsaved edits.
  useEffect(() => {
    if (!anyDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [anyDirty]);

  const patch = (key: string, p: Partial<Entry<T>>) =>
    setEntries((list) => list.map((e) => (e.key === key ? { ...e, ...p } : e)));

  function add() {
    setEntries((list) => [
      ...list,
      {
        key: nextKey(),
        data: makeNew(),
        dirty: true,
        open: true,
        busy: null,
        error: null,
        savedAt: null,
      },
    ]);
    requestAnimationFrame(() => {
      const last = listRef.current?.lastElementChild;
      last?.scrollIntoView({ behavior: "smooth", block: "center" });
      last?.querySelector<HTMLInputElement>("input, textarea, select")?.focus();
    });
  }

  async function onSave(entry: Entry<T>) {
    const parsed = schema.safeParse(entry.data);
    if (!parsed.success) {
      patch(entry.key, { error: firstIssue(parsed.error), open: true });
      return;
    }
    patch(entry.key, { busy: "save", error: null });
    const res = await save(entry.data);
    if (res.ok) {
      patch(entry.key, {
        busy: null,
        dirty: false,
        savedAt: Date.now(),
        data: { ...entry.data, id: res.id },
      });
    } else {
      patch(entry.key, { busy: null, error: res.error });
    }
  }

  async function onDelete(entry: Entry<T>) {
    const label = String(summary(entry.data) || itemLabel);
    if (!entry.data.id) {
      setEntries((list) => list.filter((e) => e.key !== entry.key));
      return;
    }
    if (!window.confirm(`Delete "${label}"? This removes it from the live site.`)) return;
    patch(entry.key, { busy: "delete", error: null });
    const res = await remove(entry.data.id);
    if (res.ok) setEntries((list) => list.filter((e) => e.key !== entry.key));
    else patch(entry.key, { busy: null, error: res.error });
  }

  async function onMove(index: number, direction: "up" | "down") {
    const entry = entries[index];
    if (!entry.data.id) return;
    const target = index + (direction === "up" ? -1 : 1);
    patch(entry.key, { busy: "move", error: null });
    const res = await move(entry.data.id, direction);
    if (!res.ok) {
      patch(entry.key, { busy: null, error: res.error });
      return;
    }
    setEntries((list) => {
      const next = [...list];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((e) => (e.key === entry.key ? { ...e, busy: null } : e));
    });
  }

  return (
    <div>
      {entries.length === 0 ? (
        <p className="rounded-xl border border-dashed border-navy-300 bg-white p-8 text-center text-sm text-navy-500">
          {emptyText}
        </p>
      ) : (
        <ol ref={listRef} className="space-y-3">
          {entries.map((entry, i) => {
            const saved = Boolean(entry.data.id);
            const prev = entries[i - 1];
            const next = entries[i + 1];
            const canUp = saved && !!prev?.data.id && !entry.busy;
            const canDown = saved && !!next?.data.id && !entry.busy;
            const panelId = `${entry.key}-panel`;
            const title = summary(entry.data);

            return (
              <li
                key={entry.key}
                className={`rounded-xl border bg-white transition-colors ${
                  entry.dirty ? "border-orange-300" : "border-navy-200"
                }`}
              >
                <div className="flex items-center gap-2 p-3">
                  <span className="w-6 shrink-0 text-center text-xs font-semibold text-navy-400">
                    {i + 1}
                  </span>
                  <button
                    type="button"
                    aria-expanded={entry.open}
                    aria-controls={panelId}
                    onClick={() => patch(entry.key, { open: !entry.open })}
                    className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1 py-1 text-left hover:bg-slate-50"
                  >
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-navy-400 transition-transform ${entry.open ? "rotate-180" : ""}`}
                    />
                    <span className="truncate text-sm font-semibold text-navy-900">
                      {title || <span className="font-normal italic text-navy-400">New {itemLabel}</span>}
                    </span>
                    {!saved && (
                      <span className="shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-semibold text-orange-700">
                        New
                      </span>
                    )}
                    {saved && entry.dirty && (
                      <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                        Unsaved
                      </span>
                    )}
                  </button>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      aria-label={`Move ${itemLabel} ${i + 1} up`}
                      disabled={!canUp}
                      onClick={() => onMove(i, "up")}
                      className="rounded-md border border-navy-200 p-1.5 text-navy-600 hover:bg-navy-50 disabled:opacity-30"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Move ${itemLabel} ${i + 1} down`}
                      disabled={!canDown}
                      onClick={() => onMove(i, "down")}
                      className="rounded-md border border-navy-200 p-1.5 text-navy-600 hover:bg-navy-50 disabled:opacity-30"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {entry.open && (
                  <div id={panelId} className="space-y-4 border-t border-navy-100 p-4">
                    {renderFields(entry.data, (p) =>
                      patch(entry.key, { data: { ...entry.data, ...p }, dirty: true, savedAt: null })
                    )}

                    {entry.error && (
                      <p role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        {entry.error}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => onDelete(entry)}
                        disabled={!!entry.busy}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        {entry.busy === "delete" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        {saved ? "Delete" : "Discard"}
                      </button>
                      <div className="flex items-center gap-3">
                        <span aria-live="polite" className="text-sm text-emerald-700">
                          {entry.savedAt && !entry.dirty ? (
                            <span className="inline-flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4" /> Saved — live on the site
                            </span>
                          ) : null}
                        </span>
                        <button
                          type="button"
                          onClick={() => onSave(entry)}
                          disabled={!!entry.busy || (!entry.dirty && saved)}
                          className={BTN_PRIMARY}
                        >
                          {entry.busy === "save" && <Loader2 className="h-4 w-4 animate-spin" />}
                          {saved ? "Save changes" : `Add ${itemLabel}`}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}

      <button type="button" onClick={add} className={`${BTN_SECONDARY} mt-4`}>
        <Plus className="h-4 w-4" /> {addLabel}
      </button>
    </div>
  );
}

export function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-bold text-navy-900">{title}</h1>
      <p className="mt-1 text-sm text-navy-500">{description}</p>
    </header>
  );
}
