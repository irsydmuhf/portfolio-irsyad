// Builds brand/dataviz (chart palette + tool themes), brand/badges (tech stack + skills)
// and brand/presentation/qr-portfolio. Run after build.mjs:  node build-extras.mjs
import satori from "satori";
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = fileURLToPath(new URL("../..", import.meta.url)).replaceAll("\\", "/");
const OUT = ROOT + "/brand";
const req = createRequire(ROOT + "/package.json");
const sharp = req("sharp");
const si = req("simple-icons");
const bold = readFileSync(ROOT + "/assets/fonts/Poppins-Bold.ttf");
const medium = readFileSync(ROOT + "/assets/fonts/Poppins-Medium.ttf");
const URL_SITE = "https://irsydmuhf.vercel.app";

/* ------------------------------------------------------------------ palette */
// Validated with the dataviz skill's validate_palette.js:
// light on #ffffff and dark on #15171c both pass lightness, chroma, CVD (adjacent),
// normal-vision and 3:1 contrast. Under "all pairs" (scatter, maps) only the first
// three slots are guaranteed distinct: fold the rest into "Other" or facet.
const PALETTE = {
  categorical: {
    light: [
      ["Blue", "#3a6cf4"], ["Orange", "#e46f12"], ["Teal", "#00939b"],
      ["Coral", "#e0403a"], ["Violet", "#6a4fe0"], ["Gold", "#c48a00"],
    ],
    dark: [
      ["Blue", "#4f7ef7"], ["Orange", "#d9661a"], ["Teal", "#0f9aa1"],
      ["Coral", "#e0574d"], ["Violet", "#8670ec"], ["Gold", "#c08a00"],
    ],
  },
  // one hue light -> dark, for heatmaps and magnitude (site brand ramp)
  sequential: ["#eef3ff", "#dce6ff", "#b9cdff", "#8aaaff", "#5b86fb", "#3a6cf4", "#2753d8", "#1f42ad", "#1d3887", "#1c3168"],
  // two poles + neutral midpoint, for above/below target, growth vs decline
  diverging: ["#c2342f", "#e0403a", "#f19a93", "#e4e6eb", "#8aaaff", "#3a6cf4", "#1f42ad"],
  // one series in focus, everything else recedes
  highlight: { focus: "#3a6cf4", rest: "#c9cfdb", annotation: "#15171c" },
  // reserved for state; always pair with an icon or label
  status: { good: "#1f9d55", warning: "#e8a200", critical: "#c8302b" },
  neutral: { ink: "#15171c", text2: "#5b6275", grid: "#e4e6eb", surface: "#ffffff", surfaceDark: "#15171c" },
};

const file = (p, data) => { mkdirSync(p.slice(0, p.lastIndexOf("/")), { recursive: true }); writeFileSync(p, data); };
const light = PALETTE.categorical.light.map(([, h]) => h);
const dark = PALETTE.categorical.dark.map(([, h]) => h);
const noHash = (h) => h.slice(1).toUpperCase();

file(`${OUT}/dataviz/palette.json`, JSON.stringify(PALETTE, null, 2) + "\n");

// matplotlib / seaborn:  plt.style.use("brand/dataviz/irsyad.mplstyle")
file(`${OUT}/dataviz/irsyad.mplstyle`, `# Irsyad chart style for matplotlib / seaborn
# plt.style.use("path/to/irsyad.mplstyle")
axes.prop_cycle: cycler('color', [${light.map((h) => `'${noHash(h)}'`).join(", ")}])
axes.edgecolor: E4E6EB
axes.labelcolor: 5B6275
axes.titlecolor: 15171C
axes.titlesize: 14
axes.titleweight: bold
axes.titlelocation: left
axes.labelsize: 11
axes.spines.top: False
axes.spines.right: False
axes.grid: True
axes.grid.axis: y
axes.axisbelow: True
grid.color: E4E6EB
grid.linewidth: 0.8
xtick.color: 5B6275
ytick.color: 5B6275
xtick.labelsize: 10
ytick.labelsize: 10
legend.frameon: False
legend.fontsize: 10
lines.linewidth: 2
lines.markersize: 7
patch.edgecolor: FFFFFF
patch.linewidth: 1.5
figure.facecolor: FFFFFF
axes.facecolor: FFFFFF
savefig.dpi: 200
savefig.bbox: tight
font.family: sans-serif
font.sans-serif: Poppins, Inter, Arial, DejaVu Sans
text.color: 15171C
image.cmap: Blues
`);

