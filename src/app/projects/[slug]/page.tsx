import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CaseStudyView from "@/components/case-study/CaseStudyView";
import {
  getPublishedCaseStudy,
  getPublishedProjects,
} from "@/lib/projects/queries";

// ISR: case studies read published rows from Supabase. Existing slugs are
// prerendered; new slugs render on demand; publish/unpublish/edit call
// revalidatePath so changes appear immediately.
export const revalidate = 300;

const OWNER = "Irsyad Muhamad Firdaus";

export async function generateStaticParams() {
  const list = await getPublishedProjects();
  return list.map((p) => ({ slug: p.slug }));
}

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublishedCaseStudy(slug);
  if (!project) return { title: "Project not found", robots: { index: false } };

  const title = `${project.title} | ${OWNER}`;
  const description = project.summary || undefined;
  const url = `/projects/${project.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      images: project.coverUrl ? [{ url: project.coverUrl }] : undefined,
    },
    twitter: {
      card: project.coverUrl ? "summary_large_image" : "summary",
      title,
      description,
    },
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = await getPublishedCaseStudy(slug);
  if (!project) notFound();

  return (
    <main className="min-h-screen bg-slate-50">
      <CaseStudyView project={project} />

      <footer className="border-t border-charcoal-200 bg-white py-6">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-charcoal-500">
            © {new Date().getFullYear()} {OWNER}
          </p>
        </div>
      </footer>
    </main>
  );
}
