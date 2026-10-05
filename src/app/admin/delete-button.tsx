"use client";

import { deleteProject } from "./actions";

export default function DeleteButton({ slug }: { slug: string }) {
  return (
    <form
      action={deleteProject.bind(null, slug)}
      onSubmit={(event) => {
        if (!window.confirm(`Delete project "${slug}"?`)) {
          event.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="rounded-lg border border-charcoal-200 px-3 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-50"
      >
        Delete
      </button>
    </form>
  );
}
