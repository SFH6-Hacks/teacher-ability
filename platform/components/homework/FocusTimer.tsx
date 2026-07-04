"use client";

import { useEffect, useState } from "react";
import { Timer } from "lucide-react";

/**
 * ADHD: gentle elapsed-time chip for the current card. Deliberately
 * non-alarming — no red, no countdown, just quiet awareness of time.
 */
export default function FocusTimer({ resetKey }: { resetKey: number }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    setSeconds(0);
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [resetKey]);

  const m = Math.floor(seconds / 60);
  const s = seconds % 60;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-3 py-1 font-mono text-xs text-neutral-500"
      title="Time on this card"
    >
      <Timer size={12} aria-hidden="true" />
      {m}:{String(s).padStart(2, "0")}
    </span>
  );
}
