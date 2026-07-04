"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

export type Expression = "idle" | "thinking" | "happy" | "concerned";

/**
 * The mascot's animated face — inline SVG so the pupils, blinks and mouth
 * can react instantly to state. pupilOffset is a pre-normalised ±3px vector
 * pointing toward the cursor.
 */
export default function MascotFace({
  expression,
  pupilOffset,
}: {
  expression: Expression;
  pupilOffset: { x: number; y: number };
}) {
  const reduced = useReducedMotion();
  const [blink, setBlink] = useState(false);

  // Random blinking every 3–7s (skipped under reduced motion).
  useEffect(() => {
    if (reduced) return;
    let closeTimer: ReturnType<typeof setTimeout>;
    let openTimer: ReturnType<typeof setTimeout>;
    let cancelled = false;
    const schedule = () => {
      closeTimer = setTimeout(
        () => {
          if (cancelled) return;
          setBlink(true);
          openTimer = setTimeout(() => {
            if (cancelled) return;
            setBlink(false);
            schedule();
          }, 130);
        },
        3000 + Math.random() * 4000,
      );
    };
    schedule();
    return () => {
      cancelled = true;
      clearTimeout(closeTimer);
      clearTimeout(openTimer);
    };
  }, [reduced]);

  // Thinking looks up-left regardless of the cursor.
  const px = expression === "thinking" ? -2.2 : pupilOffset.x;
  const py = expression === "thinking" ? -2.2 : pupilOffset.y;

  const squint = expression === "happy";
  const eyeScaleY = blink ? 0.08 : squint ? 0.35 : 1;

  return (
    <svg viewBox="0 0 64 64" className="size-full" aria-hidden="true">
      {/* thinking dots above the head */}
      {expression === "thinking" && (
        <g>
          {[0, 1, 2].map((i) => (
            <motion.circle
              key={i}
              cx={40 + i * 7}
              cy={9}
              r={2.2}
              fill="rgba(255,255,255,0.9)"
              animate={
                reduced
                  ? { opacity: 0.9 }
                  : { opacity: [0.2, 1, 0.2], cy: [10, 7, 10] }
              }
              transition={{
                duration: 1.1,
                repeat: Infinity,
                delay: i * 0.22,
                ease: "easeInOut",
              }}
            />
          ))}
        </g>
      )}

      {/* concerned: raised inner brows */}
      {expression === "concerned" && (
        <g stroke="rgba(255,255,255,0.95)" strokeWidth={2.4} strokeLinecap="round">
          <path d="M 15 17.5 Q 21 14.5 27 17.5" fill="none" />
          <path d="M 37 17.5 Q 43 14.5 49 17.5" fill="none" />
        </g>
      )}

      {/* eyes */}
      {[21, 43].map((cx) => (
        <motion.g
          key={cx}
          animate={{ scaleY: eyeScaleY }}
          transition={{ duration: 0.1 }}
          style={{ originX: "50%", originY: "50%", transformBox: "fill-box" }}
        >
          <ellipse cx={cx} cy={28} rx={8.5} ry={9.5} fill="white" />
          <circle cx={cx + px} cy={28 + py} r={3.6} fill="#1e1b4b" />
          <circle cx={cx + px + 1.2} cy={26.8 + py} r={1.1} fill="white" />
        </motion.g>
      ))}

      {/* mouth per expression */}
      {expression === "idle" && (
        <path
          d="M 25 45 Q 32 50 39 45"
          fill="none"
          stroke="rgba(255,255,255,0.95)"
          strokeWidth={2.6}
          strokeLinecap="round"
        />
      )}
      {expression === "thinking" && (
        <path
          d="M 26 46.5 L 38 46.5"
          fill="none"
          stroke="rgba(255,255,255,0.95)"
          strokeWidth={2.6}
          strokeLinecap="round"
        />
      )}
      {expression === "happy" && (
        <path
          d="M 21 42 Q 32 54 43 42"
          fill="rgba(255,255,255,0.25)"
          stroke="rgba(255,255,255,0.95)"
          strokeWidth={2.6}
          strokeLinecap="round"
        />
      )}
      {expression === "concerned" && (
        <ellipse
          cx={32}
          cy={46.5}
          rx={4}
          ry={5}
          fill="rgba(30,27,75,0.55)"
          stroke="rgba(255,255,255,0.95)"
          strokeWidth={2.2}
        />
      )}
    </svg>
  );
}
