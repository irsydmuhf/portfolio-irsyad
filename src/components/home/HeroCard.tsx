import type { CSSProperties, ReactNode } from "react";
import type { SimpleIcon } from "simple-icons";
import { siPandas, siPostgresql, siPython } from "simple-icons";
import { ChartColumnIncreasing } from "lucide-react";

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

function Monitor({ roleLine }: { roleLine: string }) {
  return (
    <div className="relative mx-auto w-[min(80vw,500px)]">
      {/* antenna bump */}
      <div className="absolute -top-5 left-1/2 h-8 w-28 -translate-x-1/2 rounded-t-[2rem] bg-brand-300 shadow-[inset_0_4px_0_rgba(255,255,255,.5)]" />

      {/* bezel */}
      <div className="relative rounded-[2.4rem] bg-gradient-to-b from-brand-400 to-brand-600 p-3.5 shadow-[inset_0_-12px_0_rgba(0,0,0,.18),inset_0_6px_0_rgba(255,255,255,.35),0_40px_50px_-28px_rgba(20,40,120,.75)] sm:p-5">
        {/* screen */}
        <div className="bg-dot-matrix relative overflow-hidden rounded-[1.6rem] bg-[#121418] px-6 pb-5 pt-8 shadow-[inset_0_0_0_3px_rgba(0,0,0,.6),inset_0_10px_30px_rgba(0,0,0,.6)] sm:px-10 sm:pb-6 sm:pt-10">
          <p className="font-display text-[clamp(3rem,13vw,6.25rem)] font-black leading-[0.86] tracking-tight text-white [text-shadow:0_4px_0_rgba(0,0,0,.45)]">
            PORT
            <br />
            FOLIO
          </p>
          <p className="mt-4 truncate font-mono text-[11px] text-brand-300 sm:text-xs">
            <span className="text-mint-300">&gt;</span> SELECT insight FROM data
            <span className="animate-blink ml-0.5 inline-block h-3 w-1.5 translate-y-0.5 bg-brand-300" />
          </p>
          {/* screen glare */}
          <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-56 rotate-12 rounded-full bg-white/5 blur-xl" />
        </div>

        {/* sticky note */}
        <div className="absolute -top-4 right-4 rotate-[8deg] sm:-top-5 sm:right-8">
          <div className="absolute -top-2 left-1/2 h-4 w-10 -translate-x-1/2 -rotate-6 bg-white/70" />
          <div className="w-28 bg-sun-400 px-3 py-2.5 text-center text-balance font-display text-[11px] font-semibold leading-tight text-ink shadow-[0_8px_14px_-6px_rgba(0,0,0,.35)] sm:w-32 sm:text-xs">
            {roleLine || "Data Analyst & Engineer"}
          </div>
        </div>

        {/* scalloped badge, left */}
        <div className="absolute -left-7 top-[38%] hidden -rotate-12 sm:block">
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

        {/* side knob, right */}
        <div className="absolute -right-9 top-[40%] hidden h-[4.5rem] w-[4.5rem] place-items-center rounded-full bg-gradient-to-br from-white to-charcoal-300 shadow-[0_10px_18px_-8px_rgba(0,0,0,.45),inset_0_-4px_0_rgba(0,0,0,.12)] sm:grid">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-brand-500 shadow-[inset_0_3px_6px_rgba(0,0,0,.35)]">
            <div className="h-3 w-3 rounded-full bg-brand-200" />
          </div>
        </div>

        {/* red tag */}
        <div className="absolute -right-3 bottom-10 hidden rotate-[-18deg] rounded-md bg-coral-500 px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-wider text-white shadow-md sm:block">
          Insights ›
        </div>
      </div>

      {/* neck + printer slot */}
      <div className="relative mx-auto h-12 w-44 sm:h-14 sm:w-56">
        <div
          className="absolute inset-0 bg-gradient-to-b from-brand-500 to-brand-600"
          style={{ clipPath: "polygon(18% 0, 82% 0, 100% 100%, 0 100%)" }}
        />
        <div className="absolute bottom-3 left-1/2 h-1.5 w-28 -translate-x-1/2 rounded-full bg-[#0e1a3f] sm:w-32" />
        {/* LEDs */}
        <div className="absolute -right-16 bottom-1 hidden gap-1.5 sm:flex">
          <span className="h-3 w-4 rounded-sm bg-coral-500 shadow-[inset_0_-2px_0_rgba(0,0,0,.25)]" />
          <span className="h-3 w-4 rounded-sm bg-[#3ccf6a] shadow-[inset_0_-2px_0_rgba(0,0,0,.25)]" />
          <span className="h-3 w-4 rounded-sm bg-brand-500 shadow-[inset_0_-2px_0_rgba(0,0,0,.25)]" />
        </div>
      </div>
    </div>
  );
}

