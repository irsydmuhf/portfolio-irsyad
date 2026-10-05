import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ExternalLink, Calendar, Tag, User } from "lucide-react";
import { projects } from "@/data/projects";
import type { Project } from "@/data/projects";

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

function ProjectHero({ project }: { project: Project }) {
  return (
    <section className="bg-navy-900 py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-navy-300 transition-colors hover:text-orange-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Portfolio
        </Link>

        <div className="mt-8 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-orange-400">
            {project.category}
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            {project.title}
          </h1>
          <p className="mt-4 text-xl text-navy-200">{project.summary}</p>
        </div>

        {/* Metadata Grid */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-lg bg-navy-800 p-4">
            <div className="flex items-center gap-2 text-navy-400">
              <User className="h-4 w-4" />
              <span className="text-xs font-medium">Role</span>
            </div>
            <p className="mt-1 text-sm font-semibold text-white">
              {project.role}
            </p>
          </div>
          <div className="rounded-lg bg-navy-800 p-4">
            <div className="flex items-center gap-2 text-navy-400">
              <Tag className="h-4 w-4" />
              <span className="text-xs font-medium">Domain</span>
            </div>
            <p className="mt-1 text-sm font-semibold text-white">
              {project.domain}
            </p>
          </div>
          <div className="rounded-lg bg-navy-800 p-4">
            <div className="flex items-center gap-2 text-navy-400">
              <Calendar className="h-4 w-4" />
              <span className="text-xs font-medium">Focus</span>
            </div>
            <p className="mt-1 text-sm font-semibold text-white">
              {project.focus}
            </p>
          </div>
          <div className="rounded-lg bg-navy-800 p-4">
            <div className="flex items-center gap-2 text-navy-400">
              <span className="text-xs font-medium">Tools</span>
            </div>
            <p className="mt-1 text-sm font-semibold text-white">
              {project.tools.join(", ")}
            </p>
          </div>
          <div className="rounded-lg bg-navy-800 p-4">
            <div className="flex items-center gap-2 text-navy-400">
              <span className="text-xs font-medium">Type</span>
            </div>
            <p className="mt-1 text-sm font-semibold text-white">
              {project.projectType}
            </p>
          </div>
          <div className="rounded-lg bg-navy-800 p-4">
            <div className="flex items-center gap-2 text-navy-400">
              <span className="text-xs font-medium">Data</span>
            </div>
            <p className="mt-1 text-sm font-semibold text-white">
              {project.data}
            </p>
          </div>
        </div>

        {project.github && (
          <div className="mt-6">
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
            >
              View Source Code <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

function BusinessProblem({ project }: { project: Project }) {
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-navy-200 bg-white p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-navy-900">
            Business Problem
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-navy-600">
            {project.businessProblem}
          </p>

          <div className="mt-6">
            <h3 className="text-lg font-semibold text-navy-900">
              Key Questions
            </h3>
            <ul className="mt-4 space-y-3">
              {project.businessQuestions.map((question, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-orange-500"></span>
                  <span className="text-navy-700">{question}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function Approach({ project }: { project: Project }) {
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-navy-200 bg-white p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-navy-900">Approach</h2>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {project.approach.map((step, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="rounded-lg bg-navy-100 px-4 py-2">
                  <p className="text-sm font-medium text-navy-700">{step}</p>
                </div>
                {index < project.approach.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-orange-500" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Solution({ project }: { project: Project }) {
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-navy-200 bg-white p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-navy-900">
            Solution / Implementation
          </h2>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {project.solution.map((step, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="rounded-lg bg-orange-100 px-4 py-2">
                  <p className="text-sm font-medium text-orange-700">{step}</p>
                </div>
                {index < project.solution.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-navy-400" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Insights({ project }: { project: Project }) {
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-navy-200 bg-white p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-navy-900">Key Insights</h2>

          <div className="mt-6 space-y-6">
            {project.insights.map((insight, index) => (
              <div
                key={index}
                className="rounded-lg border-l-4 border-orange-500 bg-navy-50 p-6"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-orange-600">
                  Insight {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-navy-900">
                  {insight.title}
                </h3>
                <p className="mt-2 text-navy-600">{insight.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function BusinessImpact({ project }: { project: Project }) {
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-lg border-l-4 border-orange-500 bg-navy-900 p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-white">Business Impact</h2>
          <p className="mt-4 text-lg leading-relaxed text-navy-200">
            {project.impact}
          </p>
        </div>
      </div>
    </section>
  );
}

function TechnicalDetails({ project }: { project: Project }) {
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-navy-200 bg-white p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-navy-900">
            Technical Details
          </h2>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div className="rounded-lg bg-navy-50 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-navy-600">
                Data Processing
              </h3>
              <ul className="mt-3 space-y-2">
                {project.technicalDetails.dataProcessing.map((item) => (
                  <li key={item} className="text-navy-700">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg bg-navy-50 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-navy-600">
                Automation
              </h3>
              <ul className="mt-3 space-y-2">
                {project.technicalDetails.automation.map((item) => (
                  <li key={item} className="text-navy-700">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg bg-navy-50 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-navy-600">
                Analytics
              </h3>
              <ul className="mt-3 space-y-2">
                {project.technicalDetails.analytics.map((item) => (
                  <li key={item} className="text-navy-700">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg bg-navy-50 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-navy-600">
                Visualization
              </h3>
              <ul className="mt-3 space-y-2">
                {project.technicalDetails.visualization.map((item) => (
                  <li key={item} className="text-navy-700">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function RelatedProjects({ currentProject }: { currentProject: Project }) {
  const related = projects
    .filter((p) => p.slug !== currentProject.slug)
    .slice(0, 2);

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-navy-200 bg-white p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-navy-900">
            Related Projects
          </h2>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {related.map((project) => (
              <Link
                key={project.slug}
                href={`/projects/${project.slug}`}
                className="group block overflow-hidden rounded-lg border border-navy-200 transition-all hover:border-orange-300 hover:shadow-md"
              >
                <div className="aspect-[16/9] w-full bg-gradient-to-br from-navy-800 to-navy-900">
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white/90">
                        {project.title.split(" ").slice(0, 2).join(" ")}
                      </div>
                      <div className="mt-1 text-xs text-orange-400">
                        {project.category}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-orange-500">
                    {project.category}
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-navy-900 group-hover:text-orange-600">
                    {project.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);

  if (!project) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <ProjectHero project={project} />
      <BusinessProblem project={project} />
      <Approach project={project} />
      <Solution project={project} />
      <Insights project={project} />
      <BusinessImpact project={project} />
      <TechnicalDetails project={project} />
      <RelatedProjects currentProject={project} />

      <footer className="border-t border-charcoal-200 bg-white py-6">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-charcoal-500">
            © {new Date().getFullYear()} Irsyad Muhamad Firdaus
          </p>
        </div>
      </footer>
    </main>
  );
}
