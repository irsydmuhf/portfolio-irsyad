import data from "./projects.json";

export interface Project {
  slug: string;
  title: string;
  category: string;
  summary: string;
  tools: string[];
  cover: string;
  github: string | null;
  role: string;
  domain: string;
  focus: string;
  projectType: string;
  data: string;
  businessProblem: string;
  businessQuestions: string[];
  approach: string[];
  solution: string[];
  insights: { title: string; description: string }[];
  impact: string;
  technicalDetails: {
    dataProcessing: string[];
    automation: string[];
    analytics: string[];
    visualization: string[];
  };
}

export const projects: Project[] = data;
