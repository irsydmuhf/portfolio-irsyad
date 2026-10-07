// View-model for the case-study page. One shape feeds ONE renderer
// (CaseStudyView) used by both the public page and the admin draft preview.

export interface CaseStudyMedia {
  url: string;
  alt: string;
  caption: string;
  layout: "full" | "half" | "gallery";
}

export interface CaseStudyProject {
  slug: string;
  title: string;
  category: string;
  summary: string;
  description: string;
  businessProblem: string;
  keyQuestions: string[];
  role: string;
  domain: string;
  dataContext: string;
  projectPeriod: string;
  focus: string;
  projectType: string;
  tools: string[];
  approachSummary: string;
  solutionSummary: string;
  impactSummary: string;
  steps: { title: string; description: string }[];
  insights: { title: string; description: string }[];
  technical: {
    processing: string[];
    automation: string[];
    analytics: string[];
    visualization: string[];
  };
  links: { type: string; label: string; url: string }[];
  coverUrl: string | null;
  coverAlt: string;
  coverCaption: string;
  media: CaseStudyMedia[];
  related: { slug: string; title: string; category: string }[];
}

/** Public URL of an object in the (public-read) portfolio-media bucket. */
export function storageUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return `${base}/storage/v1/object/public/portfolio-media/${path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}
