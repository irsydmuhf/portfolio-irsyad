// scripts/import-legacy-projects.mjs
// Hides every existing project (status -> draft, nothing deleted) and imports
// the projects from the previous portofolio (github.com/irsydmuhf/portofolio).
//
// Usage:
//   node scripts/import-legacy-projects.mjs --dry-run   # print plan only
//   node scripts/import-legacy-projects.mjs             # apply
//
// Re-runnable: legacy slugs are upserted; other projects stay drafts.
// Credentials from .env.local (SUPABASE_SERVICE_ROLE_KEY or owner email/password).

import { readFileSync, existsSync } from "node:fs";
import dns from "node:dns";
import { createClient } from "@supabase/supabase-js";

dns.setDefaultResultOrder("ipv4first");

function loadLocalEnv() {
  const p = new URL("../.env.local", import.meta.url);
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
}
loadLocalEnv();

const DRY = process.argv.includes("--dry-run");
const URL_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

const legacy = [
  {
    slug: "redigma-performance-dashboard",
    title: "Redigma Performance Dashboard",
    category: "Business Analytics",
    description:
      "Interactive Looker Studio dashboard designed to monitor business performance, sales trends, and key metrics in real time for data-driven decision making.",
    problem:
      "Stakeholders lacked a centralized and easy-to-read dashboard to track sales performance, revenue trends, and key operational metrics across time periods.",
    approach:
      "Integrated cleaned transactional data into Looker Studio and designed an interactive dashboard with filters, time-series analysis, and KPI cards to highlight performance trends and anomalies.",
    outcome:
      "Delivered a single source of truth dashboard that improved visibility into business performance and enabled faster, insight-driven strategic discussions.",
    tools: ["Looker Studio", "Google Sheets", "SQL", "Data Cleaning", "Data Visualization"],
    links: [
      { type: "dashboard", label: "View Dashboard", url: "https://lookerstudio.google.com/reporting/a9c54f7a-a0d9-42c9-9007-adf06b915c9d" },
    ],
  },
  {
    slug: "ride-the-trend-bike-rentals",
    title: "Ride the Trend: Exploring Bike Rentals",
    category: "Data Analysis",
    description:
      "End-to-end data analysis project exploring bike rental demand patterns based on time, weather, and seasonal factors to support data-driven decision making.",
    problem:
      "Bike rental usage fluctuates significantly across seasons and time periods, making it difficult for operators to optimize bike availability and operational planning.",
    approach:
      "Performed exploratory data analysis and feature engineering using Python to analyze temporal and environmental variables. Built regression models to understand demand drivers and visualize insights through interactive dashboards.",
    outcome:
      "Identified key demand drivers such as temperature, working days, and peak hours, and delivered actionable insights that can help improve fleet distribution and service efficiency.",
    tools: ["Python", "Pandas", "NumPy", "Matplotlib", "Seaborn", "Scikit-learn", "Streamlit"],
    links: [
      { type: "github", label: "View Source Code", url: "https://github.com/irsydmuhf/data_analyst_idcamp" },
      { type: "demo", label: "Live Dashboard", url: "https://data-analyst-irsyad.streamlit.app/" },
    ],
  },
  {
    slug: "employee-bonus-annual-review-tool",
    title: "Employee Bonus & Annual Review Tool",
    category: "Spreadsheet Automation",
    projectType: "Freelance",
    description:
      "A 7-tab Google Sheets/Excel system for freelance client work (Upwork) combining employee annual reviews with a two-part, performance-based raise calculator.",
    problem:
      "The client calculated annual raises and bonuses manually across cost-of-living adjustments, project performance, and values-based eligibility — a slow, error-prone process with no single source of truth per employee.",
    approach:
      "Built a Cost of Living Increase engine with a dedicated dollar pool per role, a quarterly Project Performance Bonus that rolls up annually, and a Core Values scorecard that gates bonus eligibility without touching base pay. A printable per-employee Annual Review pulls it all together via INDEX/MATCH and SUMIFS, with every formula verified against a full recalculation.",
    outcome:
      "Delivered an audit-ready bonus and review system that automated pay decisions across roles and metrics, replacing manual spreadsheet work with a consistent, error-checked calculator.",
    tools: ["Google Sheets", "Excel", "Excel Formulas", "Dashboard Design", "Financial Modeling"],
    links: [
      { type: "other", label: "View Spreadsheet", url: "https://docs.google.com/spreadsheets/d/1P93U1oZXXa1fH957GW4-ZedMmleLTsg6exlxq_7Q16k/edit?gid=601964232#gid=601964232" },
    ],
  },
  {
    slug: "kimia-farma-bigquery-looker-dashboard",
    title: "BigQuery + Looker Studio Dashboard for Kimia Farma",
    category: "Business Analytics",
    projectType: "Internship",
    description:
      "Project-based internship (Kimia Farma × Rakamin Academy) turning 600K+ retail transactions into an interactive performance dashboard.",
    problem:
      "Kimia Farma needed visibility into retail performance across branches, products, and inventory from raw transaction data, with no consolidated reporting spanning 2020–2023.",
    approach:
      "Imported and joined 600K+ retail transaction records in Google BigQuery across branches, products, and inventory, then built an interactive Looker Studio dashboard covering revenue by quarter, top-performing branches/provinces, and customer rating vs. branch rating analysis.",
    outcome:
      "Delivered a dashboard revealing Jawa Barat as the top-performing province (Rp94.9bn in nett sales) and surfacing branch rating gaps, supporting data-driven retail strategy.",
    tools: ["BigQuery", "Looker Studio", "SQL", "Data Visualization", "Data Analysis"],
    links: [
      { type: "dashboard", label: "View Dashboard", url: "https://datastudio.google.com/reporting/3144dcc9-9e60-4d0d-bb0a-8ab8d76c6485" },
    ],
  },
  {
    slug: "sql-sales-analysis-ecommerce",
    title: "SQL Sales Analysis & Business Insights for E-commerce",
    category: "Business Analytics",
    projectType: "Self-initiated",
    description:
      "Deeper SQL analysis on Kanaya Living's cleaned order data to answer business questions spreadsheets alone couldn't solve.",
    problem:
      "Spreadsheet formulas alone couldn't answer harder business questions: channel profitability, top products, monthly growth, repeat-purchase rate, and unpaid orders.",
    approach:
      "Wrote SQL queries (SQLite) to analyze channel-level revenue and order volume, repeat customer behavior, and payment status, documenting every finding in plain business language rather than raw numbers.",
    outcome:
      "Found a 61% repeat customer rate worth building a referral program on, identified Shopee as the top channel by AOV, flagged 40 unpaid orders needing follow-up, and spotted a data quality gap for further cleanup.",
    tools: ["SQL", "SQLite", "Data Analysis", "Business Intelligence", "Data Visualization"],
    links: [
      { type: "documentation", label: "Read Case Study", url: "https://docs.google.com/document/d/19Y6OGi07WUMiZSj5ep-fqUif-YrMo9_KbPVci5X0Mq8/edit?usp=sharing" },
      { type: "other", label: "View Files", url: "https://drive.google.com/file/d/1Rbh96KbH7c55pG9lEm47uq1mXjBAH9cE/view?usp=sharing" },
    ],
  },
  {
    slug: "cleaning-multi-channel-order-data",
    title: "Cleaning 3 Months of Messy Multi-Channel Order Data",
    category: "Data Cleaning",
    projectType: "Self-initiated",
    description:
      "Self-initiated project simulating a common small e-commerce scenario: standardizing 320+ orders from Instagram, Shopee, Tokopedia, and WhatsApp with no consistent format.",
    problem:
      "Raw order data had inconsistent date formats, duplicate entries, inconsistent product/channel naming, mixed text/number prices, missing phone/city data, and negative-quantity errors — unusable for reporting.",
    approach:
      "Cleaned and standardized the dataset in Excel/Google Sheets, added Month and Revenue columns, and documented every fix in a Process Notes sheet for full transparency.",
    outcome:
      "Delivered 320 clean, deduplicated rows ready for reporting — the foundation for the SQL sales analysis that followed.",
    tools: ["Microsoft Excel", "Google Sheets", "Data Cleaning", "Data Entry", "Data Analysis"],
    links: [
      { type: "other", label: "View Spreadsheet", url: "https://docs.google.com/spreadsheets/d/10qDfK2A9dEFi4B1JlT8T0x1OlHUhQtdKaOdrsmAFWsU/edit?usp=drive_link" },
    ],
  },
  {
    slug: "redigma-internal-web-app",
    title: "Redigma Internal Web App",
    category: "Web Application",
    projectType: "Professional",
    description:
      "Company-wide internal web app at Redigma used by every division, covering attendance, leave management and each division's daily operational activities.",
    problem:
      "Attendance, leave requests and divisional operational activities needed to be handled in one place that every division could use, instead of being managed separately.",
    approach:
      "Built a web application that centralizes attendance (presensi), leave (cuti) and the operational activities of each division in a single system used company-wide.",
    outcome:
      "Adopted by all divisions as the shared system for attendance, leave and day-to-day operational activity tracking.",
    tools: ["Web Application", "Internal Tools"],
    links: [],
  },
];

