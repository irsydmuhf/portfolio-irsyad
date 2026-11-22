// Builds brand/presentation/irsyad-slides-template.pptx (16:9, Poppins).
// Imports cleanly into Canva (File > Import) and opens in PowerPoint / Google Slides.
// Run after build.mjs and build-extras.mjs:  node build-slides.cjs
const path = require("path");
const fs = require("fs");
const { createRequire } = require("module");
const pptxgen = require("pptxgenjs");
const JSZip = require(require.resolve("jszip", { paths: [require.resolve("pptxgenjs")] }));

const ROOT = path.resolve(__dirname, "../..");
const BRAND = path.join(ROOT, "brand");
const rootReq = createRequire(path.join(ROOT, "package.json"));
const sharp = rootReq("sharp");
const React = rootReq("react");
const { renderToStaticMarkup } = rootReq("react-dom/server");
const lucide = rootReq("lucide-react");

const PAL = JSON.parse(fs.readFileSync(path.join(BRAND, "dataviz/palette.json"), "utf8"));
const hex = (h) => h.replace("#", "").toUpperCase();
const SERIES = PAL.categorical.light.map(([, h]) => hex(h));
const COL = { brand: "3A6CF4", brandDeep: "1F42AD", sun: "FFC935", ink: "15171C", muted: "5B6275", soft: "EEF3FF", line: "E2E7F2", rest: hex(PAL.highlight.rest), white: "FFFFFF" };
const THEME = {
  name: "Irsyad", headFontFace: "Poppins", bodyFontFace: "Poppins",
  colors: { dk1: COL.ink, lt1: COL.white, dk2: COL.brandDeep, lt2: COL.soft, accent1: SERIES[0], accent2: SERIES[1], accent3: SERIES[2], accent4: SERIES[3], accent5: SERIES[4], accent6: SERIES[5], hlink: COL.brand, folHlink: SERIES[4] },
};
const INFO = { name: "Irsyad Muhamad Firdaus", role: "Data Analyst & Engineer", url: "irsyadmuhf.vercel.app", email: "irsyad.muhf@gmail.com", linkedin: "linkedin.com/in/irsyadmuhf" };

