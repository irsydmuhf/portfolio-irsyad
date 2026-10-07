"use client";

type Tab = "portfolio" | "experience" | "education";

interface TabNavigationProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export default function TabNavigation({
  activeTab,
  onTabChange,
}: TabNavigationProps) {
  const tabs: { id: Tab; label: string }[] = [
    { id: "portfolio", label: "03. PORTFOLIO" },
    { id: "experience", label: "01. EXPERIENCE" },
    { id: "education", label: "02. EDUCATION & SKILLS" },
  ];

  return (
    <div className="border-b border-navy-200 bg-white">
      <div className="flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeTab === tab.id
                ? "bg-navy-900 text-white"
                : "bg-white text-navy-600 hover:bg-navy-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
