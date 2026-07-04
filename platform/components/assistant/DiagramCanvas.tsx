"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import rough from "roughjs/bin/rough";
import type { Options } from "roughjs/bin/core";
import type { Diagram, DiagramShape, Profile } from "@/lib/types";

const STROKE = "#2563eb";

interface RenderedPath {
  d: string;
  stroke: string;
  strokeWidth: number;
  fill: string;
}

function shapePaths(
  gen: ReturnType<typeof rough.generator>,
  shape: DiagramShape,
  s: number,
  opts: Options,
): RenderedPath[] {
  let drawable = null;
  switch (shape.kind) {
    case "line":
      if (
        shape.x1 !== undefined &&
        shape.y1 !== undefined &&
        shape.x2 !== undefined &&
        shape.y2 !== undefined
      ) {
        drawable = gen.line(shape.x1 * s, shape.y1 * s, shape.x2 * s, shape.y2 * s, opts);
      }
      break;
    case "polygon":
      if (shape.points && shape.points.length >= 6) {
        const pts: [number, number][] = [];
        for (let i = 0; i + 1 < shape.points.length; i += 2) {
          pts.push([shape.points[i] * s, shape.points[i + 1] * s]);
        }
        drawable = gen.polygon(pts, opts);
      }
      break;
    case "circle":
      if (shape.cx !== undefined && shape.cy !== undefined && shape.r !== undefined) {
        drawable = gen.circle(shape.cx * s, shape.cy * s, shape.r * 2 * s, opts);
      }
      break;
    case "angle-mark":
      if (
        shape.x !== undefined &&
        shape.y !== undefined &&
        shape.r !== undefined &&
        shape.startDeg !== undefined &&
        shape.endDeg !== undefined
      ) {
        drawable = gen.arc(
          shape.x * s,
          shape.y * s,
          shape.r * 2 * s,
          shape.r * 2 * s,
          (shape.startDeg * Math.PI) / 180,
          (shape.endDeg * Math.PI) / 180,
          false,
          opts,
        );
      }
      break;
    default:
      return []; // "text" is rendered as a plain <text> element
  }
  if (!drawable) return [];
  return gen.toPaths(drawable).map((p) => ({
    d: p.d,
    stroke: p.stroke && p.stroke !== "none" ? p.stroke : "none",
    strokeWidth: p.strokeWidth ?? 2.5,
    fill: p.fill && p.fill !== "none" ? p.fill : "none",
  }));
}

/** Midpoint of a shape, for label placement (scaled coordinates). */
function labelAnchor(shape: DiagramShape, s: number): { x: number; y: number } {
  if (shape.kind === "line") {
    return {
      x: (((shape.x1 ?? 0) + (shape.x2 ?? 0)) / 2) * s,
      y: (((shape.y1 ?? 0) + (shape.y2 ?? 0)) / 2) * s - 6,
    };
  }
  if (shape.kind === "circle") {
    return { x: (shape.cx ?? 0) * s, y: ((shape.cy ?? 0) - (shape.r ?? 0)) * s - 6 };
  }
  if (shape.kind === "polygon" && shape.points?.length) {
    let mx = 0;
    let my = 0;
    const n = Math.floor(shape.points.length / 2);
    for (let i = 0; i + 1 < shape.points.length; i += 2) {
      mx += shape.points[i];
      my += shape.points[i + 1];
    }
    return { x: (mx / n) * s, y: (my / n) * s };
  }
  return { x: (shape.x ?? 0) * s, y: (shape.y ?? 0) * s - 6 };
}

/**
 * Floating card near the mascot's dock that renders a model-authored
 * Diagram spec with rough.js — sketchy lines to match the annotations.
 */
export default function DiagramCanvas({
  diagram,
  profile,
  onClose,
}: {
  diagram: Diagram;
  profile: Profile;
  onClose: () => void;
}) {
  const reduced = useReducedMotion();
  const [seed] = useState(() => Math.floor(Math.random() * 2 ** 30) + 1);
  const targetW = profile === "deaf" ? 420 : 320;
  const s = targetW / Math.max(diagram.width, 1);
  const height = Math.max(diagram.height, 1) * s;

  const rendered = useMemo(() => {
    const gen = rough.generator();
    const opts: Options = {
      stroke: STROKE,
      strokeWidth: 2.5,
      roughness: 1.3,
      seed,
    };
    return diagram.shapes.map((shape) => ({
      shape,
      paths: shapePaths(gen, shape, s, opts),
      anchor: labelAnchor(shape, s),
    }));
  }, [diagram, s, seed]);

  return (
    <div
      role="img"
      aria-label={diagram.title ?? "Helper diagram"}
      className="fixed bottom-28 right-6 z-[55] rounded-2xl border border-neutral-200 bg-white p-4 shadow-xl"
    >
      <div className="mb-2 flex items-center justify-between gap-4">
        <p className="text-sm font-bold text-violet-700">
          {diagram.title ?? "Look at this!"}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close diagram"
          className="rounded p-1 text-neutral-500 hover:bg-neutral-100 focus:outline-2 focus:outline-blue-600"
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>
      <svg width={targetW} height={height} viewBox={`0 0 ${targetW} ${height}`}>
        {rendered.map(({ shape, paths, anchor }, i) => (
          <g key={i}>
            {paths.map((p, j) => (
              <motion.path
                key={j}
                d={p.d}
                stroke={p.stroke === "none" ? undefined : p.stroke}
                strokeWidth={p.strokeWidth}
                fill={p.fill}
                strokeLinecap="round"
                {...(reduced
                  ? {}
                  : {
                      initial: { pathLength: 0 },
                      animate: { pathLength: 1 },
                      transition: {
                        duration: 0.5,
                        delay: Math.min(i * 0.15, 1),
                        ease: "easeOut" as const,
                      },
                    })}
              />
            ))}
            {shape.kind === "text" && shape.text && (
              <text
                x={(shape.x ?? 0) * s}
                y={(shape.y ?? 0) * s}
                className="font-mono"
                fontSize={12}
                fill="#1e1b4b"
              >
                {shape.text}
              </text>
            )}
            {shape.label && shape.kind !== "text" && (
              <text
                x={anchor.x}
                y={anchor.y}
                textAnchor="middle"
                className="font-mono"
                fontSize={11}
                fill="#6d28d9"
              >
                {shape.label}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
