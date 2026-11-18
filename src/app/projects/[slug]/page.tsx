import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CaseStudyView from "@/components/case-study/CaseStudyView";
import SiteFooter from "@/components/home/SiteFooter";
import { getSiteSettings } from "@/lib/content/queries";
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

  // Same footer as the homepage; if settings can't load, keep a plain footer
  // rather than failing a page that otherwise rendered fine.
  const settings = await getSiteSettings().catch(() => null);

  return (
    <div className="bg-dots min-h-screen">
      <main>
        <CaseStudyView project={project} />
      </main>

      {settings ? (
        <SiteFooter settings={settings} />
      ) : (
        <footer className="mx-auto max-w-6xl px-3 pb-10 sm:px-6">
          <p className="text-center text-sm text-charcoal-600">
            © {new Date().getFullYear()} {OWNER}
          </p>
        </footer>
      )}
    </div>
  );
}
