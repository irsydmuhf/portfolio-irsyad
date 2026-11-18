import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, ArrowUpRight, ChartColumnIncreasing, ExternalLink } from "lucide-react";
import type { CaseStudyProject } from "@/lib/projects/case-study";
import Markdown from "./Markdown";
import ProjectProcessFlow from "./ProjectProcessFlow";
import SafeImage from "./SafeImage";

/**
 * The single case-study renderer (PRD §40). Used by /projects/[slug] and by
 * the admin draft preview so both always look identical. Empty optional
 * sections are omitted entirely.
 *
 * Visual language matches the homepage: dotted page, big rounded white cards,
 * a soft blue hero panel, Poppins headings, brand-blue / coral / sun accents.
 * The component renders its own centred column, so callers only supply the
 * page background (`bg-dots`).
 */

const CARD_SHADOW = "shadow-[0_30px_60px_-40px_rgba(30,60,140,.45)]";

// Static class names so Tailwind can see them.
const ACCENTS = {
  brand: "bg-brand-500",
  coral: "bg-coral-500",
  sun: "bg-sun-400",
  mint: "bg-mint-400",
} as const;
type Accent = keyof typeof ACCENTS;

const SOFT_TONES = [
  { bg: "bg-brand-50", text: "text-brand-600" },
  { bg: "bg-[#fff3e3]", text: "text-tangerine-500" },
  { bg: "bg-[#e6f7f7]", text: "text-mint-500" },
  { bg: "bg-[#fdeceb]", text: "text-coral-500" },
];

const COVER_TONES = [
  "from-brand-400 to-brand-600",
  "from-tangerine-400 to-[#e8631a]",
  "from-mint-400 to-[#178f95]",
  "from-coral-400 to-coral-600",
];

