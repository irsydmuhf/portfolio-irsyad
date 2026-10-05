import Link from "next/link";
import { ExternalLink, Calendar, Tag } from "lucide-react";
import type { Project } from "@/data/projects";

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-navy-200 bg-white transition-all hover:border-orange-300 hover:shadow-lg">
      {/* Project Thumbnail */}
      <div className="relative aspect-[16/9] w-full bg-gradient-to-br from-navy-800 to-navy-900">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl font-bold text-white/90">
              {project.title.split(" ").slice(0, 2).join(" ")}
            </div>
            <div className="mt-2 text-sm text-orange-400">
              {project.category}
            </div>
          </div>
        </div>
        <div className="absolute left-4 top-4 rounded bg-orange-500 px-2 py-1 text-xs font-semibold text-white">
          {project.projectType}
        </div>
      </div>

      {/* Project Info */}
      <div className="p-6">
        <div className="flex items-center gap-4 text-xs text-navy-500">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {project.focus}
          </span>
          <span className="flex items-center gap-1">
            <Tag className="h-3 w-3" />
            {project.domain}
          </span>
        </div>

        <h3 className="mt-3 text-lg font-bold text-navy-900 hover:text-orange-600">
          <Link href={`/projects/${project.slug}`}>{project.title}</Link>
        </h3>

        <p className="mt-2 text-sm leading-relaxed text-navy-600 line-clamp-3">
          {project.summary}
        </p>

        {/* Tools */}
        <div className="mt-4 flex flex-wrap gap-2">
          {project.tools.map((tool) => (
            <span
              key={tool}
              className="rounded-full bg-navy-100 px-3 py-1 text-xs font-medium text-navy-700"
            >
              {tool}
            </span>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-navy-100 pt-4">
          <Link
            href={`/projects/${project.slug}`}
            className="text-sm font-semibold text-orange-600 hover:text-orange-700"
          >
            Read More →
          </Link>
          {project.github && (
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-navy-500 hover:text-navy-700"
            >
              <ExternalLink className="h-4 w-4" />
              GitHub
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
