import type { ReactNode } from "react";
import { FileText, Mail, MapPin } from "lucide-react";
import { siGithub, siInstagram } from "simple-icons";
import type {
  AchievementData,
  EducationData,
  ExperienceData,
  SettingsData,
  SkillCategoryData,
  TechItemData,
} from "@/lib/content/schema";
import IdBadge from "./IdBadge";
import TechStack from "./TechStack";

function Heading({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h2
      id={id}
      className="scroll-mt-8 font-display text-[1.75rem] font-extrabold tracking-tight text-ink sm:text-[2.1rem]"
    >
      {children}
    </h2>
  );
}

/* ------------------------------------------------------------------ contact */

function ContactRow({
  href,
  icon,
  tone,
  children,
}: {
  href?: string;
  icon: ReactNode;
  tone: string;
  children: ReactNode;
}) {
  const inner = (
    <>
      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-white shadow-sm ${tone}`}>
        {icon}
      </span>
      <span className="truncate">{children}</span>
    </>
  );
  const cls = "flex items-center gap-3 text-[15px] text-charcoal-800";
  if (!href) return <li className={cls}>{inner}</li>;
  const external = href.startsWith("http");
  return (
    <li>
      <a
        href={href}
        className={`${cls} rounded-full transition-colors hover:text-brand-600`}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {inner}
      </a>
    </li>
  );
}

/** Destination for the ID card QR code, or null when it should be hidden. */
function qrLink(s: SettingsData): { url: string; label: string } | null {
  const targets = {
    linkedin: { url: s.linkedinUrl, label: "LinkedIn" },
    instagram: { url: s.instagramUrl, label: "Instagram" },
    github: { url: s.githubUrl, label: "GitHub" },
  } as const;
  if (s.qrTarget === "none") return null;
  const t = targets[s.qrTarget];
  return t.url ? { url: t.url, label: t.label } : null;
}

function stripScheme(url: string) {
  return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
}

/* ---------------------------------------------------------------- timelines */

function splitPeriod(period: string): [string, string | null] {
  const parts = period.split(/\s+[—–-]\s+/);
  return parts.length > 1 ? [parts[0], parts.slice(1).join(" – ")] : [period, null];
}

function ExperienceTimeline({ items }: { items: ExperienceData[] }) {
  return (
    <ol className="relative mt-6">
      {items.map((exp, i) => {
        const [start, end] = splitPeriod(exp.period);
        const last = i === items.length - 1;
        return (
          <li key={exp.id ?? `${exp.period}-${exp.role}`} className="grid grid-cols-[5.25rem_1.25rem_1fr] gap-x-2 sm:grid-cols-[6rem_1.5rem_1fr]">
            <p className="pt-px text-sm font-bold leading-snug text-ink">
              {start}
              {end && <span className="block font-medium text-charcoal-500">– {end}</span>}
            </p>
            <div className="relative flex justify-center">
              <span className="relative z-10 mt-1.5 h-2.5 w-2.5 rounded-full bg-brand-500 ring-4 ring-brand-100" />
              {!last && <span className="absolute bottom-0 top-3 w-px bg-charcoal-300" />}
            </div>
            <div className={last ? "" : "pb-9"}>
              <p className="font-display text-[15px] font-bold uppercase tracking-wide text-ink">{exp.role}</p>
              <p className="mt-0.5 text-sm text-charcoal-700">
                <span className="font-semibold">{exp.company}</span>
                {exp.division && <span className="text-charcoal-500"> · {exp.division}</span>}
              </p>
              {exp.employmentType && (
                <span className="mt-2 inline-block rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
                  {exp.employmentType}
                </span>
              )}
              {exp.highlights.length > 0 && (
                <>
                  <p className="mt-3 text-sm font-bold text-ink">Focus:</p>
                  <ul className="mt-1 space-y-0.5 text-sm leading-relaxed text-charcoal-700">
                    {exp.highlights.map((h) => (
                      <li key={h} className="flex gap-2">
                        <span aria-hidden="true" className="text-brand-500">•</span>
                        {h}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function EducationTimeline({ items }: { items: EducationData[] }) {
  return (
    <ol className="mt-6">
      {items.map((edu, i) => {
        const last = i === items.length - 1;
        return (
          <li key={edu.id ?? edu.degree} className="grid grid-cols-[1.25rem_1fr] gap-x-3">
            <div className="relative flex justify-center">
              <span className="relative z-10 mt-1.5 h-2.5 w-2.5 rounded-full bg-tangerine-500 ring-4 ring-tangerine-400/20" />
              {!last && <span className="absolute bottom-0 top-3 w-px bg-charcoal-300" />}
            </div>
            <div className={last ? "" : "pb-7"}>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-display text-[15px] font-bold uppercase tracking-wide text-ink">{edu.institution || edu.degree}</p>
                {edu.badge && (
                  <span className="rounded-md bg-sun-400 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink">
                    {edu.badge}
                  </span>
                )}
              </div>
              {edu.institution && <p className="mt-0.5 text-sm text-charcoal-700">{edu.degree}</p>}
              {edu.detail && <p className="text-sm text-charcoal-500">{edu.detail}</p>}
              {edu.certifications.length > 0 && (
                <p className="mt-1 text-sm text-charcoal-700">{edu.certifications.join(" · ")}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function AchievementTimeline({ achievements }: { achievements: AchievementData[] }) {
  const n = achievements.length;
  if (n === 0) return null;
  const inset = `${50 / n}%`;
  return (
    <div className="relative mt-8">
      {/* horizontal rail through the dots (sm+) */}
      <div
        aria-hidden="true"
        className="absolute top-[2.5rem] hidden h-px bg-charcoal-300 sm:block"
        style={{ left: inset, right: inset }}
      />
      <ol
        className="grid gap-8 sm:gap-6 sm:[grid-template-columns:repeat(var(--n),minmax(0,1fr))]"
        style={{ ["--n" as string]: n }}
      >
        {achievements.map((a) => (
          <li key={a.id ?? a.title} className="relative flex flex-col items-center text-center">
            <p className="h-5 font-display text-sm font-bold leading-5 text-ink">{a.dateLabel}</p>
            <span className="relative z-10 mt-[0.875rem] h-3 w-3 rounded-full bg-brand-500 ring-4 ring-white" />
            <p className="mt-4 font-display text-sm font-extrabold uppercase leading-snug tracking-wide text-ink">
              {a.title}
              {a.subtitle && (
                <>
                  <span className="mx-1.5 text-charcoal-400">|</span>
                  {a.subtitle}
                </>
              )}
            </p>
            <p className="mt-1 text-sm text-charcoal-600">{a.issuer}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ------------------------------------------------------------------ section */

export default function ProfileSection({
  settings,
  experiences,
  educations,
  skillCategories,
  techStack,
  achievements,
}: {
  settings: SettingsData;
  experiences: ExperienceData[];
  educations: EducationData[];
  skillCategories: SkillCategoryData[];
  techStack: TechItemData[];
  achievements: AchievementData[];
}) {
  const paragraphs = settings.bio.split(/\n\s*\n/).filter(Boolean);
  const avatar = settings.avatarPath || "/profile/profile.jpg";
  const idLabel = `DATA-${new Date().getFullYear()}`;
  const qr = qrLink(settings);

  return (
    <section
      id="about"
      aria-labelledby="about-title"
      className="scroll-mt-6 rounded-[2.5rem] bg-white px-6 py-10 shadow-[0_30px_60px_-40px_rgba(30,60,140,.35)] ring-1 ring-black/5 sm:px-10 sm:py-14 lg:px-14"
    >
      {/* about + connect | ID badge */}
      <div className="grid items-start gap-x-12 gap-y-6 lg:grid-cols-[1fr_1.05fr]">
        <div>
          <Heading id="about-title">Behind the Data</Heading>
          {settings.tagline && (
            <p className="mt-3 font-display text-base font-semibold text-brand-600">{settings.tagline}</p>
          )}
          <div className="mt-4 max-w-prose space-y-4 text-[15px] leading-relaxed text-charcoal-700">
            {paragraphs.map((p) => (
              <p key={p.slice(0, 32)}>{p}</p>
            ))}
          </div>

          <div id="contact" className="scroll-mt-8 pt-10">
            <Heading>Let&apos;s Connect</Heading>
            <ul className="mt-5 space-y-3.5">
              {settings.location && (
                <ContactRow icon={<MapPin className="h-4 w-4" />} tone="bg-tangerine-500">
                  {settings.location}
                </ContactRow>
              )}
              <ContactRow href={`mailto:${settings.email}`} icon={<Mail className="h-4 w-4" />} tone="bg-coral-500">
                {settings.email}
              </ContactRow>
              {settings.linkedinUrl && (
                <ContactRow
                  href={settings.linkedinUrl}
                  icon={<span className="font-display text-[13px] font-extrabold leading-none">in</span>}
                  tone="bg-[#0a66c2]"
                >
                  {settings.linkedinLabel || stripScheme(settings.linkedinUrl)}
                </ContactRow>
              )}
              {settings.githubUrl && (
                <ContactRow
                  href={settings.githubUrl}
                  icon={
                    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                      <path d={siGithub.path} fill="currentColor" />
                    </svg>
                  }
                  tone="bg-ink"
                >
                  {settings.githubLabel || stripScheme(settings.githubUrl)}
                </ContactRow>
              )}
              {settings.instagramUrl && (
                <ContactRow
                  href={settings.instagramUrl}
                  icon={
                    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                      <path d={siInstagram.path} fill="currentColor" />
                    </svg>
                  }
                  tone="bg-gradient-to-tr from-[#feda75] via-[#d62976] to-[#4f5bd5]"
                >
                  {stripScheme(settings.instagramUrl)}
                </ContactRow>
              )}
              {settings.resumeUrl && (
                <ContactRow href={settings.resumeUrl} icon={<FileText className="h-4 w-4" />} tone="bg-brand-500">
                  Download résumé (PDF)
                </ContactRow>
              )}
            </ul>
          </div>
        </div>

        <div className="-mx-4 -mt-4 overflow-hidden sm:mx-0 lg:-mt-10 lg:overflow-visible">
          <IdBadge name={settings.displayName} avatar={avatar} idLabel={idLabel} qr={qr} />
        </div>
      </div>

      {/* education + skills | experience */}
      <div className="mt-6 grid gap-x-12 gap-y-14 lg:mt-2 lg:grid-cols-[1fr_1.05fr]">
        <div className="space-y-14">
          {educations.length > 0 && (
            <div>
              <Heading>Education</Heading>
              <EducationTimeline items={educations} />
            </div>
          )}

          {skillCategories.length > 0 && (
            <div>
              <Heading>Skills</Heading>
              <div className="mt-5 space-y-4">
                {skillCategories.map((cat) => (
                  <div key={cat.id ?? cat.name}>
                    <p className="text-xs font-bold uppercase tracking-wider text-charcoal-500">{cat.name}</p>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {cat.skills.map((s) => (
                        <li
                          key={s}
                          className="rounded-full border border-charcoal-300 bg-white px-3 py-1 text-sm text-charcoal-800 transition-colors hover:border-brand-400 hover:bg-brand-50"
                        >
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div id="experience" className="scroll-mt-8">
          <Heading>Experience</Heading>
          <ExperienceTimeline items={experiences} />
        </div>
      </div>

      {/* tech stack: full-bleed ticker spanning the card edge to edge */}
      {techStack.length > 0 && (
        <div className="mt-16">
          <Heading>Tech Stack</Heading>
          <div className="-mx-6 mt-6 sm:-mx-10 lg:-mx-14">
            <TechStack items={techStack} />
          </div>
        </div>
      )}

      {achievements.length > 0 && (
        <div className="mt-16">
          <Heading>Certifications &amp; Achievements</Heading>
          <AchievementTimeline achievements={achievements} />
        </div>
      )}
    </section>
  );
}
