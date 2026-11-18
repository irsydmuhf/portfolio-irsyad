import ReactMarkdown from "react-markdown";

/**
 * Narrative fields render as Markdown. No rehype-raw: raw HTML in the source
 * is never passed through (PRD §43), and react-markdown's default URL
 * transform drops javascript:/data: links.
 */
export default function Markdown({
  children,
  tone = "light",
}: {
  children: string;
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  const text = dark ? "text-white/90" : "text-charcoal-700";
  const heading = dark ? "text-white" : "text-ink";
  const link = dark
    ? "text-sun-300 hover:text-white"
    : "text-brand-600 hover:text-brand-800";
  const code = dark ? "bg-white/15 text-white" : "bg-brand-50 text-brand-800";
  return (
    <div className={`space-y-4 text-base leading-relaxed sm:text-[1.075rem] ${text}`}>
      <ReactMarkdown
        components={{
          p: ({ children }) => <p>{children}</p>,
          ul: ({ children }) => (
            <ul className="list-disc space-y-2 pl-6 marker:text-brand-400">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal space-y-2 pl-6 marker:font-bold marker:text-brand-500">{children}</ol>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className={`font-semibold underline underline-offset-2 ${link}`}
            >
              {children}
            </a>
          ),
          code: ({ children }) => (
            <code className={`rounded-md px-1.5 py-0.5 text-[0.9em] ${code}`}>
              {children}
            </code>
          ),
          h1: ({ children }) => (
            <h3 className={`font-display text-xl font-bold ${heading}`}>{children}</h3>
          ),
          h2: ({ children }) => (
            <h3 className={`font-display text-xl font-bold ${heading}`}>{children}</h3>
          ),
          h3: ({ children }) => (
            <h4 className={`font-display text-lg font-bold ${heading}`}>{children}</h4>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
