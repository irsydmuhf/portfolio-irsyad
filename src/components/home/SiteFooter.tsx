import type { SettingsData } from "@/lib/content/schema";
import BrandMark from "@/components/BrandMark";

export default function SiteFooter({ settings }: { settings: SettingsData }) {
  const links = [
    settings.linkedinUrl && { href: settings.linkedinUrl, label: "LinkedIn" },
    settings.githubUrl && { href: settings.githubUrl, label: "GitHub" },
    settings.instagramUrl && { href: settings.instagramUrl, label: "Instagram" },
    { href: `mailto:${settings.email}`, label: "Email" },
    settings.resumeUrl && { href: settings.resumeUrl, label: "Resume" },
  ].filter(Boolean) as { href: string; label: string }[];

  return (
    <footer className="mx-auto max-w-6xl px-3 pb-10 sm:px-6">
      <div className="relative overflow-hidden rounded-[2rem] bg-brand-500 px-6 py-10 text-white shadow-[0_30px_60px_-40px_rgba(30,60,140,.6)] sm:px-10 sm:py-12">
        {/* logo accent: dot cropped by the top edge, ribbon by the bottom */}
        <BrandMark className="pointer-events-none absolute -right-8 top-0 w-32 text-white sm:right-10 sm:w-40" />
        <div className="relative flex flex-col items-center justify-between gap-4 sm:flex-row sm:pr-44">
          <p className="text-sm text-white/80">
            © {new Date().getFullYear()} {settings.displayName}
          </p>
          <ul className="flex flex-wrap justify-center gap-1">
            {links.map((l) => (
              <li key={l.label}>
                <a
                  href={l.href}
                  {...(l.href.startsWith("http") || l.href.endsWith(".pdf")
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className="rounded-full px-3 py-1.5 text-sm font-medium text-white/90 transition-colors hover:bg-white hover:text-brand-700"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
