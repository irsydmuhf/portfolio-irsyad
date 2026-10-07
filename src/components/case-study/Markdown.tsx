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
  const text = tone === "dark" ? "text-navy-200" : "text-navy-600";
  return (
    <div className={`space-y-4 text-lg leading-relaxed ${text}`}>
      <ReactMarkdown
        components={{
          p: ({ children }) => <p>{children}</p>,
          ul: ({ children }) => (
            <ul className="list-disc space-y-2 pl-6">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal space-y-2 pl-6">{children}</ol>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="font-medium text-orange-600 underline underline-offset-2 hover:text-orange-700"
            >
              {children}
            </a>
          ),
          code: ({ children }) => (
            <code className="rounded bg-navy-100 px-1.5 py-0.5 text-[0.9em] text-navy-800">
              {children}
            </code>
          ),
          h1: ({ children }) => (
            <h3 className="text-xl font-semibold text-navy-900">{children}</h3>
          ),
          h2: ({ children }) => (
            <h3 className="text-xl font-semibold text-navy-900">{children}</h3>
          ),
          h3: ({ children }) => (
            <h4 className="text-lg font-semibold text-navy-900">{children}</h4>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
