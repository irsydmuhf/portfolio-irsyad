import type { SettingsData } from "@/lib/content/schema";

export default function SiteFooter({ settings }: { settings: SettingsData }) {
  const links = [
    settings.linkedinUrl && { href: settings.linkedinUrl, label: "LinkedIn" },
    settings.githubUrl && { href: settings.githubUrl, label: "GitHub" },
    settings.instagramUrl && { href: settings.instagramUrl, label: "Instagram" },
    { href: `mailto:${settings.email}`, label: "Email" },
    settings.resumeUrl && { href: settings.resumeUrl, label: "Résumé" },
  ].filter(Boolean) as { href: string; label: string }[];

  return (
    <footer className="mx-auto max-w-6xl px-3 pb-10 sm:px-6">
      <div className="flex flex-col items-center justify-between gap-4 rounded-[2rem] bg-white/70 px-6 py-4 sm:rounded-full ring-1 ring-black/5 backdrop-blur sm:flex-row">
        <p className="text-sm text-charcoal-600">
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
                className="rounded-full px-3 py-1.5 text-sm font-medium text-charcoal-700 transition-colors hover:bg-ink hover:text-white"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
