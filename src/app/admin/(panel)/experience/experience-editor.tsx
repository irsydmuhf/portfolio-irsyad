"use client";

import { deleteExperience, moveExperience, saveExperience } from "../../content-actions";
import { experienceSchema, type ExperienceData } from "@/lib/content/schema";
import ContentList from "../content-list";
import { TagInput, TextInput } from "../editors";

const empty = (): ExperienceData => ({
  period: "",
  role: "",
  company: "",
  division: "",
  employmentType: "",
  highlights: [],
});

export default function ExperienceEditor({ initial }: { initial: ExperienceData[] }) {
  return (
    <ContentList
      initial={initial}
      makeNew={empty}
      schema={experienceSchema}
      save={saveExperience}
      remove={deleteExperience}
      move={moveExperience}
      itemLabel="experience"
      addLabel="Add experience"
      emptyText="No experience yet. The Experience timeline is hidden until you add one."
      summary={(e) => [e.role, e.company].filter(Boolean).join(" — ")}
      renderFields={(e, set) => (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Role" required value={e.role} onChange={(v) => set({ role: v })} placeholder="Data Analyst" maxLength={120} />
          <TextInput label="Company" required value={e.company} onChange={(v) => set({ company: v })} maxLength={120} />
          <TextInput
            label="Period"
            required
            hint='Use "Start — End"; the timeline splits it into two lines.'
            value={e.period}
            onChange={(v) => set({ period: v })}
            placeholder="Oct 2025 — Present"
            maxLength={60}
          />
          <TextInput label="Employment type" value={e.employmentType} onChange={(v) => set({ employmentType: v })} placeholder="Full-time" maxLength={60} />
          <TextInput label="Division / team" value={e.division} onChange={(v) => set({ division: v })} placeholder="Data & IT" maxLength={120} />
          <div className="sm:col-span-2">
            <TagInput
              label="Focus / highlights"
              hint="Shown as bullet points. Press Enter after each one."
              value={e.highlights}
              onChange={(v) => set({ highlights: v })}
            />
          </div>
        </div>
      )}
    />
  );
}
