"use client";

import { deleteSkillCategory, moveSkillCategory, saveSkillCategory } from "../../content-actions";
import { skillCategorySchema, type SkillCategoryData } from "@/lib/content/schema";
import ContentList from "../content-list";
import { TagInput, TextInput } from "../editors";

const empty = (): SkillCategoryData => ({ name: "", skills: [] });

export default function SkillsEditor({ initial }: { initial: SkillCategoryData[] }) {
  return (
    <ContentList
      initial={initial}
      makeNew={empty}
      schema={skillCategorySchema}
      save={saveSkillCategory}
      remove={deleteSkillCategory}
      move={moveSkillCategory}
      itemLabel="category"
      addLabel="Add skill category"
      emptyText="No skill categories yet."
      summary={(c) => (c.name ? `${c.name} (${c.skills.length})` : "")}
      renderFields={(c, set) => (
        <>
          <TextInput label="Category name" required value={c.name} onChange={(v) => set({ name: v })} placeholder="Analytics" maxLength={80} />
          <TagInput
            label="Skills"
            hint="Shown as pills. Press Enter after each skill."
            value={c.skills}
            onChange={(v) => set({ skills: v })}
          />
        </>
      )}
    />
  );
}
