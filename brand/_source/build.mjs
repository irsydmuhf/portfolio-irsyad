// Builds the brand kit into <ROOT>/brand. Logos are hand-written SVG; compositions with
// text go through satori (text becomes vector paths), PNGs through sharp.
import satori from "satori";
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

// repo root, two levels up from brand/_source/
const ROOT = fileURLToPath(new URL("../..", import.meta.url)).replaceAll("\\", "/");
const OUT = ROOT + "/brand";
const sharp = createRequire(ROOT + "/package.json")("sharp");
const bold = readFileSync(ROOT + "/assets/fonts/Poppins-Bold.ttf");
const medium = readFileSync(ROOT + "/assets/fonts/Poppins-Medium.ttf");

const C = { brand: "#3a6cf4", brandDeep: "#2753d8", sun: "#ffc935", ink: "#15171c", muted: "#5b6275", paper: "#f5f7fc", white: "#ffffff" };
const INFO = {
  name: "Irsyad Muhamad Firdaus",
  role: "Data Analyst & Engineer",
  tagline: "Turning complex datasets into confident business decisions.",
  url: "irsydmuhf.vercel.app",
  email: "irsyad.muhf@gmail.com",
  linkedin: "linkedin.com/in/irsyadmuhf",
  github: "github.com/irsydmuhf",
  tools: ["Python", "SQL", "pandas", "PostgreSQL", "Excel"],
};

/* ------------------------------------------------------------- logo geometry */
// ribbon: colour of the stroke; dot: colour of the dot; fade: stem fade at the crossing
function markBody({ ribbon, dot, ribbonOpacity = 1, fade = true, tail = 104, id = "m" }) {
  const stem = fade ? `url(#${id}s)` : ribbon;
  const under = fade ? `url(#${id}u)` : ribbon;
  const defs = fade
    ? `<linearGradient id="${id}s" gradientUnits="userSpaceOnUse" x1="34" y1="28" x2="41" y2="62"><stop offset="0" stop-color="${ribbon}"/><stop offset=".5" stop-color="${ribbon}"/><stop offset="1" stop-color="${ribbon}" stop-opacity=".28"/></linearGradient>
<linearGradient id="${id}u" gradientUnits="userSpaceOnUse" x1="42" y1="62" x2="72" y2="82"><stop offset="0" stop-color="${ribbon}" stop-opacity=".28"/><stop offset="1" stop-color="${ribbon}"/></linearGradient>`
    : "";
  // continue along the end tangent of the curve (1:14) so the join has no kink
  const tailSeg = tail > 104 ? ` L${(20 + (tail - 104) / 14).toFixed(2)} ${tail}` : "";
  return {
    defs,
    body: `<g opacity="${ribbonOpacity}" fill="none" stroke-width="13">
<circle cx="34" cy="34" r="6.5" fill="${ribbon}" stroke="none"/>
<path d="M34 34 C35.5 46 38 56 42 63" stroke="${stem}"/>
<path d="M42 63 C46 70 49 72 53 75 C65 84 84 80 84 64" stroke="${under}"/>
<path d="M84 64 C84 48 68 42 54 44 C40 46 28 54 22 68 C19 76 19 90 20 ${104}${tailSeg}" stroke="${ribbon}" stroke-linecap="round"/>
</g>
<circle cx="32" cy="8" r="14.5" fill="${dot}"/>`,
  };
}