// Extra detail per slug (all derived from the legacy descriptions; no new facts).
const detail = {
  "redigma-performance-dashboard": {
    domain: "Business Performance / Sales",
    focus: "Sales & KPI Monitoring",
    data: "Cleaned transactional sales data",
    questions: [
      "How are sales and revenue trending over time?",
      "Which key operational metrics need attention?",
      "Where do performance anomalies appear across time periods?",
    ],
    steps: [
      ["Data Preparation", "Cleaned transactional data in Google Sheets and SQL so it was ready for reporting."],
      ["Data Integration", "Connected the cleaned data to Looker Studio as the dashboard source."],
      ["Dashboard Design", "Built KPI cards, interactive filters and time-series views."],
      ["Trend & Anomaly Review", "Used the time-series views to highlight performance trends and anomalies."],
    ],
    solution:
      "- Interactive Looker Studio dashboard\n- KPI cards for key business metrics\n- Filters and time-series analysis\n- Single source of truth for performance reporting",
    insights: [
      ["One shared view of performance", "A centralized dashboard replaced scattered reporting, so stakeholders read sales and revenue from the same numbers."],
      ["Faster strategic discussions", "Filters and time-series views made trends and anomalies easy to spot, supporting quicker, insight-driven decisions."],
    ],
    tech: { processing: ["SQL", "Google Sheets", "Data Cleaning"], visualization: ["Looker Studio"], analytics: ["Time-series Analysis", "KPI Tracking"], automation: [] },
  },
  "ride-the-trend-bike-rentals": {
    domain: "Transportation / Bike Sharing",
    focus: "Demand Analysis",
    data: "Bike rental data (time, weather, seasonal variables)",
    questions: [
      "How does bike rental demand change across seasons and time periods?",
      "Which factors (temperature, working days, peak hours) drive demand?",
      "How can the findings improve fleet distribution?",
    ],
    steps: [
      ["Exploratory Data Analysis", "Explored temporal and environmental variables with Pandas, NumPy, Matplotlib and Seaborn."],
      ["Feature Engineering", "Prepared features from time, weather and seasonal factors."],
      ["Regression Modeling", "Built regression models with Scikit-learn to understand demand drivers."],
      ["Interactive Dashboard", "Published the insights as a Streamlit dashboard."],
    ],
    solution: "- End-to-end analysis in Python\n- Regression models for demand drivers\n- Interactive Streamlit dashboard",
    insights: [
      ["Temperature, working days and peak hours drive demand", "These variables were identified as the key drivers of bike rental usage."],
      ["Actionable for operations", "The insights can help improve fleet distribution and service efficiency."],
    ],
    tech: { processing: ["Python", "Pandas", "NumPy"], visualization: ["Matplotlib", "Seaborn", "Streamlit"], analytics: ["Exploratory Data Analysis", "Regression Modeling", "Scikit-learn"], automation: [] },
  },
  "employee-bonus-annual-review-tool": {
    domain: "HR / Compensation",
    focus: "Spreadsheet Automation",
    data: "Employee roles, project performance and core values scores",
    questions: [
      "How can cost-of-living raises be allocated fairly per role?",
      "How can project performance be rolled up into annual bonuses?",
      "How can values-based eligibility gate bonuses without affecting base pay?",
    ],
    steps: [
      ["Cost of Living Increase Engine", "Built a raise calculator with a dedicated dollar pool per role."],
      ["Project Performance Bonus", "Added a quarterly bonus that rolls up annually."],
      ["Core Values Scorecard", "Gated bonus eligibility on values scores without touching base pay."],
      ["Annual Review Sheet", "Built a printable per-employee review using INDEX/MATCH and SUMIFS."],
      ["Verification", "Checked every formula against a full recalculation."],
    ],
    solution: "- 7-tab Google Sheets/Excel system\n- Two-part, performance-based raise calculator\n- Printable per-employee Annual Review",
    insights: [
      ["Single source of truth per employee", "Raises, bonuses and review data are consolidated in one place instead of manual calculations."],
      ["Audit-ready", "Every formula was verified against a full recalculation, so pay decisions are consistent and error-checked."],
    ],
    tech: { processing: ["INDEX/MATCH", "SUMIFS"], visualization: ["Dashboard Design"], analytics: ["Financial Modeling"], automation: ["Excel Formulas"] },
  },
  "kimia-farma-bigquery-looker-dashboard": {
    domain: "Retail / Pharmacy",
    focus: "Retail Performance Dashboard",
    data: "600K+ retail transactions (2020–2023): branches, products, inventory",
    period: "2020–2023 data",
    questions: [
      "Which provinces and branches perform best?",
      "How does revenue develop by quarter?",
      "How do customer ratings compare to branch ratings?",
    ],
    steps: [
      ["Import & Join", "Imported and joined 600K+ transaction records in BigQuery across branches, products and inventory."],
      ["Metric Definition", "Defined nett sales, revenue by quarter and rating metrics."],
      ["Dashboard Build", "Built an interactive Looker Studio dashboard."],
      ["Performance Review", "Compared top branches/provinces and customer vs. branch ratings."],
    ],
    solution: "- BigQuery dataset joining branches, products and inventory\n- Interactive Looker Studio dashboard\n- Revenue by quarter, top branches/provinces, rating analysis",
    insights: [
      ["Jawa Barat is the top province", "Jawa Barat led with Rp94.9bn in nett sales."],
      ["Branch rating gaps", "The dashboard surfaced gaps between customer ratings and branch ratings."],
    ],
    impact: "Delivered a dashboard supporting data-driven retail strategy (project-based internship, Kimia Farma × Rakamin Academy).",
    tech: { processing: ["BigQuery", "SQL"], visualization: ["Looker Studio"], analytics: ["Sales Analysis", "Rating Analysis"], automation: [] },
  },
  "sql-sales-analysis-ecommerce": {
    domain: "E-commerce",
    focus: "SQL Business Analysis",
    data: "Kanaya Living cleaned order data",
    questions: [
      "Which channels are most profitable?",
      "What are the top products and monthly growth?",
      "What is the repeat-purchase rate?",
      "Which orders are still unpaid?",
    ],
    steps: [
      ["Frame Business Questions", "Listed questions spreadsheet formulas could not answer."],
      ["SQL Analysis", "Wrote SQLite queries for channel revenue, order volume, repeat customers and payment status."],
      ["Plain-language Findings", "Documented every finding in business language rather than raw numbers."],
    ],
    solution: "- SQL query set in SQLite\n- Written case study with business-language findings",
    insights: [
      ["61% repeat customer rate", "Strong enough to build a referral program on."],
      ["Shopee is the top channel by AOV", "Identified from channel-level revenue and order analysis."],
      ["40 unpaid orders", "Flagged for follow-up; a data quality gap was also spotted for further cleanup."],
    ],
    tech: { processing: ["SQL", "SQLite"], visualization: [], analytics: ["Channel Analysis", "Repeat Purchase Analysis"], automation: [] },
  },
  "redigma-internal-web-app": {
    domain: "Internal Operations / HR",
    focus: "Attendance, Leave & Divisional Operations",
    data: "Attendance, leave and operational activity records for all divisions",
    questions: [
      "How can every division record attendance in one system?",
      "How can leave requests be managed centrally?",
      "How can each division's operational activities be tracked in the same app?",
    ],
    steps: [
      ["Attendance (Presensi)", "Built attendance recording for all employees."],
      ["Leave Management (Cuti)", "Added leave requests and tracking."],
      ["Divisional Operations", "Added modules for each division's operational activities."],
    ],
    solution: "- Single web app used by all divisions\n- Attendance (presensi)\n- Leave management (cuti)\n- Operational activity tracking per division",
    insights: [
      ["Company-wide adoption", "Every division uses the same app for attendance, leave and operational activities."],
      ["One shared system", "Attendance, leave and operations live in a single place instead of separate processes."],
    ],
    tech: { processing: [], visualization: [], analytics: [], automation: ["Workflow Automation"] },
  },
  "cleaning-multi-channel-order-data": {
    domain: "E-commerce",
    focus: "Data Cleaning",
    data: "320+ orders from Instagram, Shopee, Tokopedia and WhatsApp (3 months)",
    questions: ["How can inconsistent order records be standardized for reporting?"],
    steps: [
      ["Audit Raw Data", "Found inconsistent dates, duplicates, naming, mixed price types, missing phone/city and negative quantities."],
      ["Clean & Standardize", "Fixed each issue in Excel/Google Sheets and added Month and Revenue columns."],
      ["Document", "Recorded every fix in a Process Notes sheet for transparency."],
    ],
    solution: "- 320 clean, deduplicated rows\n- Process Notes sheet documenting every fix",
    insights: [
      ["Messy multi-channel data is common", "A realistic small-business scenario with no consistent format across channels."],
      ["Foundation for later analysis", "The clean dataset fed the SQL sales analysis that followed."],
    ],
    tech: { processing: ["Excel", "Google Sheets", "Data Cleaning"], visualization: [], analytics: [], automation: [] },
  },
};

