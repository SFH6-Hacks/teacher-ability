"use client";

import { useEffect, useRef } from "react";
import { Tangram } from "@/lib/tangram";

export type TangramFigure =
  | "cube"
  | "person"
  | "candle"
  | "cat"
  | "rocket"
  | "sailboat";

function getPalette(baseColor?: string) {
  if (baseColor === "deaf" || baseColor === "teal" || baseColor === "#0f766e" || baseColor === "#14B8A6" || baseColor === "#0F766E") {
    return { L1: "#0d9488", L2: "#14b8a6", M: "#2dd4bf", S1: "#5eead4", S2: "#99f6e4", SQ: "#0f766e", P: "#ccfbf1" };
  }
  if (baseColor === "dyslexia" || baseColor === "amber" || baseColor === "#F59E0B" || baseColor === "#f59e0b") {
    return { L1: "#d97706", L2: "#f59e0b", M: "#fbbf24", S1: "#fcd34d", S2: "#fde68a", SQ: "#b45309", P: "#fef3c7" };
  }
  if (baseColor === "adhd" || baseColor === "red" || baseColor === "#EF4444" || baseColor === "#ef4444") {
    return { L1: "#dc2626", L2: "#ef4444", M: "#f87171", S1: "#fca5a5", S2: "#fecaca", SQ: "#b91c1c", P: "#fee2e2" };
  }
  if (baseColor === "blind" || baseColor === "violet" || baseColor === "#8B5CF6" || baseColor === "#8b5cf6") {
    return { L1: "#7c3aed", L2: "#8b5cf6", M: "#a78bfa", S1: "#c4b5fd", S2: "#ddd6fe", SQ: "#6d28d9", P: "#ede9fe" };
  }
  return undefined; // default palette
}

export default function TangramMascot({
  figure = "person",
  colorScheme,
  className,
}: {
  figure?: TangramFigure;
  colorScheme?: string;
  className?: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tangramRef = useRef<Tangram | null>(null);

  useEffect(() => {
    if (svgRef.current && !tangramRef.current) {
      tangramRef.current = new Tangram(svgRef.current, {
        colors: getPalette(colorScheme),
        padding: 0.1,
      });
      tangramRef.current.set(figure);
    }
  }, [colorScheme, figure]);

  useEffect(() => {
    if (tangramRef.current) {
      tangramRef.current.morphTo(figure, { duration: 800, stagger: 30 });
    }
  }, [figure]);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 100 100"
      className={className}
      aria-hidden="true"
    />
  );
}
