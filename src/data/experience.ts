export interface Experience {
  period: string;
  role: string;
  company: string;
  division: string;
  type: string;
  highlights: string[];
}

export const experience: Experience[] = [
  {
    period: "Oct 2025 — Present",
    role: "Data Analyst",
    company: "PT. Relasi Digital Marketing",
    division: "Data & IT",
    type: "Full-time",
    highlights: [
      "Marketplace analytics",
      "Customer analytics",
      "Reporting automation",
      "Data pipeline",
      "Operational analytics",
    ],
  },
  {
    period: "Aug 2025 — Oct 2025",
    role: "Data Analyst Intern",
    company: "PT. Relasi Digital Marketing",
    division: "Data & IT",
    type: "Internship",
    highlights: [
      "Data analysis",
      "Report generation",
      "Dashboard development",
    ],
  },
];