const PUBLISHED_AT = new Date().toISOString();
const rows = legacy.map((p, i) => ({
  slug: p.slug,
  title: p.title,
  category: p.category,
  summary: p.description,
  description: p.description,
  business_problem: p.problem,
  approach_summary: p.approach,
  impact_summary: detail[p.slug].impact ?? p.outcome,
  project_type: p.projectType ?? "Portofolio",
  role: "Data Analyst",
  domain: detail[p.slug].domain,
  focus: detail[p.slug].focus,
  data_context: detail[p.slug].data,
  project_period: detail[p.slug].period ?? null,
  key_questions: detail[p.slug].questions,
  solution_summary: detail[p.slug].solution,
  technical_processing: detail[p.slug].tech.processing,
  technical_visualization: detail[p.slug].tech.visualization,
  technical_analytics: detail[p.slug].tech.analytics,
  technical_automation: detail[p.slug].tech.automation,
  tools: p.tools,
  status: "published",
  featured: true,
  display_order: i,
  published_at: PUBLISHED_AT,
}));

if (DRY) {
  console.log("dry-run: would set ALL existing projects to draft, then upsert:");
  rows.forEach((r) => console.log(`  ${r.display_order}  ${r.slug}`));
  process.exit(0);
}

if (!URL_BASE || !SERVICE) {
  console.error("Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
const db = createClient(URL_BASE, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });
void ANON;

const must = (res, label) => {
  if (res.error) {
    console.error(`FAIL ${label}: ${res.error.message}`);
    process.exit(1);
  }
  return res.data;
};

// 1. Hide everything currently published (reversible).
const hidden = must(
  await db.from("projects").update({ status: "draft", featured: false }).eq("status", "published").select("slug"),
  "hide existing"
);
console.log(`hidden (draft): ${hidden.map((h) => h.slug).join(", ") || "none"}`);

// 2. Upsert legacy projects.
for (const [i, r] of rows.entries()) {
  const existing = must(await db.from("projects").select("id, published_at").eq("slug", r.slug).maybeSingle(), r.slug);
  let id;
  if (existing) {
    const { published_at, ...upd } = r;
    void published_at;
    must(await db.from("projects").update({ ...upd, published_at: existing.published_at ?? PUBLISHED_AT }).eq("id", existing.id), r.slug);
    for (const t of ["project_links", "project_steps", "project_insights"]) {
      must(await db.from(t).delete().eq("project_id", existing.id), `${r.slug} ${t} reset`);
    }
    id = existing.id;
    console.log(`~ ${r.slug}`);
  } else {
    id = must(await db.from("projects").insert(r).select("id").single(), r.slug).id;
    console.log(`+ ${r.slug}`);
  }
  const links = legacy[i].links.map((l, k) => ({
    project_id: id,
    link_type: l.type,
    label: l.label,
    url: l.url,
    link_order: k + 1,
  }));
  must(await db.from("project_links").insert(links), `${r.slug} links`);
  must(
    await db.from("project_steps").insert(
      detail[r.slug].steps.map(([title, description], k) => ({ project_id: id, title, description, step_order: k + 1 }))
    ),
    `${r.slug} steps`
  );
  must(
    await db.from("project_insights").insert(
      detail[r.slug].insights.map(([title, description], k) => ({ project_id: id, title, description, insight_order: k + 1 }))
    ),
    `${r.slug} insights`
  );
}
console.log("done");
