import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <h1 className="text-6xl font-bold text-navy-900">404</h1>
      <p className="mt-4 text-xl text-navy-600">Page not found</p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center rounded-lg bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
      >
        Back to Portfolio
      </Link>
    </div>
  );
}
