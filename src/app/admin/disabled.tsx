import Link from "next/link";

export default function AdminDisabled() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-2xl font-bold text-charcoal-900">Admin Disabled</h1>
      <p className="mt-2 text-charcoal-600">
        The admin panel is only available in development mode. Run{" "}
        <code className="rounded bg-charcoal-100 px-2 py-0.5 text-sm">
          npm run dev
        </code>{" "}
        to manage content locally.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block text-sm font-medium text-accent-600 hover:underline"
      >
        ← Back to portfolio
      </Link>
    </main>
  );
}
