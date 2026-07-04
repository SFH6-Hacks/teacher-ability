"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import rough from "roughjs/bin/rough";
import type { Options } from "roughjs/bin/core";
import type { HelpPointer, PointerEnd } from "@/lib/types";

const STROKE = "#2563eb"; // blue-600
const FILL = "#7c3aed"; // violet-600

interface Pt {
  x: number;
  y: number;
}

function spotRect(spot: string): DOMRect | null {
  const el = document.querySelector<HTMLElement>(
    `[data-spot="${CSS.escape(spot)}"]`,
  );
  return el ? el.getBoundingClientRect() : null;
}

function resolveEnd(end: PointerEnd | undefined): Pt | null {
  if (!end) return null;
  if (end.spot) {
    const r = spotRect(end.spot);
    if (!r) return null;
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  if (typeof end.x === "number" && typeof end.y === "number") {
    return { x: end.x, y: end.y };
  }
  return null;
}

/** Pull an arrow endpoint back to the edge of its spot's rect so the tip
 * lands just outside the element instead of on top of its text. */
function toEdge(to: Pt, toSpot: string | undefined, from: Pt): Pt {
  if (!toSpot) return to;
  const r = spotRect(toSpot);
  if (!r) return to;
  const dx = from.x - to.x;
  const dy = from.y - to.y;
  const len = Math.hypot(dx, dy) || 1;
  // step outward from the center until we exit the rect (+8px breathing room)
  const half = Math.min(
    Math.abs(dx) > 0.01 ? (r.width / 2 + 8) / (Math.abs(dx) / len) : Infinity,
    Math.abs(dy) > 0.01 ? (r.height / 2 + 8) / (Math.abs(dy) / len) : Infinity,
  );
  if (!isFinite(half)) return to;
  return { x: to.x + (dx / len) * half, y: to.y + (dy / len) * half };
}

function arrowheadPath(tip: Pt, tail: Pt): string {
  const angle = Math.atan2(tip.y - tail.y, tip.x - tail.x);
  const len = 14;
  const spread = 0.45;
  const a1 = angle + Math.PI - spread;
  const a2 = angle + Math.PI + spread;
  return (
    `M ${tip.x} ${tip.y} L ${tip.x + len * Math.cos(a1)} ${tip.y + len * Math.sin(a1)}` +
    ` M ${tip.x} ${tip.y} L ${tip.x + len * Math.cos(a2)} ${tip.y + len * Math.sin(a2)}`
  );
}

interface RenderedPath {
  d: string;
  stroke: string;
  strokeWidth: number;
  fill: string;
  opacity: number;
}

function buildPaths(pointer: HelpPointer, seed: number): RenderedPath[] {
  const gen = rough.generator();
  const opts: Options = {
    stroke: STROKE,
    strokeWidth: 3,
    roughness: 1.6,
    bowing: 1.4,
    seed,
  };
  const out: RenderedPath[] = [];
  const push = (drawable: ReturnType<typeof gen.line>, isFill = false) => {
    for (const p of gen.toPaths(drawable)) {
      const filled = p.fill && p.fill !== "none";
      out.push({
        d: p.d,
        stroke: filled ? "none" : (p.stroke ?? STROKE),
        strokeWidth: p.strokeWidth ?? 3,
        fill: filled ? p.fill! : "none",
        opacity: isFill && (filled || p.stroke === FILL) ? 0.18 : 1,
      });
    }
  };

  const targetRect = pointer.targetSpot ? spotRect(pointer.targetSpot) : null;

  switch (pointer.kind) {
    case "circle": {
      if (!targetRect) return [];
      const pad = 12;
      push(
        gen.ellipse(
          targetRect.left + targetRect.width / 2,
          targetRect.top + targetRect.height / 2,
          targetRect.width + pad * 2,
          targetRect.height + pad * 2,
          opts,
        ),
      );
      break;
    }
    case "underline": {
      if (!targetRect) return [];
      const y = targetRect.bottom + 6;
      push(gen.line(targetRect.left, y, targetRect.right, y, opts));
      break;
    }
    case "region": {
      let x = 0;
      let y = 0;
      let w = 0;
      let h = 0;
      if (pointer.rect) {
        x = pointer.rect.x1;
        y = pointer.rect.y1;
        w = pointer.rect.x2 - pointer.rect.x1;
        h = pointer.rect.y2 - pointer.rect.y1;
      } else if (targetRect) {
        const pad = 8;
        x = targetRect.left - pad;
        y = targetRect.top - pad;
        w = targetRect.width + pad * 2;
        h = targetRect.height + pad * 2;
      } else {
        return [];
      }
      // Hachure fill pass (low opacity), then the outline pass on top.
      push(
        gen.rectangle(x, y, w, h, {
          ...opts,
          stroke: "none",
          fill: FILL,
          fillStyle: "hachure",
          fillWeight: 1.4,
          hachureGap: 9,
        }),
        true,
      );
      push(gen.rectangle(x, y, w, h, opts));
      break;
    }
    case "arrow-straight":
    case "arrow-curved": {
      let to = resolveEnd(pointer.to) ?? resolveEnd({ spot: pointer.targetSpot });
      if (!to) return [];
      let from = resolveEnd(pointer.from);
      if (!from) {
        // default: come in from 120px toward the screen center
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        const dx = cx - to.x;
        const dy = cy - to.y;
        const len = Math.hypot(dx, dy) || 1;
        from = { x: to.x + (dx / len) * 120, y: to.y + (dy / len) * 120 };
      }
      to = toEdge(to, pointer.to?.spot ?? pointer.targetSpot, from);
      if (pointer.kind === "arrow-straight") {
        push(gen.line(from.x, from.y, to.x, to.y, opts));
        push(gen.path(arrowheadPath(to, from), opts));
      } else {
        const mx = (from.x + to.x) / 2;
        const my = (from.y + to.y) / 2;
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const len = Math.hypot(dx, dy) || 1;
        const ctrl = { x: mx - (dy / len) * 60, y: my + (dx / len) * 60 };
        push(
          gen.path(
            `M ${from.x} ${from.y} Q ${ctrl.x} ${ctrl.y} ${to.x} ${to.y}`,
            opts,
          ),
        );
        push(gen.path(arrowheadPath(to, ctrl), opts));
      }
      break;
    }
  }
  return out;
}

/**
 * Full-viewport overlay where the mascot draws hand-sketched (rough.js)
 * pointers: circles, underlines, hachure regions and arrows. Coordinates are
 * viewport pixels (position: fixed); target rects are re-measured on
 * scroll/resize with rAF throttling.
 */
export default function AnnotationLayer({
  pointer,
}: {
  pointer: HelpPointer | null;
}) {
  const reduced = useReducedMotion();
  const [tick, setTick] = useState(0);
  const [seed] = useState(() => Math.floor(Math.random() * 2 ** 30) + 1);

  useEffect(() => {
    if (!pointer) return;
    let raf = 0;
    const remeasure = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        setTick((t) => t + 1);
      });
    };
    window.addEventListener("scroll", remeasure, true);
    window.addEventListener("resize", remeasure);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", remeasure, true);
      window.removeEventListener("resize", remeasure);
    };
  }, [pointer]);

  const paths = useMemo(() => {
    if (!pointer || typeof window === "undefined") return [];
    return buildPaths(pointer, seed);
    // tick forces a re-measure of target rects on scroll/resize
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pointer, seed, tick]);

  if (!pointer || paths.length === 0) return null;

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60] h-full w-full"
    >
      {paths.map((p, i) => (
        <motion.path
          key={`${seed}-${i}`}
          d={p.d}
          fill={p.fill}
          stroke={p.stroke === "none" ? undefined : p.stroke}
          strokeWidth={p.strokeWidth}
          strokeLinecap="round"
          opacity={p.opacity}
          {...(reduced
            ? {}
            : {
                initial: { pathLength: 0 },
                animate: { pathLength: 1 },
                transition: {
                  duration: 0.6,
                  delay: Math.min(i * 0.05, 0.4),
                  ease: "easeOut" as const,
                },
              })}
        />
      ))}
    </svg>
  );
}