// Plotly:  pio.templates["irsyad"] = go.layout.Template(json.load(open(...)))
file(`${OUT}/dataviz/plotly-template.json`, JSON.stringify({
  layout: {
    colorway: light,
    font: { family: "Poppins, Inter, Arial, sans-serif", color: "#15171c", size: 13 },
    title: { x: 0, xanchor: "left", font: { size: 18 } },
    paper_bgcolor: "#ffffff", plot_bgcolor: "#ffffff",
    xaxis: { showgrid: false, linecolor: "#e4e6eb", tickcolor: "#e4e6eb", tickfont: { color: "#5b6275" } },
    yaxis: { gridcolor: "#e4e6eb", zeroline: false, tickfont: { color: "#5b6275" } },
    legend: { orientation: "h", y: 1.08, x: 0 },
    colorscale: { sequential: PALETTE.sequential.map((c, i, a) => [i / (a.length - 1), c]), diverging: PALETTE.diverging.map((c, i, a) => [i / (a.length - 1), c]) },
    hoverlabel: { bgcolor: "#15171c", font: { color: "#ffffff" } },
  },
}, null, 2) + "\n");

// Power BI:  View > Themes > Browse for themes
file(`${OUT}/dataviz/powerbi-theme.json`, JSON.stringify({
  name: "Irsyad",
  dataColors: light,
  background: "#FFFFFF", foreground: "#15171C", tableAccent: "#3A6CF4",
  good: PALETTE.status.good, neutral: PALETTE.status.warning, bad: PALETTE.status.critical,
  maximum: "#1F42AD", center: "#E4E6EB", minimum: "#E0403A",
  textClasses: {
    title: { fontFace: "Segoe UI Semibold", color: "#15171C" },
    label: { fontFace: "Segoe UI", color: "#5B6275" },
  },
}, null, 2) + "\n");

// Tableau: merge into Documents/My Tableau Repository/Preferences.tps, restart Tableau
file(`${OUT}/dataviz/tableau-Preferences.tps`, `<?xml version='1.0'?>
<workbook>
  <preferences>
    <color-palette name="Irsyad Categorical" type="regular">
${light.map((h) => `      <color>${h}</color>`).join("\n")}
    </color-palette>
    <color-palette name="Irsyad Sequential" type="ordered-sequential">
${PALETTE.sequential.map((h) => `      <color>${h}</color>`).join("\n")}
    </color-palette>
    <color-palette name="Irsyad Diverging" type="ordered-diverging">
${PALETTE.diverging.map((h) => `      <color>${h}</color>`).join("\n")}
    </color-palette>
  </preferences>
</workbook>
`);

// Office (Excel, PowerPoint, Word): copy to
// %APPDATA%\\Microsoft\\Templates\\Document Themes\\Theme Colors\\  then Page Layout > Colors
file(`${OUT}/dataviz/office-theme-colors.xml`, `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:clrScheme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Irsyad">
  <a:dk1><a:srgbClr val="15171C"/></a:dk1>
  <a:lt1><a:srgbClr val="FFFFFF"/></a:lt1>
  <a:dk2><a:srgbClr val="1F42AD"/></a:dk2>
  <a:lt2><a:srgbClr val="EEF3FF"/></a:lt2>
${light.map((h, i) => `  <a:accent${i + 1}><a:srgbClr val="${noHash(h)}"/></a:accent${i + 1}>`).join("\n")}
  <a:hlink><a:srgbClr val="3A6CF4"/></a:hlink>
  <a:folHlink><a:srgbClr val="6A4FE0"/></a:folHlink>
</a:clrScheme>
`);

file(`${OUT}/dataviz/palette.css`, `/* Irsyad chart palette */
:root {
${light.map((h, i) => `  --series-${i + 1}: ${h};`).join("\n")}
  --focus: ${PALETTE.highlight.focus};
  --rest: ${PALETTE.highlight.rest};
  --grid: ${PALETTE.neutral.grid};
}
@media (prefers-color-scheme: dark) {
  :root {
${dark.map((h, i) => `    --series-${i + 1}: ${h};`).join("\n")}
  }
}
`);

