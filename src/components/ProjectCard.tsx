import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Project } from "@/data/projects";

interface ProjectCardProps {
  project: Project;
  index?: number;
}

const TONES = [
  { from: "#5b86fb", to: "#2753d8", bar: "#ffc935" },
  { from: "#ffa040", to: "#e8631a", bar: "#ffffff" },
  { from: "#3cc6c9", to: "#178f95", bar: "#ffc935" },
  { from: "#f06a5e", to: "#cc3530", bar: "#ffffff" },
];

/** Illustrated placeholder for projects without (or with a broken) cover. */
function CoverArt({ project, index }: { project: Project; index: number }) {
  const tone = TONES[index % TONES.length];
  const bars = [42, 68, 54, 82, 64, 95, 76];
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ background: `linear-gradient(150deg, ${tone.from}, ${tone.to})` }}
    >
      <div className="bg-dot-matrix absolute inset-0 opacity-60" />
      <div className="absolute bottom-0 left-6 right-6 flex h-[58%] items-end gap-2">
        {bars.map((h, i) => (
          <span
            key={i}
            className="flex-1 rounded-t-lg"
            style={{
              height: `${h}%`,
              background: i === bars.length - 2 ? tone.bar : "rgba(255,255,255,.28)",
            }}
          />
        ))}
      </div>
      <p className="absolute left-6 top-14 line-clamp-2 max-w-[80%] font-display text-xl font-extrabold leading-tight text-white [text-shadow:0_2px_0_rgba(0,0,0,.15)] sm:text-2xl">
        {project.title}
      </p>
    </div>
  );
}

function ProjectCover({ project, index }: { project: Project; index: number }) {
  // The illustration always renders; a real cover is layered on top as a CSS
  // background, so a missing/broken file simply reveals the art underneath
  // (no broken-image icon, no hydration timing issues).
  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[1.4rem] bg-charcoal-100">
      <CoverArt project={project} index={index} />
      {project.cover && (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-[1.04]"
          style={{ backgroundImage: `url(${JSON.stringify(project.cover)})` }}
        />
      )}
      <div className="absolute left-4 top-4 flex flex-wrap gap-1.5">
        {project.projectType && (
          <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-ink shadow-sm backdrop-blur">
            {project.projectType}
          </span>
        )}
      </div>
    </div>
  );
}

export default function ProjectCard({ project, index = 0 }: ProjectCardProps) {
  const href = `/projects/${project.slug}`;
  return (
    <article className="group relative flex flex-col rounded-[1.9rem] bg-white p-2.5 ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_40px_-24px_rgba(30,60,140,.45)]">
      <ProjectCover project={project} index={index} />

      <div className="flex flex-1 flex-col px-3.5 pb-3 pt-4">
        <p className="text-xs font-bold uppercase tracking-wider text-brand-600">
          {project.category}
          {project.domain && <span className="font-medium text-charcoal-400"> · {project.domain}</span>}
        </p>

        <h3 className="mt-2 font-display text-lg font-bold leading-snug text-ink">
          <Link href={href} className="after:absolute after:inset-0 after:rounded-[1.9rem] focus:outline-none">
            {project.title}
          </Link>
        </h3>

        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-charcoal-600">{project.summary}</p>

        {project.tools.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {project.tools.slice(0, 5).map((tool) => (
              <li
                key={tool}
                className="rounded-full border border-charcoal-200 px-2.5 py-0.5 text-xs font-medium text-charcoal-700"
              >
                {tool}
              </li>
            ))}
            {project.tools.length > 5 && (
              <li className="px-1 py-0.5 text-xs font-medium text-charcoal-400">+{project.tools.length - 5}</li>
            )}
          </ul>
        )}

        <div className="mt-auto flex items-center justify-between pt-5">
          <span className="inline-flex items-center gap-1 text-sm font-bold text-ink group-hover:text-brand-600">
            Read case study
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
          {project.github && (
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              className="relative z-10 rounded-full border border-charcoal-200 px-3 py-1 text-xs font-semibold text-charcoal-700 transition-colors hover:border-ink hover:bg-ink hover:text-white"
            >
              GitHub
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
