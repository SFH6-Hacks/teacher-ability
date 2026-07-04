"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  motion,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { Sparkles, X } from "lucide-react";
import type { Profile } from "@/lib/types";

const MASCOT_SIZE = 64;
const GAP = 14; // space between mascot and bubble

export type BubbleSide = "above" | "below";

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
 * The mascot's speech bubble. It is anchored to the mascot's live spring
 * position (`mx`/`my` are the same MotionValues that place the mascot), so it
 * grows out of the mascot's mouth wherever it happens to be — never a fixed
 * corner. `side` picks whether it opens above or below the face, and the
 * CSS-triangle tail slides along the bubble edge to keep pointing at the
 * mouth even as the bubble clamps to the viewport.
 */
export default function SpeechBubble({
  profile,
  label = "Homework helper",
  mx,
  my,
  side,
  onClose,
  children,
}: {
  profile: Profile;
  label?: string;
  mx: MotionValue<number>;
  my: MotionValue<number>;
  side: BubbleSide;
  onClose: () => void;
  children: ReactNode;
}) {
  const reduced = useReducedMotion();
  const wide = profile === "deaf";
  const width = wide ? 416 : 352;

  const clampLeft = (mascotX: number) => {
    const vw = typeof window === "undefined" ? 1280 : window.innerWidth;
    return Math.min(
      Math.max(mascotX + MASCOT_SIZE / 2 - width * 0.75, 8),
      Math.max(8, vw - width - 8),
    );
  };

  const left = useTransform(mx, clampLeft);
  const top = useTransform(my, (Y: number) => Y + MASCOT_SIZE + GAP);
  const bottom = useTransform(my, (Y: number) => {
    const vh = typeof window === "undefined" ? 800 : window.innerHeight;
    return vh - Y + GAP;
  });
  // tail slides so its tip stays over the mascot's mouth (face centre-x)
  const tailLeft = useTransform(mx, (X: number) =>
    Math.min(Math.max(X + MASCOT_SIZE / 2 - 11 - clampLeft(X), 14), width - 36),
  );

  return (
    <motion.div
      role="dialog"
      aria-label={label}
      {...(reduced
        ? {}
        : {
            initial: {
              opacity: 0,
              scale: 0.8,
              y: side === "above" ? 10 : -10,
            },
            animate: { opacity: 1, scale: 1, y: 0 },
            transition: { type: "spring", stiffness: 380, damping: 28 },
          })}
      style={{
        left,
        width,
        ...(side === "below" ? { top } : { bottom }),
        transformOrigin: side === "below" ? "20% -12px" : "20% calc(100% + 12px)",
      }}
      className={`fixed z-50 max-w-[calc(100vw-1rem)] rounded-2xl border border-neutral-200/80 bg-white/95 p-5 text-neutral-900 shadow-2xl shadow-indigo-500/10 backdrop-blur-sm ${
        wide ? "text-lg" : ""
      }`}
    >
      {side === "above" ? (
        <>
          {/* tail pointing down toward the mascot's mouth */}
          <motion.div
            aria-hidden="true"
            style={{ left: tailLeft }}
            className="absolute -bottom-[11px] h-0 w-0 border-x-[11px] border-t-[12px] border-x-transparent border-t-neutral-200"
          />
          <motion.div
            aria-hidden="true"
            style={{ left: tailLeft, marginLeft: 1 }}
            className="absolute -bottom-[9px] h-0 w-0 border-x-[10px] border-t-[11px] border-x-transparent border-t-white"
          />
        </>
      ) : (
        <>
          {/* tail pointing up toward the mascot's mouth */}
          <motion.div
            aria-hidden="true"
            style={{ left: tailLeft }}
            className="absolute -top-[11px] h-0 w-0 border-x-[11px] border-b-[12px] border-x-transparent border-b-neutral-200"
          />
          <motion.div
            aria-hidden="true"
            style={{ left: tailLeft, marginLeft: 1 }}
            className="absolute -top-[9px] h-0 w-0 border-x-[10px] border-b-[11px] border-x-transparent border-b-white"
          />
        </>
      )}

      <div className="mb-3 flex items-center justify-between">
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase text-indigo-500">
          <Sparkles size={14} aria-hidden="true" className="text-amber-400" />
          Geometry Coach
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
