import type { TechItemData } from "@/lib/content/schema";
import TechIcon from "./TechIcon";

// Tech stack layout: at most two static rows when they fit; otherwise an
// auto-scrolling marquee ("running text"). The switch is pure CSS: the block
// is a size container and the width needed for ≤ 2 rows is computed from the
// item count, so the server emits the right @container threshold — no JS, no
// layout shift. Reduced-motion users always get the static (wrapping) list.

const ITEM_W = 88; // px: 52px tile + label up to 84px wide
const GAP = 12; // px between items
const STRIDE = ITEM_W + GAP;
const MIN_TILES_PER_COPY = 8; // keeps each marquee copy wider than the viewport
const SECONDS_PER_TILE = 2.6; // ≈ 38 px/s

function Item({ item, hidden }: { item: TechItemData; hidden?: boolean }) {
  return (
    <li aria-hidden={hidden || undefined} className="shrink-0" style={{ width: ITEM_W }}>
      <TechIcon item={item} showLabel />
    </li>
  );
}

function MarqueeRow({ items, reverse }: { items: TechItemData[]; reverse: boolean }) {
  const reps = Math.max(1, Math.ceil(MIN_TILES_PER_COPY / items.length));
  const copy = Array.from({ length: reps }, () => items).flat();
  return (
    <div className="group overflow-hidden py-1">
      {/* Two identical halves; every item carries its own right margin so the
          halves are exactly equal and translateX(-50%) loops seamlessly. */}
      <ul
        className={`flex w-max ${reverse ? "animate-marquee-reverse" : "animate-marquee"} group-hover:[animation-play-state:paused]`}
        style={{ animationDuration: `${copy.length * SECONDS_PER_TILE}s` }}
      >
        {[0, 1].map((half) =>
          copy.map((t, i) => (
            <li
              key={`${half}-${i}`}
              // only the first occurrence of each tool is exposed to screen readers
              aria-hidden={half > 0 || i >= items.length || undefined}
              className="shrink-0"
              style={{ width: ITEM_W, marginRight: GAP }}
            >
              <TechIcon item={t} showLabel />
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export default function TechStack({ items }: { items: TechItemData[] }) {
  if (items.length === 0) return null;

  const perRow = Math.ceil(items.length / 2);
  const fitWidth = perRow * STRIDE - GAP; // container width at which ≤ 2 rows fit
  const rows = items.length >= 8 ? [items.slice(0, perRow), items.slice(perRow)] : [items];

  const css = `
.tech-stack .ts-static{display:none}
@container (min-width:${fitWidth}px){.tech-stack .ts-static{display:flex}.tech-stack .ts-marquee{display:none}}
@media (prefers-reduced-motion:reduce){.tech-stack .ts-static{display:flex}.tech-stack .ts-marquee{display:none}}`;

  return (
    <div className="tech-stack mt-6 [container-type:inline-size]">
      <style>{css}</style>

      <ul className="ts-static flex-wrap gap-y-5" style={{ columnGap: GAP }}>
        {items.map((t) => (
          <Item key={t.id ?? t.name} item={t} />
        ))}
      </ul>

      <div className="ts-marquee flex flex-col gap-3 [mask-image:linear-gradient(to_right,transparent,#000_7%,#000_93%,transparent)]">
        {rows.map((row, r) => (
          <MarqueeRow key={r} items={row} reverse={r % 2 === 1} />
        ))}
      </div>
    </div>
  );
}
