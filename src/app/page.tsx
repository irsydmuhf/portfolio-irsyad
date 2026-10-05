"use client";

import { useState } from "react";
import ProfileCard from "@/components/ProfileCard";
import TabNavigation from "@/components/TabNavigation";
import ProjectGrid from "@/components/ProjectGrid";
import Experience from "@/components/Experience";
import Skills from "@/components/Skills";

type Tab = "portfolio" | "experience" | "education";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("portfolio");

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center">
            <span className="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
              ● Available for Work
            </span>
            <p className="mt-2 text-sm text-navy-500">Based in Indonesia</p>
            <h1 className="mt-4 text-center text-3xl font-bold text-navy-900 sm:text-4xl">
              Welcome to My{" "}
              <span className="text-orange-500">Data Analytics Portfolio</span>
            </h1>
            <p className="mt-2 text-center text-navy-600">
              Turning complex datasets into confident business decisions.
            </p>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="mx-auto max-w-7xl">
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <ProfileCard />
          </aside>

          {/* Content Area */}
          <div className="min-h-0">
            {activeTab === "portfolio" && (
              <div className="rounded-lg border border-navy-200 bg-white p-6">
                <ProjectGrid />
              </div>
            )}

            {activeTab === "experience" && (
              <div className="rounded-lg border border-navy-200 bg-white p-6">
                <Experience />
              </div>
            )}

            {activeTab === "education" && (
              <div className="rounded-lg border border-navy-200 bg-white p-6">
                <Skills />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-8 border-t border-navy-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-navy-500">
              © {new Date().getFullYear()} Irsyad Muhamad Firdaus
            </p>
            <div className="flex gap-6">
              <a
                href="https://linkedin.com/in/irsyadmuhf"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-charcoal-500 hover:text-accent-500"
              >
                LinkedIn
              </a>
              <a
                href="https://github.com/irsydmuhf"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-charcoal-500 hover:text-accent-500"
              >
                GitHub
              </a>
              <a
                href="mailto:irsyad.muhf@gmail.com"
                className="text-sm text-charcoal-500 hover:text-accent-500"
              >
                Email
              </a>
              <a
                href="/resume.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-charcoal-500 hover:text-accent-500"
              >
                Resume
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
