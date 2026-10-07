"use client";

import { useState } from "react";

/** Lazy image with a graceful fallback when the source is missing or broken. */
export default function SafeImage({
  src,
  alt,
  eager = false,
  className = "",
}: {
  src: string;
  alt: string;
  eager?: boolean;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);

  if (broken) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex min-h-32 items-center justify-center bg-navy-100 p-4 text-center text-sm text-navy-500 ${className}`}
      >
        Image unavailable
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => setBroken(true)}
      className={className}
    />
  );
}
