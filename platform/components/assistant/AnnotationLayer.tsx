"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  motion,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "framer-motion";
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

export interface StrokeGeometry {
  /** viewport-pixel pen-tip position at overall draw progress t ∈ [0,1] */
  pointAt: (t: number) => Pt;
  /** total stroke length in px (for picking a draw duration) */
  total: number;
}

/** Normalised slice of the overall 0→1 progress owned by one stroke path. */
interface Seg {
  start: number;
  len: number;
}

/**
 * One stroke revealed by its slice of the shared draw progress. `seg` is
 * undefined while lengths are still being measured (hidden), or null for
 * fill-only paths (which fade in as the pen works).
 */
function TracedPath({
  p,
  seg,
  progress,
  innerRef,
}: {
  p: RenderedPath;
  seg: Seg | null | undefined;
  progress: MotionValue<number>;
  innerRef: (el: SVGPathElement | null) => void;
}) {
  const pathLength = useTransform(progress, (t) =>
    seg ? Math.max(0.001, Math.min(1, (t - seg.start) / seg.len)) : 1,
  );
  const opacity = useTransform(progress, (t) => {
    if (seg === undefined) return 0; // not measured yet
    if (seg === null) {
      // fill pass: fade in over the middle of the draw
      return t <= 0.35 ? 0 : Math.min(1, (t - 0.35) / 0.3) * p.opacity;
    }
    return t >= seg.start ? p.opacity : 0;
  });
  return (
    <motion.path
      ref={innerRef}
      d={p.d}
      fill={p.fill}
      stroke={p.stroke === "none" ? undefined : p.stroke}
      strokeWidth={p.strokeWidth}
      strokeLinecap="round"
      style={p.stroke === "none" ? { opacity } : { pathLength, opacity }}
    />
  );
}

/**
 * Full-viewport overlay where the mascot draws hand-sketched (rough.js)
 * pointers: circles, underlines, hachure regions and arrows. Coordinates are
 * viewport pixels (position: fixed); target rects are re-measured on
 * scroll/resize with rAF throttling.
 *
 * When `progress` is provided, strokes reveal sequentially as it goes 0→1 and
 * `onGeometry` reports a `pointAt(t)` sampler so the mascot can ride the pen
 * tip. Without it, strokes self-animate as before.
 */
export default function AnnotationLayer({
  pointer,
  progress,
  onGeometry,
}: {
  pointer: HelpPointer | null;
  progress?: MotionValue<number>;
  onGeometry?: (geometry: StrokeGeometry) => void;
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

  // --- pen-tip tracing (only when a shared progress value is supplied) ------
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const [segs, setSegs] = useState<(Seg | null)[]>([]);
  const traced = !!progress && !reduced;

  useLayoutEffect(() => {
    if (!traced || paths.length === 0) return;
    const els = pathRefs.current;
    // stroke paths carry the pen; fill passes (hachure) just fade in
    const lens = paths.map((p, i) =>
      p.stroke !== "none" && els[i] ? els[i]!.getTotalLength() : 0,
    );
    const total = lens.reduce((a, b) => a + b, 0);
    if (!total) return;
    let acc = 0;
    setSegs(
      lens.map((l) => {
        const seg = l ? { start: acc / total, len: l / total } : null;
        acc += l;
        return seg;
      }),
    );
    const strokeEls: SVGPathElement[] = [];
    const strokeLens: number[] = [];
    paths.forEach((_, i) => {
      if (lens[i] && els[i]) {
        strokeEls.push(els[i]!);
        strokeLens.push(lens[i]);
      }
    });
    const pointAt = (t: number): Pt => {
      let d = Math.min(1, Math.max(0, t)) * total;
      for (let i = 0; i < strokeEls.length; i++) {
        if (d <= strokeLens[i] || i === strokeEls.length - 1) {
          const pt = strokeEls[i].getPointAtLength(Math.min(d, strokeLens[i]));
          return { x: pt.x, y: pt.y };
        }
        d -= strokeLens[i];
      }
      return { x: 0, y: 0 };
    };
    onGeometry?.({ pointAt, total });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paths, traced, onGeometry]);

  if (!pointer || paths.length === 0) return null;

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60] h-full w-full"
    >
      {paths.map((p, i) =>
        traced ? (
          <TracedPath
            key={`${seed}-${i}`}
            p={p}
            seg={segs[i]}
            progress={progress!}
            innerRef={(el) => {
              pathRefs.current[i] = el;
            }}
          />
        ) : (
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
        ),
      )}
    </svg>
  );
}