/** The "report" sliding out of the printer slot: a tiny dashboard printout. */
function Receipt() {
  const bars = [38, 62, 45, 80, 58, 92];
  return (
    <div className="animate-print absolute left-1/2 top-0 z-10 w-32 -translate-x-1/2 sm:w-40">
      <div className="rotate-[-6deg] rounded-b-md bg-white px-3 pb-4 pt-3 shadow-[0_14px_20px_-10px_rgba(0,0,0,.35)] ring-1 ring-black/5">
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
    </div>
  );
}

/* -------------------------------------------------------------------- hero */

export default function HeroCard({
  name,
  availability,
  location,
  roleLine,
}: {
  name: string;
  roleLine: string;
  availability: string;
  location: string;
}) {
  const year = String(new Date().getFullYear());
  const firstName = name.split(" ")[0] ?? name;

  return (
    <section
      aria-labelledby="hero-title"
      className="rounded-[2.5rem] bg-white p-2.5 shadow-[0_30px_60px_-40px_rgba(30,60,140,.45)] ring-1 ring-black/5 sm:p-4"
    >
      <h1 id="hero-title" className="sr-only">
        {name} — {roleLine || "Data Analyst & Data Engineer"} Portfolio
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
        <div aria-hidden="true" className="relative z-10 mt-14 sm:mt-16">
          <Monitor roleLine={roleLine} />

          {/* desk block */}
          <div className="relative mx-auto h-32 w-[min(92%,680px)] sm:h-44">
            <div className="bg-grid-fine absolute inset-0 rounded-t-2xl bg-white shadow-[inset_0_6px_0_rgba(255,255,255,1),inset_0_-30px_40px_-30px_rgba(60,90,170,.25)] ring-1 ring-black/5" />
            <div className="absolute inset-x-0 top-0 h-3 rounded-t-2xl bg-gradient-to-b from-white to-[#eef1f7]" />
            <Receipt />

            {/* mouse */}
            <div className="absolute -top-6 left-[12%] h-9 w-16 rounded-[50%] bg-gradient-to-b from-brand-400 to-brand-600 shadow-[inset_0_-4px_0_rgba(0,0,0,.2),0_8px_12px_-6px_rgba(20,40,120,.5)] sm:left-[16%] sm:h-10 sm:w-20" />

            {/* mug */}
            <div className="absolute -top-14 right-[14%] hidden sm:block">
              <div className="relative h-16 w-12 rounded-b-xl rounded-t-md bg-white shadow-[inset_-6px_0_0_rgba(0,0,0,.06),0_10px_14px_-8px_rgba(0,0,0,.35)] ring-1 ring-black/5">
                <div className="absolute inset-x-0 top-5 h-4 bg-coral-500" />
                <div className="absolute -right-3 top-4 h-7 w-4 rounded-r-full border-4 border-l-0 border-white" />
              </div>
            </div>

            {/* name plate */}
            <div className="absolute bottom-5 right-[8%] rounded-xl bg-brand-500 p-1 shadow-[inset_0_-4px_0_rgba(0,0,0,.2),0_8px_14px_-8px_rgba(20,40,120,.6)] sm:bottom-8">
              <div className="rounded-lg border-2 border-white/90 px-3 py-1 font-display text-sm font-extrabold uppercase tracking-wide text-white sm:px-4 sm:text-lg">
                {firstName}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
