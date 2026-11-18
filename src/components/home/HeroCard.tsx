import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import type { SimpleIcon } from "simple-icons";
import { siPandas, siPostgresql, siPython } from "simple-icons";
import { ChartColumnIncreasing } from "lucide-react";
import type { PrinterProject } from "@/lib/content/schema";

const NAV = [
  { href: "#about", label: "About" },
  { href: "#experience", label: "Experience" },
  { href: "#projects", label: "Projects" },
  { href: "#contact", label: "Contact" },
];

/* ------------------------------------------------------------------ keycap */

function Keycap({
  face,
  depth,
  className = "",
  style,
  size,
  children,
}: {
  face: string;
  depth: string;
  className?: string;
  style?: CSSProperties;
  size: number;
  children: ReactNode;
}) {
  return (
    <div className={`absolute ${className}`} style={style}>
      <div
        className="relative grid place-items-center"
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.24,
          background: depth,
          boxShadow: `0 ${size * 0.28}px ${size * 0.35}px -${size * 0.18}px rgba(20,40,110,.45)`,
        }}
      >
        {/* top face */}
        <div
          className="absolute grid place-items-center"
          style={{
            inset: `${size * 0.06}px ${size * 0.08}px ${size * 0.16}px`,
            borderRadius: size * 0.2,
            background: face,
            boxShadow: "inset 0 3px 0 rgba(255,255,255,.55), inset 0 -2px 6px rgba(0,0,0,.08)",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function LogoGlyph({ icon, size, color }: { icon: SimpleIcon; size: number; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" style={{ width: size, height: size }} aria-hidden="true">
      <path d={icon.path} fill={color ?? `#${icon.hex}`} />
    </svg>
  );
}

/* ----------------------------------------------------------------- monitor */

export interface HeroScreen {
  line1: string;
  line2: string;
  query: string;
}

export interface HeroTag {
  text: string;
  url: string;
}

const DEFAULT_SCREEN: HeroScreen = { line1: "PORTO", line2: "FOLIO", query: "SELECT insight FROM data" };
const DEFAULT_TAG: HeroTag = { text: "Insights", url: "" };

/** Shrinks the screen title as lines get longer so they stay inside the screen. */
function titleFontSize(lines: string[]): string {
  const longest = Math.max(5, ...lines.map((l) => l.length));
  const k = 5 / longest;
  return `clamp(${(3 * k).toFixed(2)}rem, ${(13 * k).toFixed(2)}vw, ${(6.25 * k).toFixed(2)}rem)`;
}

/** Red tag on the monitor's right edge. Empty text hides it; a URL makes it a link. */
function RedTag({ tag }: { tag: HeroTag }) {
  const text = tag.text.trim();
  if (!text) return null;
  const cls =
    "absolute -right-3 bottom-10 hidden rotate-[-18deg] rounded-md bg-coral-500 px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-wider text-white shadow-md sm:block";
  const url = tag.url.trim();
  if (!url) {
    return (
      <div aria-hidden="true" className={cls}>
        {text} ›
      </div>
    );
  }
  const external = /^https?:\/\//i.test(url);
  const linkCls = `${cls} transition-transform hover:rotate-[-12deg] hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white`;
  return external ? (
    <a href={url} target="_blank" rel="noopener noreferrer" className={linkCls}>
      {text} ›
    </a>
  ) : url.startsWith("/") ? (
    <Link href={url} className={linkCls}>
      {text} ›
    </Link>
  ) : (
    <a href={url} className={linkCls}>
      {text} ›
    </a>
  );
}

function Monitor({
  roleLine,
  printerProject,
  screen,
  tag,
}: {
  roleLine: string;
  printerProject: PrinterProject | null;
  screen: HeroScreen;
  tag: HeroTag;
}) {
  // Both title lines empty would leave a blank screen, so fall back to the default.
  const lines = [screen.line1, screen.line2].filter((l) => l.trim());
  const titleLines = lines.length > 0 ? lines : [DEFAULT_SCREEN.line1, DEFAULT_SCREEN.line2];
  return (
    <div className="relative z-20 mx-auto w-[min(80vw,500px)]">
      {/* antenna bump */}
      <div aria-hidden="true" className="absolute -top-5 left-1/2 h-8 w-28 -translate-x-1/2 rounded-t-[2rem] bg-brand-300 shadow-[inset_0_4px_0_rgba(255,255,255,.5)]" />

      {/* bezel: its decorative children are hidden one by one, because the red tag and the printer paper can be links */}
      <div className="relative rounded-[2.4rem] bg-gradient-to-b from-brand-400 to-brand-600 p-3.5 shadow-[inset_0_-12px_0_rgba(0,0,0,.18),inset_0_6px_0_rgba(255,255,255,.35),0_40px_50px_-28px_rgba(20,40,120,.75)] sm:p-5">
        {/* screen */}
        <div aria-hidden="true" className="bg-dot-matrix relative overflow-hidden rounded-[1.6rem] bg-[#121418] px-6 pb-5 pt-8 shadow-[inset_0_0_0_3px_rgba(0,0,0,.6),inset_0_10px_30px_rgba(0,0,0,.6)] sm:px-10 sm:pb-6 sm:pt-10">
          <p
            className="font-display font-black uppercase leading-[0.86] tracking-tight text-white [text-shadow:0_4px_0_rgba(0,0,0,.45)]"
            style={{ fontSize: titleFontSize(titleLines) }}
          >
            {titleLines.map((line, i) => (
              <span key={i} className="block">
                {line}
              </span>
            ))}
          </p>
          {screen.query ? (
            <p className="mt-4 truncate font-mono text-[11px] text-brand-300 sm:text-xs">
              <span className="text-mint-300">&gt;</span> {screen.query}
              <span className="animate-blink ml-0.5 inline-block h-3 w-1.5 translate-y-0.5 bg-brand-300" />
            </p>
          ) : null}
          {/* screen glare */}
          <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-56 rotate-12 rounded-full bg-white/5 blur-xl" />
        </div>

        {/* sticky note */}
        <div aria-hidden="true" className="absolute -top-4 right-4 rotate-[8deg] sm:-top-5 sm:right-8">
          <div className="absolute -top-2 left-1/2 h-4 w-10 -translate-x-1/2 -rotate-6 bg-white/70" />
          <div className="w-28 bg-sun-400 px-3 py-2.5 text-center text-balance font-display text-[11px] font-semibold leading-tight text-ink shadow-[0_8px_14px_-6px_rgba(0,0,0,.35)] sm:w-32 sm:text-xs">
            {roleLine || "Data Analyst & Engineer"}
          </div>
        </div>

        {/* scalloped badge, left */}
        <div aria-hidden="true" className="absolute -left-7 top-[38%] hidden -rotate-12 sm:block">
          <div
            className="grid h-[4.5rem] w-[4.5rem] place-items-center bg-white shadow-[0_10px_18px_-8px_rgba(20,40,120,.5)]"
            style={{
              clipPath:
                "polygon(50% 0%, 61% 10%, 75% 6%, 80% 20%, 94% 25%, 90% 39%, 100% 50%, 90% 61%, 94% 75%, 80% 80%, 75% 94%, 61% 90%, 50% 100%, 39% 90%, 25% 94%, 20% 80%, 6% 75%, 10% 61%, 0% 50%, 10% 39%, 6% 25%, 20% 20%, 25% 6%, 39% 10%)",
            }}
          >
            <ChartColumnIncreasing className="h-7 w-7 text-brand-500" strokeWidth={2.5} />
          </div>
        </div>

        <SideDial />

        <RedTag tag={tag} />
      </div>

      <Stand project={printerProject} />
    </div>
  );
}

/**
 * Volume-style dial sticking out of the monitor's right side. The scene is
 * drawn straight-on, so the dial shows in profile: collar → knurled silver
 * barrel → dark lip → blue cap.
 */
function SideDial() {
  return (
    <div aria-hidden="true" className="absolute left-full top-[36%] hidden -translate-x-0.5 items-center sm:flex">
      {/* collar where the dial meets the case */}
      <div
        className="h-12 w-2 rounded-r-sm"
        style={{ background: "linear-gradient(to bottom,#d3d9e3,#8b94a6)" }}
      />
      {/* knurled silver barrel */}
      <div
        className="relative h-20 w-7 rounded-l-[4px] rounded-r-[10px] shadow-[0_12px_16px_-10px_rgba(0,0,0,.5)]"
        style={{
          background:
            "repeating-linear-gradient(to bottom,rgba(20,30,50,.07) 0 1px,transparent 1px 5px),linear-gradient(to bottom,#ffffff 0%,#eef1f6 26%,#c3c9d5 70%,#8f98aa 100%)",
        }}
      >
        <div className="absolute inset-x-1 top-2 h-2 rounded-full bg-white/80 blur-[1px]" />
      </div>
      {/* dark lip of the dial face */}
      <div className="-ml-1 h-[3.75rem] w-1.5 rounded-r-full bg-[#1b1f2a]" />
      {/* blue cap */}
      <div
        className="-ml-px h-10 w-2.5 rounded-r-full"
        style={{ background: "linear-gradient(to bottom,#9db8ff,#3a6cf4 55%,#1f42ad)" }}
      />
    </div>
  );
}

/** Neck + base. The base carries the printer slot and the three buttons. */
function Stand({ project }: { project: PrinterProject | null }) {
  return (
    <div className="relative flex flex-col items-center">
      {/* neck */}
      <div
        aria-hidden="true"
        className="h-6 w-32 bg-gradient-to-b from-brand-700 to-brand-500 sm:h-7 sm:w-40"
        style={{ clipPath: "polygon(14% 0, 86% 0, 100% 100%, 0 100%)" }}
      />

      {/* base */}
      <div className="relative h-12 w-56 sm:h-16 sm:w-80">
        {/* contact shadow on the desk */}
        <div aria-hidden="true" className="absolute -bottom-1.5 inset-x-3 h-4 rounded-[50%] bg-brand-900/35 blur-[4px]" />
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden rounded-b-lg rounded-t-xl bg-gradient-to-b from-brand-500 to-brand-600 shadow-[inset_0_-5px_0_rgba(0,0,0,.18)]">
          {/* top face, seen slightly from above */}
          <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-b from-brand-300 to-brand-400 sm:h-2.5" />
        </div>

        {/* printer slot */}
        <div aria-hidden="true" className="absolute left-1/2 top-3.5 h-2 w-32 -translate-x-1/2 rounded-full bg-[#0e1a3f] shadow-[inset_0_2px_3px_rgba(0,0,0,.6),0_1px_0_rgba(255,255,255,.3)] sm:top-5 sm:h-2.5 sm:w-44" />

        {/* buttons */}
        <div aria-hidden="true" className="absolute bottom-2 right-2 flex gap-1 rounded-md bg-brand-800/45 p-1 shadow-[inset_0_1px_2px_rgba(0,0,0,.3)] sm:bottom-3 sm:right-3 sm:gap-1.5">
          {["bg-coral-500", "bg-[#3ccf6a]", "bg-brand-300"].map((color) => (
            <span
              key={color}
              className={`h-2 w-3 rounded-[3px] sm:h-3 sm:w-[18px] ${color} shadow-[inset_0_1px_0_rgba(255,255,255,.55),inset_0_-2px_0_rgba(0,0,0,.25)]`}
            />
          ))}
        </div>

        <Receipt project={project} />
      </div>
    </div>
  );
}

const PAPER =
  "origin-top rotate-[-4deg] rounded-b-md bg-white px-2.5 pb-3 pt-3 shadow-[0_14px_20px_-10px_rgba(0,0,0,.35)] ring-1 ring-black/5 sm:px-3 sm:pb-4";

/** Default paper (no project picked): a tiny dashboard printout. Decorative. */
function DefaultPaper() {
  const bars = [38, 62, 45, 80, 58, 92];
  return (
    <div aria-hidden="true" className={PAPER}>
      <p className="text-[7px] font-bold uppercase tracking-wider text-ink sm:text-[8px]">
        Monthly Report
      </p>
      <div className="mt-2 flex h-10 items-end gap-1 sm:h-12">
        {bars.map((h, i) => (
          <span
            key={i}
            className={`flex-1 rounded-t-sm ${i === bars.length - 1 ? "bg-coral-500" : "bg-brand-400"}`}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <div className="mt-2 space-y-1">
        <div className="h-1 w-full rounded bg-charcoal-200" />
        <div className="h-1 w-4/5 rounded bg-charcoal-200" />
        <div className="h-1 w-3/5 rounded bg-charcoal-200" />
      </div>
      <div className="mt-2 flex justify-between text-[7px] font-semibold text-charcoal-500">
        <span>GMV</span>
        <span className="text-[#2bab5a]">▲ 24%</span>
      </div>
    </div>
  );
}

/**
 * Paper for the project picked in admin. Text always sits on the white paper,
 * never over the thumbnail, so it stays readable whatever the image looks like.
 * The thumbnail gets its own hairline ring so a white screenshot doesn't melt
 * into the paper. Links to the case study.
 */
function ProjectPaper({ project }: { project: PrinterProject }) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      aria-label={`Featured project: ${project.title}`}
      className={`${PAPER} pointer-events-auto block transition-transform duration-300 hover:-translate-y-0.5 hover:rotate-[-2deg] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600`}
    >
      <p className="text-[7px] font-bold uppercase tracking-wider text-brand-600 sm:text-[8px]">
        Featured project
      </p>
      {/* gradient shows through if the image fails to load (no broken icon) */}
      <div className="relative mt-1.5 aspect-[16/10] overflow-hidden rounded-[5px] bg-gradient-to-br from-brand-400 to-brand-600 ring-1 ring-black/15">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${JSON.stringify(project.coverUrl)})` }}
        />
      </div>
      <p className="mt-1.5 line-clamp-2 font-display text-[9px] font-extrabold leading-tight text-ink sm:text-[11px]">
        {project.title}
      </p>
      {project.category && (
        <p className="mt-0.5 truncate text-[6px] font-bold uppercase tracking-wider text-charcoal-500 sm:text-[7px]">
          {project.category}
        </p>
      )}
      <div className="mt-2 space-y-1" aria-hidden="true">
        <div className="h-1 w-full rounded bg-charcoal-200" />
        <div className="h-1 w-3/5 rounded bg-charcoal-200" />
      </div>
    </Link>
  );
}

/**
 * The paper sliding out of the printer slot. The wrapper starts at the slot's
 * centre line and clips, so the paper looks fed out of the slot rather than
 * pasted over it. The wrapper ignores the pointer; only the link opts back in.
 */
function Receipt({ project }: { project: PrinterProject | null }) {
  return (
    <div className="pointer-events-none absolute left-1/2 top-[18px] z-10 h-72 w-36 -translate-x-1/2 overflow-hidden sm:top-[25px] sm:w-52">
      <div className="animate-print mx-auto w-28 sm:w-40">
        {project ? <ProjectPaper project={project} /> : <DefaultPaper />}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- desk */

/** Front-view mouse: a dome resting on the desk top. */
function Mouse() {
  return (
    <div className="absolute bottom-[38%] left-[calc(50%+11.5rem)] hidden sm:block">
      <div className="absolute -bottom-1 inset-x-0.5 h-2.5 rounded-[50%] bg-brand-900/30 blur-[3px]" />
      <div
        className="relative h-8 w-16 md:h-9 md:w-20"
        style={{
          borderRadius: "50% 50% 44% 44% / 88% 88% 12% 12%",
          background: "linear-gradient(to bottom,#7a9dff,#3a6cf4 55%,#2753d8)",
          boxShadow: "inset 0 3px 0 rgba(255,255,255,.35), inset 0 -4px 0 rgba(0,0,0,.2)",
        }}
      >
        {/* scroll wheel peeking over the top */}
        <div className="absolute left-1/2 top-0 h-2 w-1.5 -translate-x-1/2 -translate-y-1/3 rounded-full bg-brand-900" />
        <div className="absolute left-[20%] top-[22%] h-1.5 w-5 rounded-full bg-white/35 blur-[1px]" />
      </div>
    </div>
  );
}

/** Front-view mug standing on the desk top, rim tilted slightly toward us. */
function Mug() {
  return (
    <div className="absolute bottom-[32%] right-[calc(50%+11.5rem)] hidden sm:block">
      <div className="absolute -bottom-1.5 -left-1 h-3 w-[4.25rem] rounded-[50%] bg-brand-900/25 blur-[3px]" />
      {/* handle, tucked behind the body */}
      <div className="absolute -right-4 top-4 h-8 w-6 rounded-r-full border-[5px] border-l-0 border-[#e6ebf4]" />
      <div
        className="relative h-16 w-12 overflow-hidden rounded-b-[14px] rounded-t-[3px] shadow-[0_8px_12px_-8px_rgba(0,0,0,.35)]"
        style={{ background: "linear-gradient(to right,#ffffff 0%,#ffffff 50%,#dfe5f0 100%)" }}
      >
        <div className="absolute inset-x-0 top-6 h-4 bg-gradient-to-r from-coral-500 via-coral-500 to-coral-600" />
      </div>
      {/* rim + coffee */}
      <div className="absolute -top-1.5 left-0 h-3 w-12 rounded-[50%] bg-[#f3f6fb] ring-1 ring-black/5">
        <div className="absolute inset-x-[3px] inset-y-[2px] rounded-[50%] bg-gradient-to-b from-[#3f2414] to-[#7a4a2a]" />
      </div>
    </div>
  );
}

/**
 * Desk block: a shallow top surface (what the monitor, mouse and mug stand on)
 * over the gridded front face. Pulled up by half the top's depth so the
 * monitor base lands mid-surface.
 */
function Desk({ firstName }: { firstName: string }) {
  return (
    <div className="relative z-10 mx-auto -mt-3.5 w-[min(92%,680px)] sm:-mt-[18px]">
      {/* top surface */}
      <div
        className="h-7 bg-gradient-to-b from-[#e7ecf6] to-[#f7f9fe] sm:h-9"
        style={{ clipPath: "polygon(2.5% 0, 97.5% 0, 100% 100%, 0 100%)" }}
      />
      {/* front edge */}
      <div className="h-[3px] bg-white shadow-[0_1px_0_rgba(20,40,110,.08)]" />
      {/* front face */}
      <div className="bg-grid-fine relative h-28 bg-white shadow-[inset_0_-30px_40px_-30px_rgba(60,90,170,.25)] sm:h-36">
        {/* name plate */}
        <div className="absolute bottom-5 right-[8%] rounded-xl bg-brand-500 p-1 shadow-[inset_0_-4px_0_rgba(0,0,0,.2),0_8px_14px_-8px_rgba(20,40,120,.6)] sm:bottom-8">
          <div className="rounded-lg border-2 border-white/90 px-3 py-1 font-display text-sm font-extrabold uppercase tracking-wide text-white sm:px-4 sm:text-lg">
            {firstName}
          </div>
        </div>
      </div>

      {/* things standing on the top surface */}
      <div className="absolute inset-x-0 top-0 h-7 sm:h-9">
        <Mouse />
        <Mug />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- hero */

export default function HeroCard({
  name,
  availability,
  location,
  roleLine,
  printerProject = null,
  screen = DEFAULT_SCREEN,
  tag = DEFAULT_TAG,
}: {
  name: string;
  roleLine: string;
  availability: string;
  location: string;
  printerProject?: PrinterProject | null;
  screen?: HeroScreen;
  tag?: HeroTag;
}) {
  const year = String(new Date().getFullYear());
  const firstName = name.split(" ")[0] ?? name;

  return (
    <section
      aria-labelledby="hero-title"
      className="rounded-[2.5rem] bg-white p-2.5 shadow-[0_30px_60px_-40px_rgba(30,60,140,.45)] ring-1 ring-black/5 sm:p-4"
    >
      <h1 id="hero-title" className="sr-only">
        {name} — {roleLine || "Data Analyst & Data Engineer"} Portofolio
      </h1>

      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-b from-[#f5f8ff] via-[#dce6ff] to-[#7d9ffc]">
        {/* top bar */}
        <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 px-5 pt-5 sm:px-8 sm:pt-7">
          <div className="flex flex-wrap items-center gap-2">
            {availability && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold text-ink shadow-sm ring-1 ring-black/5 backdrop-blur">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#3ccf6a] opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#3ccf6a]" />
                </span>
                {availability}
              </span>
            )}
            {location && (
              <span className="hidden rounded-full bg-white/50 px-3 py-1.5 text-xs font-medium text-charcoal-700 sm:inline">
                Based in {location}
              </span>
            )}
          </div>
          <nav aria-label="Sections" className="flex gap-1 rounded-full bg-white/70 p-1 shadow-sm ring-1 ring-black/5 backdrop-blur">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-full px-3 py-1.5 text-xs font-semibold text-charcoal-700 transition-colors hover:bg-brand-500 hover:text-white"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        {/* giant year */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-[22%] flex select-none justify-between px-2 font-display text-[clamp(7rem,26vw,20rem)] font-black leading-none tracking-tighter text-brand-500/15 sm:px-6"
        >
          <span>{year.slice(0, 2)}</span>
          <span>{year.slice(2)}</span>
        </div>

        {/* floating keycaps */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10">
          <Keycap
            size={78}
            face="linear-gradient(160deg,#8fb4ff,#5b86fb)"
            depth="#2f5fe0"
            className="animate-float left-[9%] top-[17%] hidden rotate-[-14deg] md:block"
          >
            <LogoGlyph icon={siPython} size={34} color="#ffffff" />
          </Keycap>
          <Keycap
            size={104}
            face="linear-gradient(160deg,#ffc35c,#ff8a1f)"
            depth="#d9620b"
            className="animate-float-slow left-[4%] top-[48%] rotate-[-18deg] scale-75 sm:scale-100"
            style={{ animationDelay: "-2s" }}
          >
            <span className="font-display text-2xl font-extrabold text-[#8a3a00]/80">SQL</span>
          </Keycap>
          <Keycap
            size={60}
            face="linear-gradient(160deg,#ffffff,#e6ebf5)"
            depth="#b9c2d6"
            className="animate-float left-[19%] top-[76%] hidden rotate-[16deg] lg:block"
            style={{ animationDelay: "-4s" }}
          >
            <LogoGlyph icon={siPandas} size={26} />
          </Keycap>
          <Keycap
            size={76}
            face="linear-gradient(160deg,#ffffff,#e6ebf5)"
            depth="#b9c2d6"
            className="animate-float-slow right-[9%] top-[15%] hidden rotate-[12deg] md:block"
            style={{ animationDelay: "-1s" }}
          >
            <LogoGlyph icon={siPostgresql} size={36} />
          </Keycap>
          <Keycap
            size={112}
            face="linear-gradient(160deg,#8ff0ee,#3cc6c9)"
            depth="#1a9aa0"
            className="animate-float right-[3%] top-[45%] rotate-[14deg] scale-75 sm:scale-100"
            style={{ animationDelay: "-3s" }}
          >
            <span className="font-display text-5xl font-black text-[#0b5f63]/75">Σ</span>
          </Keycap>
        </div>

        {/* monitor on desk */}
        <div className="relative z-10 mt-14 sm:mt-16">
          <Monitor roleLine={roleLine} printerProject={printerProject} screen={screen} tag={tag} />
          <div aria-hidden="true">
            <Desk firstName={firstName} />
          </div>
        </div>
      </div>
    </section>
  );
}
