"use client";

import { useState, useMemo } from "react";
import type { Project } from "@/data/projects";
import ProjectCard from "./ProjectCard";
import ProjectFilters from "./ProjectFilters";

const PROJECTS_PER_PAGE = 4;

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

  const totalPages = Math.ceil(filteredProjects.length / PROJECTS_PER_PAGE);
  const startIndex = (currentPage - 1) * PROJECTS_PER_PAGE;
  const displayedProjects = filteredProjects.slice(
    startIndex,
    startIndex + PROJECTS_PER_PAGE
  );

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-navy-900">
            Selected Projects
          </h2>
          <p className="mt-1 text-sm text-navy-600">
            Analytics, automation, and data systems developed from real-world
            business problems.
          </p>
        </div>
      </div>

      <ProjectFilters
        onCategoryChange={handleCategoryChange}
        onSortChange={setSelectedSort}
      />

      <div className="mt-6 grid gap-6">
        {displayedProjects.map((project) => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="rounded-lg border border-navy-200 px-3 py-2 text-sm text-navy-600 hover:bg-navy-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                currentPage === page
                  ? "bg-navy-900 text-white"
                  : "border border-navy-200 text-navy-600 hover:bg-navy-50"
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
            className="rounded-lg border border-navy-200 px-3 py-2 text-sm text-navy-600 hover:bg-navy-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
