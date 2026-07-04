"use client";

import { useEffect, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import type { Profile } from "@/lib/types";

/**
 * Typewriter text ~30 chars/s. Renders instantly under reduced motion or for
 * blind students (the screen reader / TTS already delivers it in full).
 */
export function Typewriter({
  text,
  instant,
  className,
}: {
  text: string;
  instant?: boolean;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const skip = instant || reduced;
  const [shown, setShown] = useState({ text, count: skip ? text.length : 0 });

  // Render-phase adjustment: restart typing when the text changes.
  if (shown.text !== text) {
    setShown({ text, count: skip ? text.length : 0 });
  }
  const count = skip ? text.length : Math.min(shown.count, text.length);

  useEffect(() => {
    if (skip) return;
    const interval = setInterval(() => {
      setShown((s) =>
        s.text !== text || s.count >= text.length
          ? s
          : { ...s, count: s.count + 1 },
      );
    }, 33);
    return () => clearInterval(interval);
  }, [text, skip]);

  return (
    <span className={className}>
      {text.slice(0, count)}
      {/* reserve layout for the untyped remainder so the bubble doesn't grow */}
      <span aria-hidden="true" className="invisible">
        {text.slice(count)}
      </span>
    </span>
  );
}

/**
 * The mascot's speech bubble. The mascot docks bottom-right while any bubble
 * is open, so the bubble sits just above it with a CSS-triangle tail pointing
 * down toward the mascot's mouth.
 */
export default function SpeechBubble({
  profile,
  label = "Homework helper",
  onClose,
  children,
}: {
  profile: Profile;
  label?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const reduced = useReducedMotion();
  const wide = profile === "deaf";

  return (
    <motion.div
      role="dialog"
      aria-label={label}
      {...(reduced
        ? {}
        : {
            initial: { opacity: 0, y: 12, scale: 0.96 },
            animate: { opacity: 1, y: 0, scale: 1 },
            transition: { type: "spring", stiffness: 380, damping: 28 },
          })}
      className={`fixed bottom-28 right-6 z-50 max-w-[calc(100vw-3rem)] rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl ${
        wide ? "w-[26rem] text-lg" : "w-[22rem]"
      }`}
    >
      {/* tail pointing down-right toward the mascot's mouth */}
      <div
        aria-hidden="true"
        className="absolute -bottom-[11px] right-10 h-0 w-0 border-x-[11px] border-t-[12px] border-x-transparent border-t-neutral-200"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-[9px] right-[41px] h-0 w-0 border-x-[10px] border-t-[11px] border-x-transparent border-t-white"
      />

      <div className="mb-3 flex items-center justify-between">
        <p className="inline-flex items-center gap-2 text-sm font-bold text-violet-700">
          <Sparkles size={16} aria-hidden="true" />
          Helper
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close helper"
          className="rounded p-1 text-neutral-500 hover:bg-neutral-100 focus:outline-2 focus:outline-blue-600"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      <div aria-live="polite">{children}</div>
    </motion.div>
  );
}
