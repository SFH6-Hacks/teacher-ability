"use client";

import type { DeckPage } from "@/lib/useLessonDeck";

/** Renders one slide at 16:9 — a rendered PDF page, or a styled text slide. */
export function DeckCanvas({
  page,
  thumb,
  className,
}: {
  page: DeckPage;
  thumb?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`relative aspect-video w-full overflow-hidden rounded-xl bg-white ring-1 ring-black/10 ${className ?? ""}`}
    >
      {page.imageUrl ? (
        // rendered PDF page; a data: URL, so plain <img> not next/image
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={page.imageUrl}
          alt={page.title}
          className="h-full w-full object-contain"
        />
      ) : (
        <div className="flex h-full flex-col bg-gradient-to-br from-white to-stone-100 p-[6%]">
          <span className="h-1.5 w-10 rounded-full bg-teal-600" aria-hidden="true" />
          <h3
            className={`mt-[4%] font-bold leading-tight text-stone-900 ${
              thumb ? "text-[7px] leading-tight" : "text-2xl sm:text-3xl"
            }`}
          >
            {page.title}
          </h3>
          {!thumb && (
            <p className="mt-4 max-w-[48ch] text-sm leading-relaxed text-stone-600 sm:text-base">
              {page.text}
            </p>
          )}
          {!thumb && page.imageAlt && (
            <p className="mt-auto rounded-lg bg-white/70 p-2 text-xs italic text-stone-500">
              🖼 {page.imageAlt}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
