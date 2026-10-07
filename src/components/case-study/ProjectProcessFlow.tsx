import { ArrowDown, ArrowRight } from "lucide-react";

interface Step {
  title: string;
  description: string;
}

// Static class names so Tailwind can see them. Up to 4 columns per row on
// desktop; more steps wrap onto further rows.
const COLS: Record<number, string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
};

/**
 * Process diagram, pure HTML/CSS. An ordered list, so DOM order (what screen
 * readers announce) equals visual order. Mobile: vertical stack with down
 * arrows. Desktop: grid rows with right arrows between cards; no dangling
 * arrow at the end of a row or after the last step.
 */
export default function ProjectProcessFlow({ steps }: { steps: Step[] }) {
  const cols = Math.min(Math.max(steps.length, 1), 4);

  return (
    <ol
      className={`grid grid-cols-1 gap-x-8 gap-y-6 ${COLS[cols]}`}
      aria-label="Project process"
    >
      {steps.map((step, i) => {
        const last = i === steps.length - 1;
        const endOfRow = (i + 1) % cols === 0;
        return (
          <li key={i} className="relative">
            <div className="h-full rounded-lg border border-navy-200 bg-navy-50 p-4">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                {i + 1}
              </span>
              <h3 className="mt-3 text-base font-semibold text-navy-900">
                {step.title}
              </h3>
              {step.description ? (
                <p className="mt-1 text-sm text-navy-600">{step.description}</p>
              ) : null}
            </div>

            {!last ? (
              <>
                <span
                  aria-hidden="true"
                  className="mt-2 flex justify-center text-orange-500 md:hidden"
                >
                  <ArrowDown className="h-5 w-5" />
                </span>
                {!endOfRow ? (
                  <span
                    aria-hidden="true"
                    className="absolute -right-6 top-1/2 hidden -translate-y-1/2 text-orange-500 md:block"
                  >
                    <ArrowRight className="h-5 w-5" />
                  </span>
                ) : null}
              </>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
