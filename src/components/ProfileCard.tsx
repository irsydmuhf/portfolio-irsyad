"use client";

import Image from "next/image";
import { Mail, MapPin, Link as LinkIcon, GitBranch } from "lucide-react";

export default function ProfileCard() {
  return (
    <div className="bg-navy-900 text-white">
      {/* Profile Image */}
      <div className="flex justify-center pt-8">
        <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-accent-500 bg-navy-800">
          <Image
            src="/profile/profile.jpg"
            alt="Irsyad Muhamad Firdaus"
            width={128}
            height={128}
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      {/* Name & Role */}
      <div className="px-6 pt-4 text-center">
        <h1 className="text-xl font-bold">Irsyad Muhamad Firdaus</h1>
        <p className="mt-1 text-sm font-medium text-orange-400">
          Data Analyst | Python, SQL, Analytics
        </p>
      </div>

      {/* Bio */}
      <div className="px-6 pt-4">
        <p className="text-sm leading-relaxed text-navy-200">
          I&apos;m a data analyst with experience in turning complex datasets
          into actionable business insights. Skilled in Python, SQL, and data
          visualization, I transform raw data into clear stories that drive
          smarter decisions. Currently focused on e-commerce, marketplace, and
          customer analytics to help businesses optimize performance and
          profitability.
        </p>
      </div>

      {/* Contact */}
      <div className="px-6 pt-6">
        <div className="border-t border-navy-700 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-navy-400">
            // Contact
          </p>
          <div className="mt-3 space-y-2">
            <a
              href="mailto:irsyad.muhf@gmail.com"
              className="flex items-center gap-2 text-sm text-navy-200 transition-colors hover:text-accent-400"
            >
              <Mail className="h-4 w-4" />
              <span>irsyad.muhf@gmail.com</span>
            </a>
            <a
              href="https://linkedin.com/in/irsyadmuhf"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-navy-200 transition-colors hover:text-accent-400"
            >
              <LinkIcon className="h-4 w-4" />
              <span>linkedin.com/in/irsyadmuhf</span>
            </a>
            <a
              href="https://github.com/irsydmuhf"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-navy-200 transition-colors hover:text-accent-400"
            >
              <GitBranch className="h-4 w-4" />
              <span>github.com/irsydmuhf</span>
            </a>
            <div className="flex items-center gap-2 text-sm text-navy-200">
              <MapPin className="h-4 w-4" />
              <span>Indonesia</span>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div className="h-6" />
    </div>
  );
}
