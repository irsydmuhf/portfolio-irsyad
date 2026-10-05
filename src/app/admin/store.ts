import { promises as fs } from "fs";
import path from "path";
import type { Project } from "@/data/projects";

const DATA_FILE = path.join(process.cwd(), "src", "data", "projects.json");

export async function readProjects(): Promise<Project[]> {
  const raw = await fs.readFile(DATA_FILE, "utf8");
  return JSON.parse(raw) as Project[];
}

export function isAdminEnabled(): boolean {
  return process.env.NODE_ENV === "development";
}