// standalone mark, whole dot visible, transparent background
const markSvg = (o) => {
  const { defs, body } = markBody(o);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="12 -10 82 124" width="164" height="248"><defs>${defs}</defs>${body}</svg>`;
};
// app-icon tile, dot cropped by the top edge
const tileSvg = (shape) => {
  const { defs, body } = markBody({ ribbon: C.white, dot: C.sun, id: "t" });
  const clip = shape === "circle" ? `<circle cx="50" cy="50" r="50"/>` : `<rect width="100" height="100" rx="${shape === "rounded" ? 22 : 0}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="512" height="512"><defs><clipPath id="c">${clip}</clipPath>${defs}</defs><g clip-path="url(#c)"><rect width="100" height="100" fill="${C.brand}"/>${body}</g></svg>`;
};
// faint accent mark for compositions; tall viewBox so the tail runs off the bottom
const accentSvg = (ribbon = C.white, opacity = 0.2) => {
  const { defs, body } = markBody({ ribbon, dot: C.sun, ribbonOpacity: opacity, tail: 400, id: "a" });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -20 100 220" overflow="visible"><defs>${defs}</defs>${body}</svg>`;
};

/* ------------------------------------------------------------------ helpers */
const uri = (s) => "data:image/svg+xml;base64," + Buffer.from(s).toString("base64");
const h = (style, ...children) => ({ type: "div", props: { style: { display: "flex", ...style }, children: children.flat().length === 1 ? children.flat()[0] : children.flat() } });
const img = (src, w, ht, style = {}) => ({ type: "img", props: { src, width: w, height: ht, style } });
const file = (p, data) => { mkdirSync(p.slice(0, p.lastIndexOf("/")), { recursive: true }); writeFileSync(p, data); };
const png = (svg, width, path) => sharp(Buffer.from(svg), { density: 600 }).resize({ width }).png().toBuffer().then((b) => file(path, b));
const built = [];

async function compose(path, W, H, tree, { pngScales = [1, 2], svg = true } = {}) {
  const out = await satori(tree, { width: W, height: H, fonts: [{ name: "Poppins", data: bold, weight: 700, style: "normal" }, { name: "Poppins", data: medium, weight: 500, style: "normal" }] });
  if (svg) file(`${OUT}/${path}.svg`, out);
  for (const s of pngScales) {
    const suffix = s === 1 ? "" : `@${s}x`;
    const b = await sharp(Buffer.from(out), { density: 72 * s }).png().toBuffer();
    file(`${OUT}/${path}${suffix}.png`, b);
  }
  built.push(`${path} (${W}x${H})`);
}

const T = (text, size, weight = 700, style = {}) => h({ fontSize: size, fontWeight: weight, lineHeight: 1.15, ...style }, text);
const chip = (t, k = 1, dark = false) => h({ fontSize: 17 * k, fontWeight: 500, padding: `${6 * k}px ${16 * k}px`, borderRadius: 999, background: dark ? "rgba(21,23,28,.06)" : "rgba(255,255,255,.14)", border: `${1.5 * k}px solid ${dark ? "rgba(21,23,28,.12)" : "rgba(255,255,255,.28)"}` }, t);
const pill = (t, k = 1) => h({ alignSelf: "flex-start", fontSize: 15 * k, fontWeight: 700, color: C.ink, background: C.sun, padding: `${5 * k}px ${14 * k}px`, borderRadius: 999 }, t);
const ICON = uri(tileSvg("rounded"));
const MARK_COLOR = uri(markSvg({ ribbon: C.brand, dot: C.sun, id: "c" }));
const MARK_WHITE = uri(markSvg({ ribbon: C.white, dot: C.sun, id: "w" }));

/* -------------------------------------------------------------------- logos */
const logos = {
  "icon-rounded": tileSvg("rounded"),
  "icon-square": tileSvg("square"),
  "icon-circle": tileSvg("circle"),
  "mark-color": markSvg({ ribbon: C.brand, dot: C.sun, id: "c" }),
  "mark-white": markSvg({ ribbon: C.white, dot: C.sun, id: "w" }),
  "mark-ink": markSvg({ ribbon: C.ink, dot: C.ink, id: "k" }),
  "mark-mono-white": markSvg({ ribbon: C.white, dot: C.white, id: "mw" }),
};
for (const [name, svg] of Object.entries(logos)) {
  file(`${OUT}/logo/${name}.svg`, svg);
  const sizes = name === "icon-rounded" ? [64, 128, 256, 512, 1024] : [1024];
  for (const s of sizes) await png(svg, name.startsWith("mark") ? Math.round(s * 82 / 124) : s, `${OUT}/logo/png/${name}-${s}.png`);
  built.push(`logo/${name}`);
}

/* ------------------------------------------------------------------ lockups */
const lockupH = (mark, nameColor, roleColor) => h({ width: 980, height: 220, alignItems: "center", gap: 30, padding: "0 20px" },
  img(mark, 109, 165),
  h({ flexDirection: "column" }, T(INFO.name, 60, 700, { color: nameColor, letterSpacing: -1 }), T(INFO.role, 28, 500, { color: roleColor, marginTop: 4 })));
await compose("lockup/lockup-horizontal-light", 980, 220, lockupH(MARK_COLOR, C.ink, C.muted));
await compose("lockup/lockup-horizontal-dark", 980, 220, lockupH(MARK_WHITE, C.white, "rgba(255,255,255,.8)"));
const lockupS = (mark, nameColor, roleColor) => h({ width: 720, height: 560, flexDirection: "column", alignItems: "center", justifyContent: "center" },
  img(mark, 172, 260), T(INFO.name, 52, 700, { color: nameColor, marginTop: 28, letterSpacing: -1 }), T(INFO.role, 26, 500, { color: roleColor, marginTop: 6 }));
await compose("lockup/lockup-stacked-light", 720, 560, lockupS(MARK_COLOR, C.ink, C.muted));
await compose("lockup/lockup-stacked-dark", 720, 560, lockupS(MARK_WHITE, C.white, "rgba(255,255,255,.8)"));

/* ------------------------------------------------------------------- social */
// LinkedIn: profile photo covers the lower-left, so text starts at x=620
const heroText = (k, { url = true } = {}) => h({ flexDirection: "column", justifyContent: "center", color: C.white },
  pill("Available for Work", k),
  T(INFO.name, 58 * k, 700, { letterSpacing: -1 * k, marginTop: 14 * k }),
  T(INFO.role, 28 * k, 500, { marginTop: 4 * k }),
  T(INFO.tagline, 20 * k, 500, { opacity: 0.78, marginTop: 6 * k }),
  h({ marginTop: 22 * k, alignItems: "center", justifyContent: "space-between", gap: 24 * k },
    h({ gap: 8 * k }, INFO.tools.map((t) => chip(t, k))),
    url ? h({ alignItems: "center", gap: 10 * k, fontSize: 17 * k, fontWeight: 500 }, img(ICON, 30 * k, 30 * k, { borderRadius: 8 * k }), INFO.url) : []));
const ACCENT = uri(accentSvg());
await compose("social/linkedin-banner", 1584, 396, h({ width: 1584, height: 396, position: "relative", overflow: "hidden", background: C.brand, fontFamily: "Poppins" },
  img(ACCENT, 300, 660, { position: "absolute", left: 60, top: -60 }),
  h({ position: "absolute", left: 620, top: 0, bottom: 0, right: 56 }, heroText(1))));
// X header: avatar sits lower-left too; 1500x500
await compose("social/x-header", 1500, 500, h({ width: 1500, height: 500, position: "relative", overflow: "hidden", background: C.brand, fontFamily: "Poppins" },
  img(ACCENT, 380, 836, { position: "absolute", left: 70, top: -76 }),
  h({ position: "absolute", left: 560, top: 0, bottom: 0, right: 56 }, heroText(1, { url: true }))));
// GitHub profile README banner: no avatar overlap
await compose("social/github-readme-banner", 1280, 320, h({ width: 1280, height: 320, position: "relative", overflow: "hidden", background: C.brand, fontFamily: "Poppins", color: C.white },
  img(ACCENT, 260, 572, { position: "absolute", right: 70, top: -52 }),
  h({ position: "absolute", left: 64, top: 0, bottom: 0, flexDirection: "column", justifyContent: "center" },
    T(INFO.name, 52, 700, { letterSpacing: -1 }), T(INFO.role + " · " + INFO.url, 22, 500, { opacity: 0.85, marginTop: 6 }),
    h({ gap: 8, marginTop: 20 }, INFO.tools.map((t) => chip(t))))));
// default share image (same as the site OG)
await compose("social/og-image", 1200, 630, h({ width: 1200, height: 630, position: "relative", overflow: "hidden", background: C.brand, fontFamily: "Poppins", color: C.white },
  img(uri(accentSvg()), 760, 1672, { position: "absolute", left: 560, top: -152 }),
  h({ flexDirection: "column", justifyContent: "space-between", padding: "72px 80px", width: 700 },
    img(ICON, 84, 84, { borderRadius: 20 }),
    h({ flexDirection: "column" }, T(INFO.name, 76, 700, { lineHeight: 1.08, letterSpacing: -1.5 }), T("Data Analytics Portofolio", 34, 500, { opacity: 0.85, marginTop: 18 })))));
// square post template (blank headline area kept for your own text)
await compose("social/square-post-template", 1080, 1080, h({ width: 1080, height: 1080, position: "relative", overflow: "hidden", background: C.brand, fontFamily: "Poppins", color: C.white },
  img(uri(accentSvg()), 760, 1672, { position: "absolute", right: -160, top: -152 }),
  h({ position: "absolute", left: 80, bottom: 80, alignItems: "center", gap: 18 }, img(ICON, 72, 72, { borderRadius: 18 }),
    h({ flexDirection: "column" }, T(INFO.name, 30, 700), T(INFO.url, 20, 500, { opacity: 0.8 })))), { pngScales: [1] });
await compose("social/story-template", 1080, 1920, h({ width: 1080, height: 1920, position: "relative", overflow: "hidden", background: C.brand, fontFamily: "Poppins", color: C.white },
  img(uri(accentSvg()), 900, 1980, { position: "absolute", right: -260, top: -180 }),
  h({ position: "absolute", left: 80, bottom: 160, alignItems: "center", gap: 18 }, img(ICON, 80, 80, { borderRadius: 20 }),
    h({ flexDirection: "column" }, T(INFO.name, 34, 700), T(INFO.url, 22, 500, { opacity: 0.8 })))), { pngScales: [1] });

/* ------------------------------------------------------------- presentation */
await compose("presentation/slide-cover-bg", 1920, 1080, h({ width: 1920, height: 1080, position: "relative", overflow: "hidden", background: C.brand, fontFamily: "Poppins", color: C.white },
  img(uri(accentSvg()), 900, 1980, { position: "absolute", right: 40, top: -180 }),
  h({ position: "absolute", left: 120, bottom: 110, alignItems: "center", gap: 20 }, img(ICON, 72, 72, { borderRadius: 18 }),
    h({ flexDirection: "column" }, T(INFO.name, 30, 700), T(INFO.role, 22, 500, { opacity: 0.85 })))), { pngScales: [1] });
await compose("presentation/slide-content-bg", 1920, 1080, h({ width: 1920, height: 1080, position: "relative", overflow: "hidden", background: C.paper, fontFamily: "Poppins", color: C.muted },
  h({ position: "absolute", left: 0, right: 0, top: 0, height: 10, background: C.brand }),
  h({ position: "absolute", left: 120, right: 120, bottom: 56, justifyContent: "space-between", alignItems: "center", fontSize: 20, fontWeight: 500 },
    h({ alignItems: "center", gap: 14 }, img(ICON, 40, 40, { borderRadius: 10 }), INFO.name), INFO.url)), { pngScales: [1] });
await compose("presentation/video-call-background", 1920, 1080, h({ width: 1920, height: 1080, position: "relative", overflow: "hidden", background: C.brand, fontFamily: "Poppins", color: C.white },
  img(uri(accentSvg(C.white, 0.14)), 700, 1540, { position: "absolute", left: -120, top: -140 }),
  h({ position: "absolute", right: 110, top: 90, flexDirection: "column", alignItems: "flex-end" }, T(INFO.name, 40, 700), T(INFO.role, 26, 500, { opacity: 0.85, marginTop: 4 }))), { pngScales: [1] });

/* -------------------------------------------------------------------- print */
// 90 x 55 mm business card at 300 dpi = 1063 x 650 px (no bleed)
await compose("print/business-card-front", 1063, 650, h({ width: 1063, height: 650, background: C.white, fontFamily: "Poppins", color: C.ink, padding: 72, flexDirection: "column", justifyContent: "space-between" },
  h({ alignItems: "center", gap: 22 }, img(MARK_COLOR, 66, 100), h({ flexDirection: "column" }, T(INFO.name, 40, 700, { letterSpacing: -0.5 }), T(INFO.role, 22, 500, { color: C.muted, marginTop: 4 }))),
  h({ flexDirection: "column", gap: 8, fontSize: 21, fontWeight: 500, color: C.ink },
    [["E", INFO.email], ["in", INFO.linkedin], ["W", INFO.url]].map(([k, v]) => h({ gap: 18 }, h({ width: 34, color: C.brand, fontWeight: 700 }, k), v)))), { pngScales: [2] });
// back: logo rotated 90deg (dot points right), cropped by the right and bottom edges.
// Hand-written so the rotated tail can run off the left edge without an image box clipping it.
{
  const { defs, body } = markBody({ ribbon: "#eef2fb", dot: C.sun, tail: 400, id: "b" });
  const S = 900, L = 163, Tp = -58;
  const back = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1063 650" width="1063" height="650"><defs>${defs}</defs>
<rect width="1063" height="650" fill="${C.brand}"/>
<g transform="translate(${L} ${Tp}) scale(${S / 100}) rotate(90 50 50)">${body}</g></svg>`;
  file(`${OUT}/print/business-card-back.svg`, back);
  file(`${OUT}/print/business-card-back@2x.png`, await sharp(Buffer.from(back), { density: 144 }).png().toBuffer());
  built.push("print/business-card-back (1063x650)");
}

/* -------------------------------------------------------------------- email */
await compose("email/email-signature", 600, 140, h({ width: 600, height: 140, background: C.white, fontFamily: "Poppins", alignItems: "center", gap: 20, padding: "0 24px" },
  img(ICON, 76, 76, { borderRadius: 18 }),
  h({ flexDirection: "column", borderLeft: `2px solid #e2e7f2`, paddingLeft: 20 },
    T(INFO.name, 22, 700, { color: C.ink }), T(INFO.role, 15, 500, { color: C.muted, marginTop: 2 }),
    T(`${INFO.url}  ·  ${INFO.linkedin}`, 13, 500, { color: C.brand, marginTop: 8 }))), { pngScales: [2] });

console.log(built.join("\n"));