function Card({
  title,
  children,
  accent = "brand",
}: {
  title: string;
  children: ReactNode;
  accent?: Accent;
}) {
  return (
    <section
      className={`rounded-[2.5rem] bg-white px-5 py-8 ring-1 ring-black/5 sm:px-10 sm:py-12 ${CARD_SHADOW}`}
    >
      <span
        aria-hidden="true"
        className={`mb-4 block h-1.5 w-10 rounded-full ${ACCENTS[accent]}`}
      />
      <h2 className="font-display text-[1.6rem] font-extrabold tracking-tight text-ink sm:text-[2rem]">
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  if (!value.trim()) return null;
  return (
    <div className="rounded-2xl bg-white/70 p-3.5 ring-1 ring-black/5 backdrop-blur">
      <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal-500">
        {label}
      </span>
      <p className="mt-1 text-sm font-semibold leading-snug text-ink">{value}</p>
    </div>
  );
}

function TechGroup({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-[1.5rem] bg-brand-50 p-5 ring-1 ring-black/5">
      <h3 className="text-xs font-bold uppercase tracking-wider text-brand-700">
        {title}
      </h3>
      <ul className="mt-3 space-y-2.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-[15px] leading-snug text-charcoal-700">
            <span aria-hidden="true" className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function CaseStudyView({
  project: p,
  backHref = "/",
}: {
  project: CaseStudyProject;
  backHref?: string;
}) {
  const tech = p.technical;
  const hasTech = Object.values(tech).some((v) => v.length > 0);
  const primaryLink = p.links[0];

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-3 py-6 sm:space-y-6 sm:px-6 sm:py-10">
      {/* ----------------------------------------------------------- hero */}
      <header className={`rounded-[2.5rem] bg-white p-2.5 ring-1 ring-black/5 sm:p-4 ${CARD_SHADOW}`}>
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-b from-[#f5f8ff] via-[#dce6ff] to-[#b4c9ff] px-5 pb-8 pt-5 sm:px-10 sm:pb-12 sm:pt-7">
          {/* decorative tile, echoing the homepage monitor badge */}
          <div
            aria-hidden="true"
            className="animate-float pointer-events-none absolute right-8 top-20 hidden rotate-12 md:block"
          >
            <div className="grid h-20 w-20 place-items-center rounded-[1.4rem] bg-white shadow-[0_14px_22px_-10px_rgba(30,60,140,.5),inset_0_-5px_0_rgba(0,0,0,.06)]">
              <ChartColumnIncreasing className="h-9 w-9 text-brand-500" strokeWidth={2.5} />
            </div>
          </div>

          <div className="relative flex flex-wrap items-center gap-2">
            <Link
              href={backHref}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-ink shadow-sm ring-1 ring-black/5 backdrop-blur transition-colors hover:bg-ink hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Portfolio
            </Link>
            {p.projectType ? (
              <span className="rounded-full bg-white/60 px-3 py-1.5 text-xs font-semibold text-charcoal-700">
                {p.projectType}
              </span>
            ) : null}
          </div>

          <div className="relative mt-10 max-w-3xl sm:mt-14">
            {p.category ? (
              <p className="text-xs font-bold uppercase tracking-wider text-brand-600 sm:text-sm">
                {p.category}
              </p>
            ) : null}
            <h1 className="mt-2 font-display text-[clamp(2rem,6vw,3.6rem)] font-black leading-[1.06] tracking-tight text-ink">
              {p.title}
            </h1>
            {p.summary ? (
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-charcoal-700 sm:text-lg">
                {p.summary}
              </p>
            ) : null}
          </div>

          <div className="relative mt-8 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            <Tile label="Role" value={p.role} />
            <Tile label="Domain" value={p.domain} />
            <Tile label="Data Context" value={p.dataContext} />
            <Tile label="Period" value={p.projectPeriod} />
            <Tile label="Focus" value={p.focus} />
          </div>

          {p.tools.length > 0 ? (
            <ul aria-label="Tools" className="relative mt-4 flex flex-wrap gap-1.5">
              {p.tools.map((tool) => (
                <li
                  key={tool}
                  className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-charcoal-700 shadow-sm ring-1 ring-black/5"
                >
                  {tool}
                </li>
              ))}
            </ul>
          ) : null}

          {primaryLink ? (
            <div className="relative mt-6 flex flex-wrap gap-2.5">
              {p.links.map((l, i) => (
                <a
                  key={`${l.url}-${i}`}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={
                    i === 0
                      ? "inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_18px_-10px_rgba(20,23,28,.7)] transition-colors hover:bg-brand-600"
                      : "inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-ink ring-1 ring-black/10 transition-colors hover:bg-ink hover:text-white"
                  }
                >
                  {l.label} <ExternalLink className="h-4 w-4" />
                </a>
              ))}
            </div>
          ) : null}
        </div>

        {p.coverUrl ? (
          <figure className="mt-2.5 sm:mt-4">
            <SafeImage
              src={p.coverUrl}
              alt={p.coverAlt}
              eager
              className="w-full rounded-[2rem] object-cover"
            />
            {p.coverCaption ? (
              <figcaption className="px-4 pb-2 pt-3 text-sm text-charcoal-500">
                {p.coverCaption}
              </figcaption>
            ) : null}
          </figure>
        ) : null}
      </header>

      {/* ------------------------------------------------------- overview */}
      {p.description.trim() ? (
        <Card title="Overview" accent="brand">
          <Markdown>{p.description}</Markdown>
        </Card>
      ) : null}

      {/* ------------------------------------------------ business problem */}
      {p.businessProblem.trim() || p.keyQuestions.length > 0 ? (
        <Card title="Business Problem" accent="coral">
          {p.businessProblem.trim() ? (
            <Markdown>{p.businessProblem}</Markdown>
          ) : null}
          {p.keyQuestions.length > 0 ? (
            <div className="mt-8">
              <h3 className="font-display text-lg font-bold text-ink">
                Key Questions
              </h3>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {p.keyQuestions.map((q, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 rounded-[1.25rem] bg-[#fdeceb] p-4 ring-1 ring-black/5"
                  >
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-coral-500 text-xs font-extrabold text-white shadow-[inset_0_-2px_0_rgba(0,0,0,.2)]">
                      ?
                    </span>
                    <span className="text-[15px] leading-snug text-charcoal-800">{q}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Card>
      ) : null}

      {/* --------------------------------------------------- what I did */}
      {p.steps.length > 0 ? (
        <Card title="What I Did" accent="brand">
          <ProjectProcessFlow steps={p.steps} />
        </Card>
      ) : null}

      {p.approachSummary.trim() ? (
        <Card title="Approach" accent="mint">
          <Markdown>{p.approachSummary}</Markdown>
        </Card>
      ) : null}

      {p.solutionSummary.trim() ? (
        <Card title="Solution / Implementation" accent="sun">
          <Markdown>{p.solutionSummary}</Markdown>
        </Card>
      ) : null}

      {/* ---------------------------------------------------------- visuals */}
      {p.media.length > 0 ? (
        <Card title="Visuals" accent="brand">
          <div className="grid gap-5 sm:grid-cols-2">
            {p.media.map((m, i) => (
              <figure
                key={`${m.url}-${i}`}
                className={m.layout === "full" ? "sm:col-span-2" : ""}
              >
                <SafeImage
                  src={m.url}
                  alt={m.alt}
                  className="w-full rounded-[1.5rem] object-cover ring-1 ring-black/10"
                />
                {m.caption ? (
                  <figcaption className="mt-2 px-1 text-sm text-charcoal-500">
                    {m.caption}
                  </figcaption>
                ) : null}
              </figure>
            ))}
          </div>
        </Card>
      ) : null}

      {/* --------------------------------------------------------- insights */}
      {p.insights.length > 0 ? (
        <Card title="Key Insights" accent="sun">
          <div className="grid gap-4 md:grid-cols-2">
            {p.insights.map((insight, i) => {
              const tone = SOFT_TONES[i % SOFT_TONES.length];
              return (
                <div
                  key={i}
                  className={`rounded-[1.5rem] p-6 ring-1 ring-black/5 ${tone.bg}`}
                >
                  <p className={`font-display text-xs font-extrabold uppercase tracking-wider ${tone.text}`}>
                    Insight {String(i + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-2 font-display text-lg font-bold leading-snug text-ink">
                    {insight.title}
                  </h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-charcoal-700">
                    {insight.description}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      ) : null}

      {/* ----------------------------------------------------------- impact */}
      {p.impactSummary.trim() ? (
        <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 px-5 py-8 shadow-[0_30px_60px_-36px_rgba(31,66,173,.7)] sm:px-10 sm:py-12">
          <div aria-hidden="true" className="bg-dot-matrix absolute inset-0 opacity-70" />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl"
          />
          <div className="relative">
            <span aria-hidden="true" className="mb-4 block h-1.5 w-10 rounded-full bg-sun-400" />
            <h2 className="font-display text-[1.6rem] font-extrabold tracking-tight text-white sm:text-[2rem]">
              Business Impact
            </h2>
            <div className="mt-5">
              <Markdown tone="dark">{p.impactSummary}</Markdown>
            </div>
          </div>
        </section>
      ) : null}

      {hasTech ? (
        <Card title="Technical Details" accent="mint">
          <div className="grid gap-4 sm:grid-cols-2">
            <TechGroup title="Data Processing" items={tech.processing} />
            <TechGroup title="Automation" items={tech.automation} />
            <TechGroup title="Analytics" items={tech.analytics} />
            <TechGroup title="Visualization" items={tech.visualization} />
          </div>
        </Card>
      ) : null}

      {/* ---------------------------------------------------------- related */}
      {p.related.length > 0 ? (
        <Card title="Related Projects" accent="coral">
          <div className="grid gap-5 sm:grid-cols-2">
            {p.related.map((r, i) => (
              <Link
                key={r.slug}
                href={`/projects/${r.slug}`}
                className="group block rounded-[1.9rem] bg-white p-2.5 ring-1 ring-black/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_40px_-24px_rgba(30,60,140,.45)]"
              >
                <div
                  className={`relative aspect-[16/9] w-full overflow-hidden rounded-[1.4rem] bg-gradient-to-br ${COVER_TONES[i % COVER_TONES.length]}`}
                >
                  <div className="bg-dot-matrix absolute inset-0 opacity-60" />
                  <p className="absolute inset-x-5 bottom-4 line-clamp-2 font-display text-xl font-extrabold leading-tight text-white [text-shadow:0_2px_0_rgba(0,0,0,.15)]">
                    {r.title}
                  </p>
                </div>
                <div className="flex items-end justify-between gap-3 px-3.5 pb-3 pt-4">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold uppercase tracking-wider text-brand-600">
                      {r.category}
                    </p>
                    <h3 className="mt-1 font-display text-base font-bold leading-snug text-ink">
                      {r.title}
                    </h3>
                  </div>
                  <ArrowUpRight className="h-5 w-5 shrink-0 text-ink transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-600" />
                </div>
              </Link>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
