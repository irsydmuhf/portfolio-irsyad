import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import type { CaseStudyProject } from "@/lib/projects/case-study";
import Markdown from "./Markdown";
import ProjectProcessFlow from "./ProjectProcessFlow";
import SafeImage from "./SafeImage";

/**
 * The single case-study renderer (PRD §40). Used by /projects/[slug] and by
 * the admin draft preview so both always look identical. Empty optional
 * sections are omitted entirely.
 */

function Card({
  title,
  children,
  tone = "light",
}: {
  title: string;
  children: ReactNode;
  tone?: "light" | "dark";
}) {
  return (
    <section className="py-8 sm:py-10">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div
          className={
            tone === "dark"
              ? "rounded-lg border-l-4 border-orange-500 bg-navy-900 p-6 sm:p-8"
              : "rounded-lg border border-navy-200 bg-white p-6 sm:p-8"
          }
        >
          <h2
            className={`text-2xl font-bold ${
              tone === "dark" ? "text-white" : "text-navy-900"
            }`}
          >
            {title}
          </h2>
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </section>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  if (!value.trim()) return null;
  return (
    <div className="rounded-lg bg-navy-800 p-4">
      <span className="text-xs font-medium text-navy-400">{label}</span>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function TechGroup({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-lg bg-navy-50 p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-navy-600">
        {title}
      </h3>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="text-navy-700">
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
    <>
      {/* ----------------------------------------------------------- hero */}
      <section className="bg-navy-900 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-sm font-medium text-navy-300 transition-colors hover:text-orange-400"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Portfolio
          </Link>

          <div className="mt-8 max-w-3xl">
            {p.category ? (
              <p className="text-sm font-semibold uppercase tracking-wider text-orange-400">
                {p.category}
              </p>
            ) : null}
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              {p.title}
            </h1>
            {p.summary ? (
              <p className="mt-4 text-xl text-navy-200">{p.summary}</p>
            ) : null}
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <Tile label="Role" value={p.role} />
            <Tile label="Domain" value={p.domain} />
            <Tile label="Data Context" value={p.dataContext} />
            <Tile label="Period" value={p.projectPeriod} />
            <Tile label="Focus" value={p.focus} />
            <Tile label="Type" value={p.projectType} />
            <Tile label="Tools" value={p.tools.join(", ")} />
          </div>

          {primaryLink ? (
            <div className="mt-6 flex flex-wrap gap-3">
              {p.links.map((l, i) => (
                <a
                  key={`${l.url}-${i}`}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={
                    i === 0
                      ? "inline-flex items-center gap-2 rounded-lg bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
                      : "inline-flex items-center gap-2 rounded-lg border border-navy-600 px-6 py-3 text-sm font-semibold text-navy-100 transition-colors hover:bg-navy-800"
                  }
                >
                  {l.label} <ExternalLink className="h-4 w-4" />
                </a>
              ))}
            </div>
          ) : null}

          {p.coverUrl ? (
            <figure className="mt-10">
              <SafeImage
                src={p.coverUrl}
                alt={p.coverAlt}
                eager
                className="w-full rounded-lg object-cover"
              />
              {p.coverCaption ? (
                <figcaption className="mt-2 text-sm text-navy-300">
                  {p.coverCaption}
                </figcaption>
              ) : null}
            </figure>
          ) : null}
        </div>
      </section>

      {/* ------------------------------------------------------- overview */}
      {p.description.trim() ? (
        <Card title="Overview">
          <Markdown>{p.description}</Markdown>
        </Card>
      ) : null}

      {/* ------------------------------------------------ business problem */}
      {p.businessProblem.trim() || p.keyQuestions.length > 0 ? (
        <Card title="Business Problem">
          {p.businessProblem.trim() ? (
            <Markdown>{p.businessProblem}</Markdown>
          ) : null}
          {p.keyQuestions.length > 0 ? (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-navy-900">
                Key Questions
              </h3>
              <ul className="mt-4 space-y-3">
                {p.keyQuestions.map((q, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-orange-500" />
                    <span className="text-navy-700">{q}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Card>
      ) : null}

      {/* --------------------------------------------------- what I did */}
      {p.steps.length > 0 ? (
        <Card title="What I Did">
          <ProjectProcessFlow steps={p.steps} />
        </Card>
      ) : null}

      {p.approachSummary.trim() ? (
        <Card title="Approach">
          <Markdown>{p.approachSummary}</Markdown>
        </Card>
      ) : null}

      {p.solutionSummary.trim() ? (
        <Card title="Solution / Implementation">
          <Markdown>{p.solutionSummary}</Markdown>
        </Card>
      ) : null}

      {/* ---------------------------------------------------------- visuals */}
      {p.media.length > 0 ? (
        <Card title="Visuals">
          <div className="grid gap-6 sm:grid-cols-2">
            {p.media.map((m, i) => (
              <figure
                key={`${m.url}-${i}`}
                className={m.layout === "full" ? "sm:col-span-2" : ""}
              >
                <SafeImage
                  src={m.url}
                  alt={m.alt}
                  className="w-full rounded-lg border border-navy-200 object-cover"
                />
                {m.caption ? (
                  <figcaption className="mt-2 text-sm text-navy-500">
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
        <Card title="Key Insights">
          <div className="space-y-6">
            {p.insights.map((insight, i) => (
              <div
                key={i}
                className="rounded-lg border-l-4 border-orange-500 bg-navy-50 p-6"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-orange-600">
                  Insight {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-navy-900">
                  {insight.title}
                </h3>
                <p className="mt-2 text-navy-600">{insight.description}</p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {p.impactSummary.trim() ? (
        <Card title="Business Impact" tone="dark">
          <Markdown tone="dark">{p.impactSummary}</Markdown>
        </Card>
      ) : null}

      {hasTech ? (
        <Card title="Technical Details">
          <div className="grid gap-6 sm:grid-cols-2">
            <TechGroup title="Data Processing" items={tech.processing} />
            <TechGroup title="Automation" items={tech.automation} />
            <TechGroup title="Analytics" items={tech.analytics} />
            <TechGroup title="Visualization" items={tech.visualization} />
          </div>
        </Card>
      ) : null}

      {/* ---------------------------------------------------------- related */}
      {p.related.length > 0 ? (
        <Card title="Related Projects">
          <div className="grid gap-6 sm:grid-cols-2">
            {p.related.map((r) => (
              <Link
                key={r.slug}
                href={`/projects/${r.slug}`}
                className="group block overflow-hidden rounded-lg border border-navy-200 transition-all hover:border-orange-300 hover:shadow-md"
              >
                <div className="aspect-[16/9] w-full bg-gradient-to-br from-navy-800 to-navy-900">
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white/90">
                        {r.title.split(" ").slice(0, 2).join(" ")}
                      </div>
                      <div className="mt-1 text-xs text-orange-400">
                        {r.category}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-orange-500">
                    {r.category}
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-navy-900 group-hover:text-orange-600">
                    {r.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      ) : null}
    </>
  );
}
