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
    <div className="flex flex-wrap gap-3">
      <div className="relative">
        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            onCategoryChange(e.target.value);
          }}
          className="appearance-none rounded-lg border border-navy-200 bg-white px-4 py-2 pr-8 text-sm text-navy-700 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
        >
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
      </div>

      <div className="relative">
        <select
          value={selectedSort}
          onChange={(e) => {
            setSelectedSort(e.target.value);
            onSortChange(e.target.value);
          }}
          className="appearance-none rounded-lg border border-navy-200 bg-white px-4 py-2 pr-8 text-sm text-navy-700 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
      </div>
    </div>
  );
}
