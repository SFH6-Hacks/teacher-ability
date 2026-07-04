"use client";

import { useEffect, useState } from "react";

const SECONDS = 20;

/**
 * ADHD interstitial shown after every 3rd card: a short movement break with
 * a countdown ring. Continue is always available — the timer is a suggestion.
 */
export default function BrainBreak({ onContinue }: { onContinue: () => void }) {
  const [left, setLeft] = useState(SECONDS);

  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  const pct = (SECONDS - left) / SECONDS;
  const R = 44;
  const C = 2 * Math.PI * R;

  return (
    <section
      aria-label="Brain break"
      className="flex flex-col items-center gap-6 rounded-2xl border-2 border-neutral-300 bg-white p-10 text-center shadow-sm"
    >
      <div className="relative flex items-center justify-center">
        <svg width="120" height="120" viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r={R} fill="none" stroke="#e5e5e5" strokeWidth="8" />
          <circle
            cx="60"
            cy="60"
            r={R}
            fill="none"
            stroke="#F59E0B"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - pct)}
            transform="rotate(-90 60 60)"
            className="transition-[stroke-dashoffset] duration-1000 ease-linear motion-reduce:transition-none"
          />
        </svg>
        <span className="absolute text-3xl" aria-hidden="true">
          🧘
        </span>
      </div>
      <div>
        <h2 className="text-2xl font-bold">Brain break!</h2>
        <p className="mt-2 text-lg text-neutral-700">
          Stand up and stretch for 20 seconds. You&apos;ve earned it.
        </p>
      </div>
      <p className="font-mono text-lg text-neutral-500" aria-live="polite">
        {left > 0 ? `${left}s` : "Ready when you are"}
      </p>
      <button
        type="button"
        onClick={onContinue}
        className="rounded-lg bg-amber-500 px-8 py-3 text-base font-semibold text-neutral-950 hover:bg-amber-400 focus:outline-2 focus:outline-offset-2 focus:outline-amber-600"
      >
        {left > 0 ? "Skip break — keep going" : "Continue"}
      </button>
    </section>
  );
}
