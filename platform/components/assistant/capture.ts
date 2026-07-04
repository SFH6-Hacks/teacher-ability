"use client";

import { domToCanvas } from "modern-screenshot";

export interface SpotInfo {
  id: string;
  role: string;
  text: string;
  rect: { x: number; y: number; w: number; h: number };
}

export interface CaptureResult {
  imageBase64: string | null;
  viewport: { w: number; h: number };
  registry: SpotInfo[];
}

const MAX_SIDE = 1024;

/**
 * Screenshot the page (best effort) and collect an element registry of
 * every [data-spot] region so the model can point at real pixels.
 * The screenshot may fail (odd CSS, tainted images) — the registry alone
 * is still enough for a useful help plan, so imageBase64 is nullable.
 */
export async function captureContext(): Promise<CaptureResult> {
  const registry: SpotInfo[] = Array.from(
    document.querySelectorAll<HTMLElement>("[data-spot]"),
  ).map((el) => {
    const r = el.getBoundingClientRect();
    return {
      id: el.dataset.spot ?? "",
      role: el.tagName.toLowerCase(),
      text: (el.textContent ?? "").trim().slice(0, 160),
      rect: {
        x: Math.round(r.left),
        y: Math.round(r.top),
        w: Math.round(r.width),
        h: Math.round(r.height),
      },
    };
  });

  const viewport = { w: window.innerWidth, h: window.innerHeight };

  let imageBase64: string | null = null;
  try {
    let canvas = await domToCanvas(document.body, { scale: 0.5 });
    const longest = Math.max(canvas.width, canvas.height);
    if (longest > MAX_SIDE) {
      const k = MAX_SIDE / longest;
      const scaled = document.createElement("canvas");
      scaled.width = Math.round(canvas.width * k);
      scaled.height = Math.round(canvas.height * k);
      const ctx = scaled.getContext("2d");
      if (ctx) {
        ctx.drawImage(canvas, 0, 0, scaled.width, scaled.height);
        canvas = scaled;
      }
    }
    const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
    const comma = dataUrl.indexOf(",");
    if (comma > 0 && dataUrl.startsWith("data:image/jpeg")) {
      imageBase64 = dataUrl.slice(comma + 1);
    }
  } catch {
    imageBase64 = null; // registry-only flow
  }

  return { imageBase64, viewport, registry };
}
