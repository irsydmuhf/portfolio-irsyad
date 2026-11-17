"use client";

import { deleteAchievement, moveAchievement, saveAchievement } from "../../content-actions";
import { achievementSchema, type AchievementData } from "@/lib/content/schema";
import ContentList from "../content-list";
import { TextInput } from "../editors";

const empty = (): AchievementData => ({ dateLabel: "", title: "", subtitle: "", issuer: "" });

export default function AchievementsEditor({ initial }: { initial: AchievementData[] }) {
  return (
    <ContentList
      initial={initial}
      makeNew={empty}
      schema={achievementSchema}
      save={saveAchievement}
      remove={deleteAchievement}
      move={moveAchievement}
      itemLabel="achievement"
      addLabel="Add achievement"
      emptyText="No achievements yet. The section is hidden until you add one."
      summary={(a) => [a.dateLabel, a.title].filter(Boolean).join(" · ")}
      renderFields={(a, set) => (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Title" required value={a.title} onChange={(v) => set({ title: v })} placeholder="Associate Data Scientist" maxLength={120} />
          <TextInput label="Subtitle" hint='Shown after a "|" separator' value={a.subtitle} onChange={(v) => set({ subtitle: v })} placeholder="Certified (CADS)" maxLength={120} />
          <TextInput label="Date" required value={a.dateLabel} onChange={(v) => set({ dateLabel: v })} placeholder="Sep 2026" maxLength={40} />
          <TextInput label="Issuer" value={a.issuer} onChange={(v) => set({ issuer: v })} placeholder="BNSP" maxLength={120} />
        </div>
      )}
    />
  );
}
