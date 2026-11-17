import type { TechItemData } from "@/lib/content/schema";
import { techIcon } from "@/lib/content/tech-icons";

/** Relative luminance (0–1) of a #rrggbb color, for picking a legible glyph. */
function luminance(hex: string): number {
  const n = parseInt(hex.replace("#", ""), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function tileColors(item: TechItemData): { bg: string; fg: string } {
  const icon = techIcon(item.iconSlug);
  const bg = item.color || (icon ? `#${icon.hex}` : "#3a6cf4");
  return { bg, fg: luminance(bg) > 0.45 ? "#15171c" : "#ffffff" };
}

/**
 * Keycap-style logo tile built from two layers (a darker "base" and a lighter
 * "face" sitting above it) instead of inset shadows, which left a hairline
 * seam across the tile. Fills its grid cell and centers itself, so spacing
 * stays even regardless of label length. The label is sr-only unless
 * `showLabel` is set.
 */
export default function TechIcon({
  item,
  size = 52,
  showLabel = false,
}: {
  item: TechItemData;
  size?: number;
  showLabel?: boolean;
}) {
  const { bg, fg } = tileColors(item);
  const icon = techIcon(item.iconSlug);
  const letters = item.letters || item.name.replace(/[^A-Za-z0-9]/g, "").slice(0, 2);
  const radius = Math.round(size * 0.26);
  const depth = Math.max(4, Math.round(size * 0.09));
  const face = item.imagePath ? "#ffffff" : bg;

  return (
    <figure className="group m-0 flex w-full flex-col items-center gap-2">
      <div
        title={item.name}
        className="relative shrink-0 transition-transform duration-200 group-hover:-translate-y-1"
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          // darker base peeks out below the face as the key's "depth"
          backgroundColor: `color-mix(in srgb, ${face} 68%, black)`,
          boxShadow: `0 12px 16px -12px ${bg}`,
        }}
      >
        <div
          className="absolute inset-x-0 top-0 grid place-items-center"
          style={{
            bottom: depth,
            borderRadius: radius,
            backgroundColor: face,
            backgroundImage: "linear-gradient(180deg, rgba(255,255,255,.28), rgba(255,255,255,0) 55%)",
          }}
        >
          {item.imagePath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.imagePath}
              alt=""
              className="h-[68%] w-[68%] object-contain"
              loading="lazy"
            />
          ) : icon ? (
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              style={{ width: size * 0.5, height: size * 0.5 }}
            >
              <path d={icon.path} fill={fg} />
            </svg>
          ) : (
            <span
              aria-hidden="true"
              className="font-display font-extrabold leading-none tracking-tight"
              style={{
                color: fg,
                fontSize: size * (letters.length > 2 ? 0.3 : 0.4),
              }}
            >
              {letters}
            </span>
          )}
        </div>
      </div>
      <figcaption
        className={
          showLabel
            ? "w-full max-w-[5.25rem] text-balance text-center text-[11px] leading-tight text-charcoal-500"
            : "sr-only"
        }
      >
        {item.name}
      </figcaption>
    </figure>
  );
}