/* ------------------------------------------------------------------ images */
const W = 13.333, H = 7.5; // LAYOUT_WIDE, inches
function markBody(ribbon, opacity) {
  return `<defs><linearGradient id="s" gradientUnits="userSpaceOnUse" x1="34" y1="28" x2="41" y2="62"><stop offset="0" stop-color="${ribbon}"/><stop offset=".5" stop-color="${ribbon}"/><stop offset="1" stop-color="${ribbon}" stop-opacity=".28"/></linearGradient>
<linearGradient id="u" gradientUnits="userSpaceOnUse" x1="42" y1="62" x2="72" y2="82"><stop offset="0" stop-color="${ribbon}" stop-opacity=".28"/><stop offset="1" stop-color="${ribbon}"/></linearGradient></defs>
<g opacity="${opacity}" fill="none" stroke-width="13"><circle cx="34" cy="34" r="6.5" fill="${ribbon}" stroke="none"/>
<path d="M34 34 C35.5 46 38 56 42 63" stroke="url(#s)"/><path d="M42 63 C46 70 49 72 53 75 C65 84 84 80 84 64" stroke="url(#u)"/>
<path d="M84 64 C84 48 68 42 54 44 C40 46 28 54 22 68 C19 76 19 90 20 104 L41.14 400" stroke="${ribbon}" stroke-linecap="round"/></g>
<circle cx="32" cy="8" r="14.5" fill="#ffc935"/>`;
}
// accent pre-cropped to the region it occupies, so nothing hangs off the slide
async function accentPng({ wIn, hIn, sizeIn, xIn, yIn, ribbon, opacity }) {
  const ppi = 200, s = (sizeIn * ppi) / 100;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${wIn * ppi}" height="${hIn * ppi}" viewBox="0 0 ${wIn * ppi} ${hIn * ppi}">
<g transform="translate(${xIn * ppi} ${yIn * ppi}) scale(${s})">${markBody(ribbon, opacity)}</g></svg>`;
  return "image/png;base64," + (await sharp(Buffer.from(svg)).png().toBuffer()).toString("base64");
}
const fileData = (p) => "image/png;base64," + fs.readFileSync(p).toString("base64");
async function iconPng(name, color = "#ffffff") {
  const svg = renderToStaticMarkup(React.createElement(lucide[name], { color, size: 256, strokeWidth: 2 }));
  return "image/png;base64," + (await sharp(Buffer.from(svg.includes('xmlns=') ? svg : svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"'))).png().toBuffer()).toString("base64");
}
const pxSize = (p) => sharp(p).metadata().then((m) => ({ w: m.width, h: m.height }));

(async () => {
  const IMG = {
    coverAccent: await accentPng({ wIn: 5.8, hIn: H, sizeIn: 6.2, xIn: 0.3, yIn: 0, ribbon: "#ffffff", opacity: 0.2 }),
    dividerAccent: await accentPng({ wIn: 5.8, hIn: H, sizeIn: 6.2, xIn: 0.3, yIn: 0, ribbon: "#3a6cf4", opacity: 0.12 }),
    icon: fileData(path.join(BRAND, "logo/png/icon-rounded-256.png")),
    qr: fileData(path.join(BRAND, "presentation/qr-portfolio.png")),
  };

  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";
  pres.title = "Irsyad slides template";
  pres.author = INFO.name;
  pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };


  /* ---------------------------------------------------------------- layouts */
  const footer = [
    { image: { data: IMG.icon, x: 0.6, y: 6.86, w: 0.3, h: 0.3 } },
    { text: { text: INFO.name, options: { x: 1.0, y: 6.86, w: 5, h: 0.3, fontSize: 10, color: COL.muted, margin: 0, valign: "middle" } } },
  ];
  pres.defineSlideMaster({
    title: "Cover", background: { color: COL.brand },
    objects: [
      { image: { data: IMG.coverAccent, x: W - 5.8, y: 0, w: 5.8, h: H } },
      { image: { data: IMG.icon, x: 0.8, y: 6.2, w: 0.5, h: 0.5 } },
      { text: { text: INFO.name, options: { x: 1.45, y: 6.18, w: 5.5, h: 0.3, fontSize: 13, bold: true, color: COL.white, margin: 0 } } },
      { text: { text: INFO.role, options: { x: 1.45, y: 6.46, w: 5.5, h: 0.28, fontSize: 11, color: COL.white, margin: 0, transparency: 15 } } },
      { placeholder: { options: { name: "eyebrow", type: "body", align: "left", x: 0.8, y: 1.6, w: 7.2, h: 0.4, fontSize: 14, bold: true, color: COL.sun, margin: 0 }, text: "" } },
      { placeholder: { options: { name: "title", type: "title", align: "left", x: 0.8, y: 2.05, w: 7.4, h: 2.2, fontSize: 48, bold: true, color: COL.white, valign: "top", margin: 0 }, text: "" } },
      { placeholder: { options: { name: "body", type: "body", align: "left", x: 0.8, y: 4.35, w: 7.0, h: 0.9, fontSize: 18, color: COL.white, valign: "top", margin: 0 }, text: "" } },
    ],
  });
  pres.defineSlideMaster({
    title: "Section", background: { color: COL.soft },
    objects: [
      { image: { data: IMG.dividerAccent, x: W - 5.8, y: 0, w: 5.8, h: H } },
      { placeholder: { options: { name: "number", type: "body", align: "left", x: 0.8, y: 2.0, w: 4, h: 1.4, fontSize: 80, bold: true, color: COL.brand, margin: 0, valign: "bottom" }, text: "" } },
      { placeholder: { options: { name: "title", type: "title", align: "left", x: 0.8, y: 3.5, w: 7.2, h: 1.0, fontSize: 40, bold: true, color: COL.ink, margin: 0, valign: "top" }, text: "" } },
      { placeholder: { options: { name: "body", type: "body", align: "left", x: 0.8, y: 4.5, w: 6.6, h: 0.9, fontSize: 16, color: COL.muted, margin: 0, valign: "top" }, text: "" } },
    ],
  });
  pres.defineSlideMaster({
    title: "Content", background: { color: COL.white },
    objects: [...footer, { placeholder: { options: { name: "title", type: "title", align: "left", x: 0.6, y: 0.45, w: 12.1, h: 0.85, fontSize: 32, bold: true, color: COL.ink, margin: 0, valign: "middle" }, text: "" } }],
    slideNumber: { x: 12.2, y: 6.86, w: 0.5, h: 0.3, fontSize: 10, color: COL.muted, align: "right" },
  });
  pres.defineSlideMaster({
    title: "Closing", background: { color: COL.brand },
    objects: [
      { image: { data: IMG.coverAccent, x: W - 5.8, y: 0, w: 5.8, h: H } },
      { placeholder: { options: { name: "title", type: "title", align: "left", x: 0.8, y: 1.3, w: 7.0, h: 1.2, fontSize: 54, bold: true, color: COL.white, margin: 0, valign: "top" }, text: "" } },
      { placeholder: { options: { name: "body", type: "body", align: "left", x: 0.8, y: 2.5, w: 6.5, h: 0.6, fontSize: 20, color: COL.white, margin: 0, valign: "top" }, text: "" } },
    ],
  });

  /* ----------------------------------------------------------------- slides */
  // 1 cover
  pres.addSection({ title: "Opening" });
  let s = pres.addSlide({ masterName: "Cover", sectionTitle: "Opening" });
  s.addText("CASE STUDY", { placeholder: "eyebrow", charSpacing: 2 });
  s.addText("Customer Retention Analysis", { placeholder: "title" });
  s.addText("Why first-time buyers don't come back, and what to do about it", { placeholder: "body" });
  s.addNotes("Template cover. Replace the eyebrow, title and subtitle. Name and role sit on the layout.");

  // 2 section divider
  s = pres.addSlide({ masterName: "Section", sectionTitle: "Opening" });
  s.addText("01", { placeholder: "number" });
  s.addText("The problem", { placeholder: "title" });
  s.addText("What the business asked, and what the data looked like on day one", { placeholder: "body" });

  // 3 problem / approach / result
  pres.addSection({ title: "Case study" });
  s = pres.addSlide({ masterName: "Content", sectionTitle: "Case study" });
  s.addText("From messy orders to one clean view", { placeholder: "title" });
  const cards = [
    ["Target", "Problem", "Orders arrived from four channels in four formats, so nobody trusted the monthly numbers."],
    ["Route", "Approach", "Standardised every order into one schema, then built cohort and repeat-purchase views."],
    ["TrendingUp", "Result", "One dashboard the team checks weekly, with retention tracked per cohort and channel."],
  ];
  for (let i = 0; i < 3; i++) {
    const x = 0.6 + i * 4.1, y = 1.75, w = 3.8, hh = 4.5;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h: hh, rectRadius: 0.18, fill: { color: COL.soft }, line: { color: COL.soft }, objectName: `card-${i + 1}` });
    s.addShape(pres.shapes.OVAL, { x: x + 0.4, y: y + 0.4, w: 0.8, h: 0.8, fill: { color: COL.brand }, line: { color: COL.brand }, objectName: `card-${i + 1}-icon-bg` });
    s.addImage({ data: await iconPng(cards[i][0]), x: x + 0.6, y: y + 0.6, w: 0.4, h: 0.4, objectName: `card-${i + 1}-icon` });
    s.addText(cards[i][1], { x: x + 0.4, y: y + 1.45, w: w - 0.8, h: 0.5, fontSize: 22, bold: true, color: COL.ink, margin: 0, isTextBox: true });
    s.addText(cards[i][2], { x: x + 0.4, y: y + 2.05, w: w - 0.8, h: 2.1, fontSize: 15, color: COL.muted, margin: 0, valign: "top", isTextBox: true, lineSpacingMultiple: 1.15 });
  }

  // 4 KPI
  s = pres.addSlide({ masterName: "Content", sectionTitle: "Case study" });
  s.addText("Impact at a glance", { placeholder: "title" });
  const kpis = [["320+", "orders standardised from Instagram, Shopee, Tokopedia and WhatsApp"], ["4 → 1", "channels merged into a single source of truth"], ["−80%", "time spent on the monthly report"]];
  for (let i = 0; i < 3; i++) {
    const x = 0.6 + i * 4.1;
    s.addText(kpis[i][0], { x, y: 2.55, w: 3.8, h: 1.3, fontSize: 66, bold: true, color: i === 0 ? COL.brand : COL.ink, margin: 0, valign: "bottom", isTextBox: true });
    s.addText(kpis[i][1], { x, y: 4.0, w: 3.5, h: 1.2, fontSize: 16, color: COL.muted, margin: 0, valign: "top", isTextBox: true });
  }
  s.addNotes("Example numbers. Replace with the real figures from your case study.");

  // 5 highlight bar chart
  s = pres.addSlide({ masterName: "Content", sectionTitle: "Case study" });
  s.addText("Repeat purchase is lowest in the March cohort", { placeholder: "title" });
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const rate = [34, 31, 18, 29, 33, 36];
  s.addChart(pres.charts.BAR, [{ name: "Repeat purchase rate (%)", labels: months, values: rate }], {
    x: 0.6, y: 1.6, w: 7.9, h: 4.9, barDir: "col", barGapWidthPct: 60,
    chartColors: rate.map((v) => (v === Math.min(...rate) ? COL.brand : COL.rest)),
    showValue: true, dataLabelPosition: "outEnd", dataLabelColor: COL.ink, dataLabelFontSize: 12, dataLabelFontFace: "+mn-lt", dataLabelFormatCode: '0"%"',
    catAxisLabelColor: COL.muted, catAxisLabelFontFace: "+mn-lt", catAxisLabelFontSize: 12, catAxisLineShow: false,
    valAxisHidden: true, valGridLine: { style: "none" }, catGridLine: { style: "none" }, showLegend: false,
    showTitle: true, title: "Repeat purchase rate by first-order month (%)", titleFontSize: 13, titleColor: COL.muted, titleFontFace: "+mn-lt",
  });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 8.9, y: 1.75, w: 3.8, h: 2.75, rectRadius: 0.18, fill: { color: COL.soft }, line: { color: COL.soft }, objectName: "takeaway-card" });
  s.addText([{ text: "Takeaway", options: { bold: true, fontSize: 18, color: COL.ink, breakLine: true } }, { text: "March buyers came in through a one-off promo and almost half never returned. Retargeting them in week 2 is the cheapest win.", options: { fontSize: 15, color: COL.muted } }],
    { x: 9.25, y: 2.05, w: 3.1, h: 2.2, valign: "top", margin: 0, isTextBox: true, paraSpaceAfter: 8 });
  s.addNotes("Highlight pattern: one bar in brand blue, the rest in grey. Example data.");

  // 6 multi-series line chart
  s = pres.addSlide({ masterName: "Content", sectionTitle: "Case study" });
  s.addText("Shopee drives most of the growth", { placeholder: "title" });
  const channels = [["Shopee", [42, 48, 55, 61, 70, 78]], ["Tokopedia", [30, 32, 31, 35, 37, 40]], ["Instagram", [18, 22, 20, 25, 24, 28]], ["WhatsApp", [12, 13, 15, 14, 16, 17]]];
  s.addChart(pres.charts.LINE, channels.map(([name, values]) => ({ name, labels: months, values })), {
    x: 0.6, y: 1.6, w: 12.1, h: 4.95, chartColors: SERIES.slice(0, 4), lineSize: 2.25, lineDataSymbol: "circle", lineDataSymbolSize: 7,
    showLegend: true, legendPos: "t", legendFontSize: 12, legendColor: COL.ink, legendFontFace: "+mn-lt",
    catAxisLabelColor: COL.muted, valAxisLabelColor: COL.muted, catAxisLabelFontFace: "+mn-lt", valAxisLabelFontFace: "+mn-lt", catAxisLabelFontSize: 12, valAxisLabelFontSize: 12,
    valGridLine: { color: "E4E6EB", size: 0.75 }, catGridLine: { style: "none" }, valAxisLineShow: false,
    showTitle: true, title: "Orders per month by channel", titleFontSize: 13, titleColor: COL.muted, titleFontFace: "+mn-lt",
  });
  s.addNotes("Series follow the palette order: blue, orange, teal, coral. Example data.");

  // 7 process
  pres.addSection({ title: "About me" });
  s = pres.addSlide({ masterName: "Content", sectionTitle: "About me" });
  s.addText("How I work", { placeholder: "title" });
  const steps = [["Database", "Collect", "Pull orders, customers and events from every source into one place."], ["Eraser", "Clean", "Fix formats, remove duplicates and validate against the source systems."], ["ChartColumnIncreasing", "Analyse", "Answer the business question with cohorts, funnels and metrics."], ["Presentation", "Present", "Turn the findings into a dashboard and a decision someone can act on."]];
  for (let i = 0; i < 4; i++) {
    const x = 0.6 + i * 3.08;
    s.addShape(pres.shapes.OVAL, { x, y: 1.9, w: 0.9, h: 0.9, fill: { color: i === 3 ? COL.sun : COL.brand }, line: { color: i === 3 ? COL.sun : COL.brand }, objectName: `step-${i + 1}-icon-bg` });
    s.addImage({ data: await iconPng(steps[i][0], i === 3 ? "#15171c" : "#ffffff"), x: x + 0.22, y: 2.12, w: 0.46, h: 0.46, objectName: `step-${i + 1}-icon` });
    if (i < 3) s.addShape(pres.shapes.LINE, { x: x + 1.1, y: 2.35, w: 1.8, h: 0, line: { color: COL.line, width: 2, dashType: "dash" }, objectName: `step-${i + 1}-connector` });
    s.addText(`${i + 1}  ${steps[i][1]}`, { x, y: 3.1, w: 2.8, h: 0.5, fontSize: 20, bold: true, color: COL.ink, margin: 0, isTextBox: true });
    s.addText(steps[i][2], { x, y: 3.65, w: 2.7, h: 1.8, fontSize: 15, color: COL.muted, margin: 0, valign: "top", isTextBox: true, lineSpacingMultiple: 1.15 });
  }

  // 8 tools & skills (badge images from brand/badges)
  s = pres.addSlide({ masterName: "Content", sectionTitle: "About me" });
  s.addText("Tools & skills", { placeholder: "title" });
  const chipH = 0.42;
  async function chipRow(files, x0, y, maxX) {
    let x = x0;
    for (const f of files) {
      const p = path.join(BRAND, f);
      const { w, h } = await pxSize(p);
      const cw = (w / h) * chipH;
      if (x + cw > maxX) { x = x0; y += chipH + 0.14; }
      s.addImage({ data: fileData(p), x, y, w: cw, h: chipH, objectName: path.basename(f, "@2x.png") });
      x += cw + 0.12;
    }
    return y + chipH;
  }
  s.addText("TOOLS", { x: 0.6, y: 1.55, w: 4, h: 0.3, fontSize: 12, bold: true, color: COL.brand, charSpacing: 2, margin: 0, isTextBox: true });
  // tools: the website-style tiles with labels, 8 per row
  const tools = ["python", "sql", "postgresql", "pandas", "power-bi", "looker-studio", "google-sheets", "google-apps-script", "excel", "jupyter", "aws", "supabase", "git", "github"];
  const tileW = 1.42, tileH = tileW * 310 / 300;
  tools.forEach((t, i) => {
    const p = path.join(BRAND, `badges/tech/tile-labeled/${t}@2x.png`);
    s.addImage({ data: fileData(p), x: 0.27 + (i % 8) * 1.5, y: 1.85 + Math.floor(i / 8) * (tileH + 0.02), w: tileW, h: tileH, objectName: `tool-${t}` });
  });
  let y = 1.85 + 2 * tileH - 0.05;
  s.addText("SKILLS", { x: 0.6, y: y + 0.1, w: 4, h: 0.3, fontSize: 12, bold: true, color: COL.brand, charSpacing: 2, margin: 0, isTextBox: true });
  const skillFiles = fs.readdirSync(path.join(BRAND, "badges/skills")).filter((f) => f.endsWith("@2x.png"));
  const order = ["analytics", "data-automation", "bi-reporting", "data-systems"];
  skillFiles.sort((a, b) => order.indexOf(a.split("--")[0]) - order.indexOf(b.split("--")[0]));
  await chipRow(skillFiles.filter((f) => !/--(python|pandas|power-bi|looker-studio|google-sheets|sql)@/.test(f)).map((f) => `badges/skills/${f}`), 0.6, y + 0.48, 12.7);
  s.addNotes("Every badge is a separate image in brand/badges. Swap or reorder them freely.");

  // 9 closing
  s = pres.addSlide({ masterName: "Closing", sectionTitle: "About me" });
  s.addText("Thank you", { placeholder: "title" });
  s.addText("Let's turn your data into decisions.", { placeholder: "body" });
  s.addText([
    { text: INFO.email, options: { breakLine: true } },
    { text: INFO.linkedin, options: { breakLine: true } },
    { text: INFO.url },
  ], { x: 0.8, y: 3.6, w: 5.2, h: 1.3, fontSize: 16, color: COL.white, margin: 0, valign: "top", isTextBox: true, paraSpaceAfter: 6 });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.8, y: 5.05, w: 1.7, h: 1.7, rectRadius: 0.14, fill: { color: COL.white }, line: { color: COL.white }, objectName: "qr-card" });
  s.addImage({ data: IMG.qr, x: 0.9, y: 5.15, w: 1.5, h: 1.5, objectName: "qr-portfolio", altText: "QR code to irsyadmuhf.vercel.app" });
  s.addText("Scan for the full portfolio", { x: 2.75, y: 5.6, w: 3.5, h: 0.6, fontSize: 13, color: COL.white, margin: 0, valign: "middle", isTextBox: true });

  /* ------------------------------------------------------------ write + theme */
  const out = path.join(BRAND, "presentation/irsyad-slides-template.pptx");
  await pres.writeFile({ fileName: out });
  // pptxgenjs can't write theme colours or fonts: patch theme1.xml directly
  const zip = await JSZip.loadAsync(fs.readFileSync(out));
  const tPath = "ppt/theme/theme1.xml";
  let t = await zip.file(tPath).async("string");
  const clr = Object.entries(THEME.colors).map(([k, v]) => `<a:${k}><a:srgbClr val="${v}"/></a:${k}>`).join("");
  t = t.replace(/<a:clrScheme name="[^"]*">[\s\S]*?<\/a:clrScheme>/, `<a:clrScheme name="${THEME.name}">${clr}</a:clrScheme>`)
       .replace(/(<a:majorFont>\s*<a:latin typeface=")[^"]*"/, `$1${THEME.headFontFace}"`)
       .replace(/(<a:minorFont>\s*<a:latin typeface=")[^"]*"/, `$1${THEME.bodyFontFace}"`)
       .replace(/(<a:theme [^>]*name=")[^"]*"/, `$1${THEME.name}"`);
  zip.file(tPath, t);
  // drop folder entries: cloud services (OneDrive, SharePoint) refuse decks that have them
  for (const [name, entry] of Object.entries(zip.files)) if (entry.dir) delete zip.files[name];
  fs.writeFileSync(out, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
  console.log("wrote", out);
})();
