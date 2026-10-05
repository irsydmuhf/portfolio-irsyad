"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { Project } from "@/data/projects";

type FormState = { error: string } | null;
type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

interface ProjectFormProps {
  action: Action;
  initial?: Project;
  submitLabel: string;
}

const inputClass =
  "w-full rounded-lg border border-charcoal-300 bg-white px-3 py-2 text-sm text-charcoal-900 placeholder:text-charcoal-400 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500";
const labelClass = "mb-1 block text-sm font-medium text-charcoal-700";

function Field({
  label,
  name,
  defaultValue,
  required,
  placeholder,
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className={labelClass}>
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <input
        id={name}
        name={name}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        className={inputClass}
      />
      {hint && <p className="mt-1 text-xs text-charcoal-500">{hint}</p>}
    </div>
  );
}

function AreaField({
  label,
  name,
  defaultValue,
  rows = 4,
  placeholder,
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  rows?: number;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className={labelClass}>
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        defaultValue={defaultValue}
        rows={rows}
        placeholder={placeholder}
        className={inputClass}
      />
      {hint && <p className="mt-1 text-xs text-charcoal-500">{hint}</p>}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-charcoal-200 bg-white p-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-charcoal-500">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export default function ProjectForm({
  action,
  initial,
  submitLabel,
}: ProjectFormProps) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <Section title="Basic Info">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Title"
            name="title"
            defaultValue={initial?.title}
            required
            placeholder="CRM & Customer Retention Analytics"
          />
          <Field
            label="Slug"
            name="slug"
            defaultValue={initial?.slug}
            placeholder="customer-retention"
            hint="URL path. Leave empty to auto-generate from title (create only)."
          />
          <div>
            <label htmlFor="category" className={labelClass}>
              Category
            </label>
            <input
              id="category"
              name="category"
              list="category-options"
              defaultValue={initial?.category}
              placeholder="Customer Analytics"
              className={inputClass}
            />
            <datalist id="category-options">
              <option value="Business Analytics" />
              <option value="Customer Analytics" />
              <option value="Data Automation" />
              <option value="Marketing Analytics" />
              <option value="Operations Analytics" />
              <option value="Machine Learning" />
            </datalist>
          </div>
          <Field
            label="Project Type"
            name="projectType"
            defaultValue={initial?.projectType}
            placeholder="Professional / Certification / Personal"
          />
        </div>
        <AreaField
          label="Summary"
          name="summary"
          defaultValue={initial?.summary}
          rows={2}
          placeholder="One-line description shown on project cards."
        />
      </Section>

      <Section title="Metadata">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Role"
            name="role"
            defaultValue={initial?.role}
            placeholder="Data Analyst"
          />
          <Field
            label="Domain"
            name="domain"
            defaultValue={initial?.domain}
            placeholder="E-commerce / Marketplace"
          />
          <Field
            label="Focus"
            name="focus"
            defaultValue={initial?.focus}
            placeholder="Customer Retention"
          />
          <Field
            label="Data Sources"
            name="data"
            defaultValue={initial?.data}
            placeholder="Marketplace + CRM Transactions"
          />
          <Field
            label="Tools"
            name="tools"
            defaultValue={initial?.tools.join(", ")}
            placeholder="SQL, Google Sheets, Power BI"
            hint="Comma-separated."
          />
          <Field
            label="GitHub URL (optional)"
            name="github"
            defaultValue={initial?.github ?? ""}
            placeholder="https://github.com/..."
            hint="Leave empty for no GitHub button."
          />
          <Field
            label="Cover Image Path"
            name="cover"
            defaultValue={initial?.cover}
            placeholder="/projects/crm/cover.webp"
          />
        </div>
      </Section>

      <Section title="Business Problem">
        <AreaField
          label="Business Problem"
          name="businessProblem"
          defaultValue={initial?.businessProblem}
          rows={4}
          placeholder="Why was this project created? What business pain did it address?"
        />
        <AreaField
          label="Business Questions"
          name="businessQuestions"
          defaultValue={initial?.businessQuestions.join("\n")}
          rows={4}
          placeholder={"Which customers tend to repeat purchase?\nHow long until repeat purchase?"}
          hint="One question per line."
        />
      </Section>

      <Section title="Approach & Solution">
        <div className="grid gap-4 sm:grid-cols-2">
          <AreaField
            label="Approach Steps"
            name="approach"
            defaultValue={initial?.approach.join("\n")}
            rows={7}
            placeholder={"Data Collection\nCleaning\nAnalysis"}
            hint="One step per line."
          />
          <AreaField
            label="Solution Components"
            name="solution"
            defaultValue={initial?.solution.join("\n")}
            rows={7}
            placeholder={"Central Database\nDashboard"}
            hint="One component per line."
          />
        </div>
      </Section>

      <Section title="Key Insights">
        <AreaField
          label="Insights"
          name="insights"
          defaultValue={initial?.insights
            .map((i) => `${i.title} | ${i.description}`)
            .join("\n")}
          rows={5}
          placeholder={"Bundle buyers repeat more often | Bundle customers showed 2x stronger retention."}
          hint="One insight per line, format: Title | Description"
        />
        <AreaField
          label="Business Impact"
          name="impact"
          defaultValue={initial?.impact}
          rows={3}
          placeholder="Factual outcome. Avoid invented numbers."
        />
      </Section>

      <Section title="Technical Details">
        <div className="grid gap-4 sm:grid-cols-2">
          <AreaField
            label="Data Processing"
            name="td_dataProcessing"
            defaultValue={initial?.technicalDetails.dataProcessing.join(", ")}
            rows={3}
            placeholder="SQL, Google Sheets, Data Cleaning"
            hint="Comma or newline separated."
          />
          <AreaField
            label="Automation"
            name="td_automation"
            defaultValue={initial?.technicalDetails.automation.join(", ")}
            rows={3}
            placeholder="Triggers, API Integration"
            hint="Comma or newline separated."
          />
          <AreaField
            label="Analytics"
            name="td_analytics"
            defaultValue={initial?.technicalDetails.analytics.join(", ")}
            rows={3}
            placeholder="Cohort Analysis, KPI Design"
            hint="Comma or newline separated."
          />
          <AreaField
            label="Visualization"
            name="td_visualization"
            defaultValue={initial?.technicalDetails.visualization.join(", ")}
            rows={3}
            placeholder="Looker Studio, Power BI"
            hint="Comma or newline separated."
          />
        </div>
      </Section>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-accent-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving..." : submitLabel}
        </button>
        <Link
          href="/admin"
          className="rounded-lg border border-charcoal-300 bg-white px-6 py-2.5 text-sm font-semibold text-charcoal-700 transition-colors hover:bg-charcoal-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