/* ------------------------------------------------------------- satori setup */
const fonts = [{ name: "Poppins", data: bold, weight: 700, style: "normal" }, { name: "Poppins", data: medium, weight: 500, style: "normal" }];
const uri = (s) => "data:image/svg+xml;base64," + Buffer.from(s).toString("base64");
const h = (style, ...children) => { const c = children.flat(); return { type: "div", props: { style: { display: "flex", ...style }, children: c.length === 1 ? c[0] : c } }; };
const img = (src, w, ht, style = {}) => ({ type: "img", props: { src, width: w, height: ht, style } });
async function render(path, W, H, tree, scales = [2]) {
  const svg = await satori(tree, { width: W, height: H, fonts });
  file(`${OUT}/${path}.svg`, svg);
  for (const s of scales) file(`${OUT}/${path}${s === 1 ? "" : `@${s}x`}.png`, await sharp(Buffer.from(svg), { density: 72 * s }).png().toBuffer());
}

// chips size to their content: lay the chip out in a wide canvas, measure the
// rendered pill, then render again at exactly that width
async function renderChip(path, H, style, children) {
  const probe = await satori(h({ width: 1400, height: H, alignItems: "flex-start" }, h({ height: H, flexShrink: 0, ...style }, children)), { width: 1400, height: H, fonts });
  const { info } = await sharp(Buffer.from(probe)).trim({ threshold: 1 }).toBuffer({ resolveWithObject: true });
  const W = info.width;
  await render(path, W, H, h({ width: W, height: H, ...style }, children));
}

/* ------------------------------------------------------------ palette sheet */
const sw = (hex, label, w = 150) => h({ flexDirection: "column", width: w, gap: 8 },
  h({ height: 72, borderRadius: 14, background: hex }),
  h({ fontSize: 15, fontWeight: 700, color: "#15171c" }, label),
  h({ fontSize: 13, fontWeight: 500, color: "#5b6275" }, hex.toUpperCase()));
const row = (title, items) => h({ flexDirection: "column", gap: 14 },
  h({ fontSize: 16, fontWeight: 700, color: "#3a6cf4", letterSpacing: 1 }, title.toUpperCase()), h({ gap: 16 }, items));
await render("dataviz/palette-sheet", 1200, 980, h({ width: 1200, height: 980, background: "#ffffff", fontFamily: "Poppins", padding: 56, flexDirection: "column", gap: 34 },
  h({ fontSize: 34, fontWeight: 700, color: "#15171c" }, "Chart palette"),
  row("Categorical · light background (in this order)", PALETTE.categorical.light.map(([n, x], i) => sw(x, `${i + 1} ${n}`))),
  row("Categorical · dark background", PALETTE.categorical.dark.map(([n, x], i) => sw(x, `${i + 1} ${n}`))),
  row("Sequential · magnitude", PALETTE.sequential.map((x, i) => sw(x, `${(i + 1) * 100}`, 93))),
  h({ gap: 60 },
    row("Highlight", [sw(PALETTE.highlight.focus, "Focus"), sw(PALETTE.highlight.rest, "Rest")]),
    row("Status (with icon or label)", [sw(PALETTE.status.good, "Good", 120), sw(PALETTE.status.warning, "Warning", 120), sw(PALETTE.status.critical, "Critical", 120)]))), [1, 2]);

