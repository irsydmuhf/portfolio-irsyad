"use client";

import { deleteEducation, moveEducation, saveEducation } from "../../content-actions";
import { educationSchema, type EducationData } from "@/lib/content/schema";
import ContentList from "../content-list";
import { TagInput, TextInput } from "../editors";

const empty = (): EducationData => ({
  degree: "",
  institution: "",
  detail: "",
  badge: "",
  certifications: [],
});

export default function EducationEditor({ initial }: { initial: EducationData[] }) {
  return (
    <ContentList
      initial={initial}
      makeNew={empty}
      schema={educationSchema}
      save={saveEducation}
      remove={deleteEducation}
      move={moveEducation}
      itemLabel="education"
      addLabel="Add education"
      emptyText="No education entries yet."
      summary={(e) => e.institution || e.degree}
      renderFields={(e, set) => (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Institution" value={e.institution} onChange={(v) => set({ institution: v })} placeholder="Universitas …" maxLength={160} />
          <TextInput label="Degree / program" required value={e.degree} onChange={(v) => set({ degree: v })} placeholder="S.Kom. — Bachelor of Computer Science" maxLength={160} />
          <TextInput label="Detail" hint="e.g. GPA or years" value={e.detail} onChange={(v) => set({ detail: v })} placeholder="GPA 3.80 / 4.00" maxLength={120} />
          <TextInput label="Badge" hint="Short yellow tag next to the name" value={e.badge} onChange={(v) => set({ badge: v })} placeholder="CADS" maxLength={40} />
          <div className="sm:col-span-2">
            <TagInput
              label="Certifications"
              hint="Optional. Press Enter after each one."
              value={e.certifications}
              onChange={(v) => set({ certifications: v })}
            />
          </div>
        </div>
      )}
    />
  );
}
