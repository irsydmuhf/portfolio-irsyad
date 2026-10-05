"use server";

import { promises as fs } from "fs";
import path from "path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Project } from "@/data/projects";

const DATA_FILE = path.join(process.cwd(), "src", "data", "projects.json");

export type FormState = { error: string } | null;

function ensureDev(): void {
  if (process.env.NODE_ENV !== "development") {
    throw new Error("Admin panel is only available in development mode.");
  }
}

async function readProjects(): Promise<Project[]> {
  const raw = await fs.readFile(DATA_FILE, "utf8");
  return JSON.parse(raw) as Project[];
}

async function writeProjects(projects: Project[]): Promise<void> {
  await fs.writeFile(DATA_FILE, JSON.stringify(projects, null, 2) + "\n", "utf8");
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function str(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function lines(formData: FormData, key: string): string[] {
  return str(formData, key)
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function csvLines(formData: FormData, key: string): string[] {
  return str(formData, key)
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseInsights(formData: FormData): { title: string; description: string }[] {
  return lines(formData, "insights").map((line) => {
    const [title, ...rest] = line.split("|");
    return { title: title.trim(), description: rest.join("|").trim() };
  });
}

function parseProject(formData: FormData, slug: string): Project {
  return {
    slug,
    title: str(formData, "title"),
    category: str(formData, "category"),
    summary: str(formData, "summary"),
    tools: csvLines(formData, "tools"),
    cover: str(formData, "cover"),
    github: str(formData, "github") || null,
    role: str(formData, "role"),
    domain: str(formData, "domain"),
    focus: str(formData, "focus"),
    projectType: str(formData, "projectType"),
    data: str(formData, "data"),
    businessProblem: str(formData, "businessProblem"),
    businessQuestions: lines(formData, "businessQuestions"),
    approach: lines(formData, "approach"),
    solution: lines(formData, "solution"),
    insights: parseInsights(formData),
    impact: str(formData, "impact"),
    technicalDetails: {
      dataProcessing: csvLines(formData, "td_dataProcessing"),
      automation: csvLines(formData, "td_automation"),
      analytics: csvLines(formData, "td_analytics"),
      visualization: csvLines(formData, "td_visualization"),
    },
  };
}

export async function createProject(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  ensureDev();

  const title = str(formData, "title");
  if (!title) {
    return { error: "Title is required." };
  }

  const current = await readProjects();
  const slug = str(formData, "slug") || slugify(title);

  if (current.some((p) => p.slug === slug)) {
    return { error: `Slug "${slug}" already exists.` };
  }

  const project = parseProject(formData, slug);
  await writeProjects([...current, project]);

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin");
}

export async function updateProject(
  slug: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  ensureDev();

  const title = str(formData, "title");
  if (!title) {
    return { error: "Title is required." };
  }

  const current = await readProjects();
  const index = current.findIndex((p) => p.slug === slug);
  if (index === -1) {
    return { error: `Project "${slug}" not found.` };
  }

  current[index] = parseProject(formData, slug);
  await writeProjects(current);

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin");
}

export async function deleteProject(
  slug: string,
  _formData: FormData
): Promise<void> {
  ensureDev();

  const current = await readProjects();
  await writeProjects(current.filter((p) => p.slug !== slug));

  revalidatePath("/");
  revalidatePath("/admin");
}
