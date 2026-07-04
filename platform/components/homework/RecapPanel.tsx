"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown } from "lucide-react";

/**
 * Deaf: collapsible written recap of everything covered so far, so nothing
 * relies on remembering something that was only said out loud.
 */
export default function RecapPanel({ items }: { items: string[] }) {
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;

  return (
    <section
      aria-label="What we've covered"
      className="rounded-xl border border-teal-200 bg-teal-50 shadow-sm"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 rounded-xl px-5 py-3 text-left font-semibold text-teal-900 hover:bg-teal-100/60 focus:outline-2 focus:outline-offset-2 focus:outline-teal-600"
      >
        <span className="inline-flex items-center gap-2">
          <CheckCircle2 size={18} aria-hidden="true" className="text-teal-700" />
          What we&apos;ve covered ({items.length})
        </span>
        <ChevronDown
          size={18}
          aria-hidden="true"
          className={`transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <ol className="space-y-2 border-t border-teal-200 px-5 py-4">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-teal-950">
              <span
                aria-hidden="true"
                className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-teal-600 font-mono text-xs font-bold text-white"
              >
                {i + 1}
              </span>
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
