"use client";

import { useActionState } from "react";
import { loginAction } from "../auth-actions";

export interface Notice {
  kind: "info" | "error";
  text: string;
}

const INPUT_CLASS =
  "w-full rounded-lg border border-navy-300 bg-white px-3 py-2 text-sm text-navy-900 placeholder:text-navy-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100";

export default function LoginForm({
  notice,
  next,
}: {
  notice?: Notice;
  next?: string;
}) {
  const [state, formAction, pending] = useActionState(loginAction, {
    error: null,
  });

  const message = state.error ?? notice?.text;
  const isError = Boolean(state.error) || notice?.kind === "error";

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />

      {message ? (
        <p
          role="alert"
          className={
            isError
              ? "rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              : "rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-700"
          }
        >
          {message}
        </p>
      ) : null}

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-navy-700"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className={`mt-1 ${INPUT_CLASS}`}
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-navy-700"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={`mt-1 ${INPUT_CLASS}`}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