/* -------------------------------------------------------------------- badges */
// Logos come from simple-icons; brands it no longer ships (Microsoft, Tableau, AWS)
// get a monogram tile in their brand colour, the same treatment the website uses.
const TECH = [
  ["Python", "siPython"], ["SQL", null, "SQL", "#3a6cf4"], ["PostgreSQL", "siPostgresql"], ["MySQL", "siMysql"],
  ["pandas", "siPandas"], ["NumPy", "siNumpy"], ["Jupyter", "siJupyter"], ["Google Colab", "siGooglecolab"],
  ["Excel", null, "XL", "#217346"], ["Google Sheets", "siGooglesheets"], ["Apps Script", "siGoogleappsscript"],
  ["Power BI", null, "BI", "#F2C811", "#15171c"], ["Looker Studio", null, "LS", "#4285F4"], ["Tableau", null, "Tb", "#E97627"],
  ["BigQuery", "siGooglebigquery"], ["Plotly", "siPlotly"], ["scikit-learn", "siScikitlearn"], ["Streamlit", "siStreamlit"],
  ["Airflow", "siApacheairflow"], ["AWS", null, "aws", "#232F3E"], ["Supabase", "siSupabase"], ["Docker", "siDocker"],
  ["Git", "siGit"], ["GitHub", "siGithub"],
];
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const logoSvg = (key) => { const i = si[key]; return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#${i.hex}" d="${i.path}"/></svg>`; };
const logo = ([, key, mono, bg, fg = "#ffffff"], size) => key
  ? img(uri(logoSvg(key)), size, size)
  : h({ width: size, height: size, borderRadius: size * 0.24, background: bg, color: fg, alignItems: "center", justifyContent: "center", fontSize: size * (mono.length > 2 ? 0.36 : 0.46), fontWeight: 700 }, mono);

for (const t of TECH) {
  const name = t[0];
  // chip: white pill, works on white and on brand blue
  await renderChip(`badges/tech/chip/${slug(name)}`, 56, { borderRadius: 999, background: "#ffffff", border: "2px solid #e2e7f2", alignItems: "center", gap: 12, padding: "0 22px 0 14px", fontFamily: "Poppins", fontSize: 20, fontWeight: 500, color: "#15171c" },
    [logo(t, 28), name]);
  // keycap: square cap like the keycaps on the website's desk
  await render(`badges/tech/keycap/${slug(name)}`, 200, 216, h({ width: 200, height: 216, position: "relative", fontFamily: "Poppins" },
    h({ position: "absolute", left: 8, top: 14, width: 184, height: 196, borderRadius: 44, background: "#cfd8ec" }),
    h({ position: "absolute", left: 18, top: 10, width: 164, height: 160, borderRadius: 36, background: "#ffffff", border: "2px solid #e2e7f2", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 },
      logo(t, 64), h({ fontSize: name.length > 11 ? 15 : 18, fontWeight: 700, color: "#15171c" }, name))));
}

// skills: text chips, dot colour = category (categorical slots 1-4)
const SKILLS = {
  Analytics: { color: light[0], items: ["SQL", "Customer Analytics", "Cohort Analysis", "Business Metrics", "EDA"] },
  "Data & Automation": { color: light[2], items: ["Python", "Pandas", "Google Apps Script", "API Integration", "ETL"] },
  "BI & Reporting": { color: light[1], items: ["Power BI", "Looker Studio", "Google Sheets", "Dashboarding"] },
  "Data Systems": { color: light[4], items: ["Data Cleaning", "Data Validation", "Data Modeling", "Workflow Automation"] },
};
for (const [cat, { color, items }] of Object.entries(SKILLS)) {
  for (const s of items) {
    await renderChip(`badges/skills/${slug(cat)}--${slug(s)}`, 52, { borderRadius: 999, background: "#ffffff", border: "2px solid #e2e7f2", alignItems: "center", gap: 12, padding: "0 22px 0 20px", fontFamily: "Poppins", fontSize: 19, fontWeight: 500, color: "#15171c" },
      [h({ width: 14, height: 14, borderRadius: 999, background: color }), s]);
  }
}

// overview sheets
const chipRow = (list) => h({ flexWrap: "wrap", gap: 12, flexShrink: 0 }, list);
await render("badges/tech-stack-sheet", 1200, 760, h({ width: 1200, height: 760, background: "#f5f7fc", fontFamily: "Poppins", padding: 56, flexDirection: "column", gap: 24 },
  h({ fontSize: 30, fontWeight: 700, color: "#15171c", flexShrink: 0 }, "Tech stack"),
  chipRow(TECH.map((t) => h({ height: 56, borderRadius: 999, background: "#ffffff", border: "2px solid #e2e7f2", alignItems: "center", gap: 12, padding: "0 22px 0 14px", fontSize: 20, fontWeight: 500, color: "#15171c" }, logo(t, 28), t[0]))),
  h({ fontSize: 30, fontWeight: 700, color: "#15171c", marginTop: 12, flexShrink: 0 }, "Skills"),
  chipRow(Object.values(SKILLS).flatMap(({ color, items }) => items.map((s) => h({ height: 50, borderRadius: 999, background: "#ffffff", border: "2px solid #e2e7f2", alignItems: "center", gap: 10, padding: "0 20px 0 18px", fontSize: 18, fontWeight: 500, color: "#15171c" }, h({ width: 13, height: 13, borderRadius: 999, background: color }), s))))), [1, 2]);

/* ------------------------------------------------------------------------ QR */
const { renderSVG } = await import(pathToFileURL(req.resolve("uqr")).href);
for (const [name, fg, bg] of [["qr-portfolio", "#15171c", "#ffffff"], ["qr-portfolio-blue", "#1f42ad", "#ffffff"]]) {
  const svg = renderSVG(URL_SITE, { blackColor: fg, whiteColor: bg, border: 2 });
  file(`${OUT}/presentation/${name}.svg`, svg);
  file(`${OUT}/presentation/${name}.png`, await sharp(Buffer.from(svg), { density: 1200 }).resize(1000, 1000, { kernel: "nearest" }).png().toBuffer());
}

console.log("extras done");
