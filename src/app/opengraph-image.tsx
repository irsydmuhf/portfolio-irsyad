/* eslint-disable @next/next/no-img-element -- ImageResponse renders plain <img>, next/image is not supported there */
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Irsyad Muhamad Firdaus — Data Analytics Portofolio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BRAND = "#3a6cf4";
const SUN = "#ffc935";

// Accent version of the logo: faint white ribbon, solid yellow dot.
// Same geometry as src/app/icon.svg, without the tile.
const ACCENT_MARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="s" gradientUnits="userSpaceOnUse" x1="34" y1="28" x2="41" y2="62">
      <stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#fff"/>
      <stop offset="1" stop-color="#fff" stop-opacity=".28"/>
    </linearGradient>
    <linearGradient id="u" gradientUnits="userSpaceOnUse" x1="42" y1="62" x2="72" y2="82">
      <stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset="1" stop-color="#fff"/>
    </linearGradient>
  </defs>
  <g opacity=".2" fill="none" stroke-width="13">
    <circle cx="34" cy="34" r="6.5" fill="#fff" stroke="none"/>
    <path d="M34 34 C35.5 46 38 56 42 63" stroke="url(#s)"/>
    <path d="M42 63 C46 70 49 72 53 75 C65 84 84 80 84 64" stroke="url(#u)"/>
    <path d="M84 64 C84 48 68 42 54 44 C40 46 28 54 22 68 C19 76 19 90 20 104" stroke="#fff" stroke-linecap="round"/>
  </g>
  <circle cx="32" cy="8" r="14.5" fill="${SUN}"/>
</svg>`;

const toDataUri = (svg: string) =>
  `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

export default async function Image() {
  const [poppinsBold, poppinsMedium, iconSvg] = await Promise.all([
    readFile(join(process.cwd(), "assets/fonts/Poppins-Bold.ttf")),
    readFile(join(process.cwd(), "assets/fonts/Poppins-Medium.ttf")),
    readFile(join(process.cwd(), "src/app/icon.svg"), "utf8"),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: BRAND,
          fontFamily: "Poppins",
          color: "#fff",
        }}
      >
        {/* oversized logo: dot cropped by the top edge, ribbon by the bottom */}
        <img
          alt=""
          src={toDataUri(ACCENT_MARK)}
          width={760}
          height={760}
          style={{ position: "absolute", left: 560, top: 0 }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "72px 80px",
            width: 700,
          }}
        >
          <img
            alt=""
            src={toDataUri(iconSvg)}
            width={84}
            height={84}
            style={{ borderRadius: 20, boxShadow: "0 0 0 4px rgba(255,255,255,.25)" }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.08, letterSpacing: -1.5 }}>
              Irsyad Muhamad Firdaus
            </div>
            <div style={{ fontSize: 34, fontWeight: 500, opacity: 0.85 }}>
              Data Analytics Portofolio
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Poppins", data: poppinsBold, weight: 700, style: "normal" },
        { name: "Poppins", data: poppinsMedium, weight: 500, style: "normal" },
      ],
    }
  );
}
