// Accent version of the site logo (same geometry as src/app/icon.svg, no tile).
// The ribbon draws in currentColor at `ribbonOpacity`; the dot stays solid sun yellow.
// The dot pokes above the viewBox and the tail runs far below it: put the mark in an
// overflow-hidden container, flush with its top edge, so both get cropped by that container.
export default function BrandMark({
  className,
  ribbonOpacity = 0.18,
}: {
  className?: string;
  ribbonOpacity?: number;
}) {
  return (
    <svg viewBox="0 0 100 100" overflow="visible" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="brandmark-stem" gradientUnits="userSpaceOnUse" x1="34" y1="28" x2="41" y2="62">
          <stop offset="0" stopColor="currentColor" />
          <stop offset=".5" stopColor="currentColor" />
          <stop offset="1" stopColor="currentColor" stopOpacity=".28" />
        </linearGradient>
        <linearGradient id="brandmark-under" gradientUnits="userSpaceOnUse" x1="42" y1="62" x2="72" y2="82">
          <stop offset="0" stopColor="currentColor" stopOpacity=".28" />
          <stop offset="1" stopColor="currentColor" />
        </linearGradient>
      </defs>
      <g opacity={ribbonOpacity} fill="none" strokeWidth="13">
        <circle cx="34" cy="34" r="6.5" fill="currentColor" stroke="none" />
        <path d="M34 34 C35.5 46 38 56 42 63" stroke="url(#brandmark-stem)" />
        <path d="M42 63 C46 70 49 72 53 75 C65 84 84 80 84 64" stroke="url(#brandmark-under)" />
        <path
          d="M84 64 C84 48 68 42 54 44 C40 46 28 54 22 68 C19 76 19 90 20 104 L21 400"
          stroke="currentColor"
          strokeLinecap="round"
        />
      </g>
      <circle cx="32" cy="8" r="14.5" fill="#ffc935" />
    </svg>
  );
}
