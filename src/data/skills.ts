export interface SkillCategory {
  name: string;
  skills: string[];
}

export const skillCategories: SkillCategory[] = [
  {
    name: "Analytics",
    skills: [
      "SQL",
      "Customer Analytics",
      "Cohort Analysis",
      "Business Metrics",
      "EDA",
    ],
  },
  {
    name: "Data & Automation",
    skills: [
      "Python",
      "Pandas",
      "Google Apps Script",
      "API Integration",
      "ETL",
    ],
  },
  {
    name: "BI & Reporting",
    skills: ["Power BI", "Looker Studio", "Google Sheets"],
  },
  {
    name: "Data Systems",
    skills: [
      "Data Cleaning",
      "Data Validation",
      "Data Modeling",
      "Workflow Automation",
    ],
  },
];
