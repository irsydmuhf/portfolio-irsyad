import Link from "next/link";
import BrandMark from "@/components/BrandMark";

export default function NotFound() {
  return (
    <main className="bg-dots relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4">
      {/* oversized logo accent, dot cropped by the top of the viewport */}
      <BrandMark
        className="pointer-events-none absolute right-[6%] top-0 w-[min(90vw,640px)] text-brand-500"
        ribbonOpacity={0.12}
      />
      <div className="relative flex flex-col items-center text-center">
        <h1 className="font-display text-[7rem] font-extrabold leading-none tracking-tight text-ink sm:text-[10rem]">
          404
        </h1>
        <p className="mt-2 font-display text-xl font-semibold text-ink sm:text-2xl">
          Page not found
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center rounded-full bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_-12px_rgba(39,83,216,.7)] transition-colors hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        >
          Back to Portofolio
        </Link>
      </div>
    </main>
  );
}
