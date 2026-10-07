"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteProject, setFeatured } from "../../project-actions";
import { BTN_SECONDARY } from "./editors";

export function FeaturedToggle({
  id,
  featured,
}: {
  id: string;
  featured: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      aria-pressed={featured}
      onClick={() =>
        start(async () => {
          await setFeatured(id, !featured);
          router.refresh();
        })
      }
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors disabled:opacity-50 ${
        featured
          ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
      }`}
    >
      {featured ? "Featured" : "Not featured"}
    </button>
  );
}

export function RowActions({
  id,
  title,
  slug,
  published,
}: {
  id: string;
  title: string;
  slug: string;
  published: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function remove() {
    if (
      !window.confirm(
        `Delete "${title}" permanently?${
          published ? " Its public page will return 404." : ""
        } This cannot be undone.`
      )
    ) {
      return;
    }
    start(async () => {
      const res = await deleteProject(id);
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Link href={`/admin/projects/${id}/edit`} className={BTN_SECONDARY}>
        Edit
      </Link>
      <Link href={`/admin/projects/${id}/preview`} className={BTN_SECONDARY}>
        Preview
      </Link>
      {published ? (
        <Link href={`/projects/${slug}`} target="_blank" className={BTN_SECONDARY}>
          View
        </Link>
      ) : null}
      <button
        type="button"
        disabled={pending}
        onClick={remove}
        className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        {pending ? "Deleting…" : "Delete"}
      </button>
      {error ? (
        <p role="alert" className="w-full text-right text-xs text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
