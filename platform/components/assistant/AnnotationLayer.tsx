"use client";

import { motion, useReducedMotion } from "framer-motion";

export interface SpotRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * Full-viewport SVG overlay the companion draws on. Coordinates come from
 * getBoundingClientRect at step time (position: fixed, so viewport space).
 */
export default function AnnotationLayer({
  rect,
  draw,
}: {
  rect: SpotRect | null;
  draw?: "circle" | "underline" | "arrow";
}) {
  const reduced = useReducedMotion();
  if (!rect || !draw) return null;

  const stroke = "#2563eb";
  const anim = reduced
    ? {}
    : {
        initial: { pathLength: 0 },
        animate: { pathLength: 1 },
        transition: { duration: 0.7, ease: "easeOut" as const },
      };

  const pad = 10;
  let path = "";
  if (draw === "circle") {
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const rx = rect.width / 2 + pad + 6;
    const ry = rect.height / 2 + pad;
    // slightly lopsided ellipse = hand-drawn feel
    path = `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 1 ${cx + rx * 0.98} ${cy - ry * 0.15} A ${rx * 1.02} ${ry} 8 1 1 ${cx - rx} ${cy}`;
  } else if (draw === "underline") {
    const y = rect.top + rect.height + 6;
    path = `M ${rect.left} ${y} Q ${rect.left + rect.width / 2} ${y + 8} ${rect.left + rect.width} ${y}`;
  } else {
    // arrow from upper-left toward the element
    const tx = rect.left - 8;
    const ty = rect.top + rect.height / 2;
    const sx = tx - 90;
    const sy = ty - 70;
    path = `M ${sx} ${sy} Q ${sx + 30} ${ty} ${tx} ${ty} M ${tx} ${ty} L ${tx - 14} ${ty - 10} M ${tx} ${ty} L ${tx - 16} ${ty + 6}`;
  }

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-40 h-full w-full"
    >
      <motion.path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth={3}
        strokeLinecap="round"
        {...anim}
      />
    </svg>
  );
}
