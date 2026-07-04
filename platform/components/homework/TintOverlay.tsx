"use client";

import { useState } from "react";
import { Palette } from "lucide-react";

const TINTS = [
  { id: "none", label: "No tint", color: "transparent" },
  { id: "blue", label: "Blue tint", color: "rgba(204, 228, 255, 0.25)" },
  { id: "yellow", label: "Yellow tint", color: "rgba(255, 243, 176, 0.25)" },
] as const;

/**
 * Dyslexia: coloured tint overlay over the whole page. Renders the toggle
 * button (place it in the header) plus a fixed full-viewport tint layer.
 */
export default function TintOverlay() {
  const [i, setI] = useState(0);
  const tint = TINTS[i];
  const next = TINTS[(i + 1) % TINTS.length];

  return (
    <>
      <button
        type="button"
        onClick={() => setI((v) => (v + 1) % TINTS.length)}
        aria-label={`Colour tint: ${tint.label}. Switch to ${next.label.toLowerCase()}`}
        className="inline-flex items-center gap-2 rounded-lg border border-[#e0d2b4] bg-[#FFFBF0] px-3 py-2 text-sm font-semibold text-neutral-800 hover:bg-[#f5ecd8] focus:outline-2 focus:outline-offset-2 focus:outline-amber-700"
      >
        <Palette size={16} aria-hidden="true" />
        Tint: {tint.id === "none" ? "off" : tint.id}
        <span
          aria-hidden="true"
          className="size-4 rounded-full border border-neutral-300"
          style={{
            background:
              tint.id === "none"
                ? "linear-gradient(135deg, #fff 45%, #ccc 55%)"
                : tint.color,
          }}
        />
      </button>
      {tint.id !== "none" && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-40"
          style={{ backgroundColor: tint.color }}
        />
      )}
    </>
  );
}
