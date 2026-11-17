import { ChartColumnIncreasing } from "lucide-react";
import { encode } from "uqr";

// Lanyard + ID card illustration on a fixed 440×580 px design canvas, so the
// SVG lanyard and the HTML card share one coordinate system. On narrow
// screens the whole canvas is scaled down as a unit.
//
// Anatomy (canvas px):
//   - the card hangs from its top-center A = (220, 140), tilted 6° about that
//     point (and swaying ±1.5° around it), so the strap joint never drifts;
//   - a single strap ("stem") leaves the card's slot and runs up into the
//     plastic adjuster; out of the adjuster's top the lanyard branches into
//     two halves: the left one loops down the left side, the right one down
//     the right side, and both ends tuck away behind the card — a closed loop
//     with no cut ends.

const STRAP_MAIN = "#3563e9";
const STRAP_EDGE = "#2148c4";
const STRAP_W = 24; // each branch
const STEM_W = 30; // the single strap between card and adjuster

/** Single strap from the card's slot up into the adjuster (hidden under it from y≈128). */
const STEM = "M 220 146 L 220 100";
/** Left branch: from behind the card → up the left side → over the top → into the adjuster. */
const STRAP_LEFT =
  "M 130 498 C 80 502, 34 492, 26 440 C 18 380, 30 300, 34 230 " +
  "C 38 150, 60 70, 110 44 C 160 24, 209 34, 209 80 L 209 104";
/** Right branch: out of the adjuster → up → over the top → down the right side → behind the card. */
const STRAP_RIGHT =
  "M 231 104 L 231 80 C 231 34, 280 22, 330 28 C 380 34, 408 80, 406 150 " +
  "C 404 230, 396 320, 404 400 C 410 460, 388 500, 340 504 C 300 507, 260 506, 220 504";

const STRAP_TEXT = Array.from({ length: 9 }, () => "PROFILE  •  ").join("");

/** Soft tilted hexagon for the photo (230×200 units, corners pre-rounded). */
const PHOTO_SHAPE =
  "M 47.2 46.6 L 152.8 13.4 Q 170 8 182.7 20.7 L 209.3 47.3 Q 222 60 218.8 77.7 " +
  "L 209.2 132.3 Q 206 150 189.1 156.1 L 94.9 189.9 Q 78 196 64.1 184.6 " +
  "L 23.9 151.4 Q 10 140 14 122.4 L 26 69.6 Q 30 52 47.2 46.6 Z";

const STARBURST =
  "polygon(50% 0%, 59% 22%, 79% 9%, 75% 32%, 98% 30%, 82% 48%, 100% 62%, 77% 67%, 85% 90%, 63% 80%, 50% 100%, 40% 79%, 17% 91%, 23% 68%, 0% 63%, 18% 48%, 3% 30%, 25% 32%, 20% 9%, 41% 22%)";

/** Encode `text` as a QR code and return its dark modules as one SVG path. */
function qrPath(text: string): { size: number; d: string } {
  // ECC "M" survives the slight blur of the tilted, anti-aliased card.
  const { size, data } = encode(text, { ecc: "M", border: 0 });
  let d = "";
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; ) {
      if (!data[y][x]) {
        x++;
        continue;
      }
      let run = 1;
      while (x + run < size && data[y][x + run]) run++;
      d += `M${x} ${y}h${run}v1h-${run}z`;
      x += run;
    }
  }
  return { size, d };
}

function QrCode({ url, label }: { url: string; label: string }) {
  const { size, d } = qrPath(url);
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title={`Scan or click to open ${label}`}
      aria-label={`Open ${label} profile`}
      className="block rounded-md bg-white p-1 shadow-[0_2px_6px_rgba(0,0,0,.2)] transition-transform duration-200 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
    >
      {/* 1-module margin inside the viewBox + the white padding = quiet zone */}
      <svg viewBox={`-1 -1 ${size + 2} ${size + 2}`} className="block h-[66px] w-[66px]" aria-hidden="true">
        <path d={d} fill="#15171c" />
      </svg>
    </a>
  );
}

function Strap({ id, d }: { id: string; d: string }) {
  return (
    <>
      {/* two real paths: a <use> can't override stroke attributes set on its source */}
      <path id={id} d={d} fill="none" stroke={STRAP_EDGE} strokeWidth={STRAP_W + 4} />
      <path d={d} fill="none" stroke={STRAP_MAIN} strokeWidth={STRAP_W} />
      <text
        className="font-display"
        fontSize={11}
        fontWeight={800}
        letterSpacing={2.2}
        fill="#ffffff"
        dominantBaseline="central"
      >
        <textPath href={`#${id}`}>{STRAP_TEXT}</textPath>
      </text>
    </>
  );
}

