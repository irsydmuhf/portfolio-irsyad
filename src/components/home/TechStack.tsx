import type { TechItemData } from "@/lib/content/schema";
import TechIcon from "./TechIcon";

// Tech stack ticker: logos run right → left across the full width of the
// profile card (the parent makes this block full-bleed). Each copy of the list
// is repeated until it is wider than the card, and the track holds two
// identical copies so translateX(-50%) loops seamlessly. Hover pauses it;
// reduced-motion users get a static, wrapping list instead.

const ITEM_W = 88; // px: 52px tile + label up to 84px wide
const GAP = 12; // px between items
const MIN_TILES_PER_COPY = 14; // 14 × 100px ≥ the widest card (max-w-6xl = 1152px)
const SECONDS_PER_TILE = 2.6; // ≈ 38 px/s
const TWO_ROWS_FROM = 16; // only long lists are split into two rows

function MarqueeRow({ items, row }: { items: TechItemData[]; row: number }) {
  const reps = Math.max(1, Math.ceil(MIN_TILES_PER_COPY / items.length));
  const copy = Array.from({ length: reps }, () => items).flat();
  return (
    <div className="group overflow-hidden py-1">
      {/* every item carries its own right margin so both halves are exactly
          equal and translateX(-50%) lands on an identical frame */}
      <ul
        className="animate-marquee flex w-max group-hover:[animation-play-state:paused]"
        style={{
          animationDuration: `${copy.length * SECONDS_PER_TILE}s`,
          // stagger a second row by half a tile so the columns don't line up
          animationDelay: `${-row * (SECONDS_PER_TILE / 2)}s`,
        }}
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

  const half = Math.ceil(items.length / 2);
  const rows = items.length >= TWO_ROWS_FROM ? [items.slice(0, half), items.slice(half)] : [items];

  return (
    <div>
      {/* reduced motion: static list inside the card padding */}
      <ul
        className="hidden flex-wrap justify-center gap-y-5 px-6 motion-reduce:flex sm:px-10 lg:px-14"
        style={{ columnGap: GAP }}
      >
        {items.map((t) => (
          <li key={t.id ?? t.name} className="shrink-0" style={{ width: ITEM_W }}>
            <TechIcon item={t} showLabel />
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-3 motion-reduce:hidden [mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)]">
        {rows.map((row, r) => (
          <MarqueeRow key={r} items={row} row={r} />
        ))}
      </div>
    </div>
  );
}
