"use client";

import { useState, useMemo } from "react";
import type { Project } from "@/data/projects";
import ProjectCard from "./ProjectCard";
import ProjectFilters from "./ProjectFilters";

const PROJECTS_PER_PAGE = 4;
// Small portfolios stay on a single page; pagination kicks in above this.
const PAGINATE_ABOVE = 8;

export default function ProjectGrid({ projects }: { projects: Project[] }) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSort, setSelectedSort] = useState("date");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredProjects = useMemo(() => {
    const filtered =
      selectedCategory === "all"
        ? [...projects]
        : projects.filter((p) => p.category === selectedCategory);

    if (selectedSort === "title") {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (selectedSort === "category") {
      filtered.sort((a, b) => a.category.localeCompare(b.category));
    }

    return filtered;
  }, [projects, selectedCategory, selectedSort]);

  const paginate = filteredProjects.length > PAGINATE_ABOVE;
  const totalPages = paginate
    ? Math.ceil(filteredProjects.length / PROJECTS_PER_PAGE)
    : 1;
  const startIndex = (currentPage - 1) * PROJECTS_PER_PAGE;
  const displayedProjects = paginate
    ? filteredProjects.slice(startIndex, startIndex + PROJECTS_PER_PAGE)
    : filteredProjects;

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2
            id="projects-title"
            className="font-display text-[1.75rem] font-extrabold tracking-tight text-ink sm:text-[2.1rem]"
          >
            Selected Projects
          </h2>
          <p className="mt-1 max-w-xl text-[15px] text-charcoal-600">
            Analytics, automation, and data systems developed from real-world
            business problems.
          </p>
        </div>
        <ProjectFilters
          onCategoryChange={handleCategoryChange}
          onSortChange={setSelectedSort}
        />
      </div>

      {displayedProjects.length === 0 ? (
        <p className="rounded-[1.5rem] border border-dashed border-charcoal-300 p-10 text-center text-sm text-charcoal-500">
          No projects in this category yet.
        </p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {displayedProjects.map((project, i) => (
            <ProjectCard key={project.slug} project={project} index={i} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="rounded-full border border-charcoal-200 px-4 py-2 text-sm font-medium text-charcoal-700 hover:bg-charcoal-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`h-9 w-9 rounded-full text-sm font-semibold transition-colors ${
                currentPage === page
                  ? "bg-ink text-white"
                  : "border border-charcoal-200 text-charcoal-700 hover:bg-charcoal-100"
              }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() =>
              setCurrentPage(Math.min(totalPages, currentPage + 1))
            }
            disabled={currentPage === totalPages}
            className="rounded-full border border-charcoal-200 px-4 py-2 text-sm font-medium text-charcoal-700 hover:bg-charcoal-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
