"use client";

// Small accessible form primitives shared by the project editor.

import { useId, useState, type KeyboardEvent, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";

export const INPUT_CLASS =
  "w-full rounded-lg border border-navy-300 bg-white px-3 py-2 text-sm text-navy-900 placeholder:text-navy-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100 disabled:bg-slate-100";

export const BTN_SECONDARY =
  "inline-flex items-center gap-1.5 rounded-lg border border-navy-300 bg-white px-3 py-1.5 text-sm font-medium text-navy-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

export const BTN_PRIMARY =
  "inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60";

export function Field({
  label,
  hint,
  required,
  children,
  htmlFor,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-navy-800"
      >
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </label>
      {hint ? <p className="mt-0.5 text-xs text-navy-500">{hint}</p> : null}
      <div className="mt-1">{children}</div>
    </div>
  );
}

export function TextInput({
  label,
  value,
  onChange,
  hint,
  required,
  placeholder,
  disabled,
  list,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  list?: string;
  maxLength?: number;
}) {
  const id = useId();
  return (
    <Field label={label} hint={hint} required={required} htmlFor={id}>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        list={list}
        maxLength={maxLength}
        className={INPUT_CLASS}
      />
    </Field>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  hint,
  rows = 4,
  required,
  counter,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  rows?: number;
  required?: boolean;
  counter?: number;
}) {
  const id = useId();
  return (
    <Field label={label} hint={hint} required={required} htmlFor={id}>
      <textarea
        id={id}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={INPUT_CLASS}
      />
      {counter ? (
        <p
          className={`mt-1 text-right text-xs ${
            value.length > counter ? "text-red-600" : "text-navy-400"
          }`}
        >
          {value.length}/{counter}
        </p>
      ) : null}
    </Field>
  );
}

/** Tag input: Enter or comma adds, Backspace on empty removes last. */
export function TagInput({
  label,
  value,
  onChange,
  hint,
  required,
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  hint?: string;
  required?: boolean;
}) {
  const id = useId();
  const [draft, setDraft] = useState("");

  function commit() {
    const t = draft.trim().replace(/,$/, "").trim();
    if (t && !value.some((v) => v.toLowerCase() === t.toLowerCase())) {
      onChange([...value, t]);
    }
    setDraft("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit();
    } else if (e.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <Field label={label} hint={hint} required={required} htmlFor={id}>
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-navy-300 bg-white p-2 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-100">
        {value.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 rounded-full bg-navy-100 px-2.5 py-1 text-xs font-medium text-navy-700"
          >
            {t}
            <button
              type="button"
              aria-label={`Remove ${t}`}
              onClick={() => onChange(value.filter((v) => v !== t))}
              className="rounded-full hover:text-red-600"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={commit}
          placeholder={value.length ? "" : "Type and press Enter"}
          className="min-w-[8rem] flex-1 border-0 bg-transparent px-1 py-0.5 text-sm outline-none"
        />
      </div>
    </Field>
  );
}

/** Add / remove / move up / move down list. Keyboard- and screen-reader-friendly. */
export function Reorderable<T>({
  items,
  onChange,
  render,
  makeNew,
  addLabel,
  itemLabel,
  max,
  emptyText,
}: {
  items: T[];
  onChange: (next: T[]) => void;
  render: (item: T, set: (next: T) => void, index: number) => ReactNode;
  makeNew: () => T;
  addLabel: string;
  itemLabel: string;
  max?: number;
  emptyText?: string;
}) {
  function move(i: number, d: -1 | 1) {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {items.length === 0 && emptyText ? (
        <p className="text-sm text-navy-500">{emptyText}</p>
      ) : null}
      {items.map((item, i) => (
        <div
          key={i}
          className="flex items-start gap-3 rounded-lg border border-navy-200 bg-slate-50 p-3"
        >
          <span className="mt-2 w-5 shrink-0 text-center text-xs font-semibold text-navy-400">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1 space-y-2">
            {render(
              item,
              (next) => onChange(items.map((x, k) => (k === i ? next : x))),
              i
            )}
          </div>
          <div className="flex shrink-0 flex-col gap-1">
            <button
              type="button"
              aria-label={`Move ${itemLabel} ${i + 1} up`}
              disabled={i === 0}
              onClick={() => move(i, -1)}
              className="rounded border border-navy-200 bg-white p-1 text-navy-600 hover:bg-navy-50 disabled:opacity-30"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              aria-label={`Move ${itemLabel} ${i + 1} down`}
              disabled={i === items.length - 1}
              onClick={() => move(i, 1)}
              className="rounded border border-navy-200 bg-white p-1 text-navy-600 hover:bg-navy-50 disabled:opacity-30"
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              aria-label={`Remove ${itemLabel} ${i + 1}`}
              onClick={() => onChange(items.filter((_, k) => k !== i))}
              className="rounded border border-red-200 bg-white p-1 text-red-600 hover:bg-red-50"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, makeNew()])}
        disabled={max !== undefined && items.length >= max}
        className={BTN_SECONDARY}
      >
        <Plus className="h-4 w-4" /> {addLabel}
      </button>
    </div>
  );
}

export function Section({
  title,
  description,
  children,
  tone = "default",
}: {
  title: string;
  description?: string;
  children: ReactNode;
  tone?: "default" | "internal";
}) {
  return (
    <section
      className={`rounded-xl border p-5 ${
        tone === "internal"
          ? "border-amber-300 bg-amber-50"
          : "border-navy-200 bg-white"
      }`}
    >
      <h2 className="text-base font-semibold text-navy-900">{title}</h2>
      {description ? (
        <p className="mt-0.5 text-sm text-navy-500">{description}</p>
      ) : null}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}
