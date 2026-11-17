"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface ProjectFiltersProps {
  onCategoryChange: (category: string) => void;
  onSortChange: (sort: string) => void;
}

export default function ProjectFilters({
  onCategoryChange,
  onSortChange,
}: ProjectFiltersProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSort, setSelectedSort] = useState("date");

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "Business Analytics", label: "Business Analytics" },
    { value: "Customer Analytics", label: "Customer Analytics" },
    { value: "Data Automation", label: "Data Automation" },
    { value: "Marketing Analytics", label: "Marketing Analytics" },
    { value: "Operations Analytics", label: "Operations Analytics" },
    { value: "Machine Learning", label: "Machine Learning" },
  ];

  const sortOptions = [
    { value: "date", label: "Date" },
    { value: "title", label: "Title A-Z" },
    { value: "category", label: "Category" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      <div className="relative">
        <select
          aria-label="Filter by category"
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            onCategoryChange(e.target.value);
          }}
          className="appearance-none rounded-full border border-charcoal-200 bg-white py-2 pl-4 pr-9 text-sm font-medium text-charcoal-800 hover:border-charcoal-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        >
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" />
      </div>

      <div className="relative">
        <select
          aria-label="Sort projects"
          value={selectedSort}
          onChange={(e) => {
            setSelectedSort(e.target.value);
            onSortChange(e.target.value);
          }}
          className="appearance-none rounded-full border border-charcoal-200 bg-white py-2 pl-4 pr-9 text-sm font-medium text-charcoal-800 hover:border-charcoal-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" />
      </div>
    </div>
  );
}