/** The stem's end in front of the card, from its top edge down into the slot. */
function StrapTail() {
  return (
    <div
      aria-hidden="true"
      className="absolute left-1/2 top-[-2px] h-[26px] -translate-x-1/2 border-x-2 shadow-[0_3px_3px_-1px_rgba(0,0,0,.3)]"
      style={{ width: STEM_W + 4, backgroundColor: STRAP_MAIN, borderColor: STRAP_EDGE }}
    />
  );
}

export default function IdBadge({
  name,
  avatar,
  idLabel,
  qr,
}: {
  name: string;
  avatar: string;
  idLabel: string;
  /** Profile the card's QR code opens; null hides the QR. */
  qr: { url: string; label: string } | null;
}) {
  return (
    <div className="relative mx-auto h-[435px] w-[330px] select-none sm:h-[580px] sm:w-[440px]">
      <div className="absolute left-0 top-0 h-[580px] w-[440px] origin-top-left scale-75 sm:scale-100">
        {/* starburst */}
        <div
          aria-hidden="true"
          className="animate-spin-slow absolute left-[40px] top-[96px] h-[176px] w-[176px] bg-sun-400"
          style={{ clipPath: STARBURST }}
        />

        {/* lanyard (behind the card) + adjuster holding both halves */}
        <svg
          aria-hidden="true"
          viewBox="0 0 440 580"
          width={440}
          height={580}
          className="absolute inset-0 overflow-visible drop-shadow-[0_6px_6px_rgba(20,40,120,.18)]"
        >
          <defs>
            <linearGradient id="idb-slider" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#b3c8ff" />
              <stop offset="1" stopColor="#7d9cf6" />
            </linearGradient>
          </defs>
          <path d={STEM} fill="none" stroke={STRAP_EDGE} strokeWidth={STEM_W + 4} />
          <path d={STEM} fill="none" stroke={STRAP_MAIN} strokeWidth={STEM_W} />
          <Strap id="idb-strap-l" d={STRAP_LEFT} />
          <Strap id="idb-strap-r" d={STRAP_RIGHT} />

          {/* adjuster: single strap below, the two branches leave from its top */}
          <rect x={190} y={84} width={60} height={44} rx={10} fill="url(#idb-slider)" stroke="#6b8cee" strokeWidth={1.5} />
          <rect x={195} y={88} width={50} height={6} rx={3} fill="#ffffff" opacity={0.4} />
          <circle cx={220} cy={116} r={3.5} fill="#ffffff" />
        </svg>

        {/* card: hangs from its top-center, tilted 6°, sways around the same point */}
        <div className="absolute left-[93px] top-[140px] h-[404px] w-[254px]">
          <div className="animate-sway h-full w-full origin-top">
            <div className="relative h-full w-full origin-top rotate-[6deg] rounded-2xl bg-gradient-to-b from-[#f0524a] to-[#d8392f] shadow-[0_34px_40px_-22px_rgba(110,20,20,.55),inset_0_2px_0_rgba(255,255,255,.28)]">
              {/* slot + the single strap looping through it */}
              <div
                aria-hidden="true"
                className="absolute left-1/2 top-[17px] h-[13px] w-[52px] -translate-x-1/2 rounded-full bg-[#f5f2f2] shadow-[inset_0_2px_3px_rgba(0,0,0,.35)]"
              />
              <StrapTail />

              {/* emblem */}
              <div
                aria-hidden="true"
                className="absolute left-[18px] top-[18px] grid h-[46px] w-[46px] place-items-center rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,.18)]"
              >
                <div className="grid h-[38px] w-[38px] place-items-center rounded-full border-[2.5px] border-[#e8443e]">
                  <ChartColumnIncreasing className="h-5 w-5 text-[#e8443e]" strokeWidth={2.75} />
                </div>
              </div>

              {/* photo on a gray backdrop shape */}
              <svg
                aria-hidden="true"
                viewBox="0 0 230 200"
                className="absolute left-[12px] top-[62px] h-[200px] w-[230px] overflow-visible"
              >
                <defs>
                  <clipPath id="idb-photo">
                    <path d={PHOTO_SHAPE} />
                  </clipPath>
                </defs>
                <path d={PHOTO_SHAPE} transform="translate(9 -7)" fill="#d6d3d3" />
                <image
                  href={avatar}
                  x={0}
                  y={0}
                  width={230}
                  height={200}
                  preserveAspectRatio="xMidYMid slice"
                  clipPath="url(#idb-photo)"
                />
              </svg>

              {/* name + id */}
              <div aria-hidden="true" className="absolute left-[20px] right-[20px] top-[276px]">
                <p className="line-clamp-2 break-words font-display text-[18px] font-extrabold uppercase leading-[1.08] tracking-[0.01em] text-white [text-shadow:0_1px_0_rgba(0,0,0,.12)]">
                  {name}
                </p>
                <p className="mt-1.5 text-[13px] font-medium tracking-wide text-white/90">ID: {idLabel}</p>
              </div>

              {/* scannable QR */}
              {qr && (
                <div className="absolute bottom-[14px] right-[14px]">
                  <QrCode url={qr.url} label={qr.label} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
