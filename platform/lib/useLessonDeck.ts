"use client";

import { useEffect, useState } from "react";
import { DEMO_LESSON } from "./demo-data";

// A slide, whether it came from a rendered PDF page or the text fallback.
export interface DeckPage {
  index: number; // 0-based
  title: string;
  text: string; // extracted (PDF) or content_text (fallback) — feeds TTS/captions
  imageUrl: string | null; // rendered PDF page; null ⇒ render as a text slide
  imageAlt?: string;
}

const PDF_URL = "/lesson.pdf";

async function loadPdfPages(): Promise<DeckPage[] | null> {
  try {
    const head = await fetch(PDF_URL, { method: "HEAD" });
    if (!head.ok) return null;

    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

    const doc = await pdfjs.getDocument({ url: PDF_URL }).promise;
    const pages: DeckPage[] = [];
    for (let n = 1; n <= doc.numPages; n++) {
      const page = await doc.getPage(n);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;
      await page.render({ canvas, viewport }).promise;

      const content = await page.getTextContent();
      const items = content.items as Array<{ str?: string }>;
      const text = items
        .map((it) => it.str ?? "")
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      const title = text.split(/[.•\n]/)[0]?.slice(0, 80).trim() || `Slide ${n}`;

      pages.push({ index: n - 1, title, text, imageUrl: canvas.toDataURL("image/png") });
      page.cleanup();
    }
    return pages.length ? pages : null;
  } catch {
    return null;
  }
}

function fallbackPages(): DeckPage[] {
  return DEMO_LESSON.slides.map((s) => ({
    index: s.index - 1,
    title: s.title,
    text: s.content_text,
    imageUrl: s.image_url ?? null,
    imageAlt: s.image_alt,
  }));
}

/**
 * Loads the lesson deck: renders public/lesson.pdf to page images + extracted
 * text when present, otherwise falls back to the bundled text slides so the
 * live lesson is demoable before the real PDF is dropped in.
 */
export function useLessonDeck() {
  const [pages, setPages] = useState<DeckPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"pdf" | "fallback">("fallback");

  useEffect(() => {
    let alive = true;
    (async () => {
      const pdf = await loadPdfPages();
      if (!alive) return;
      if (pdf) {
        setPages(pdf);
        setSource("pdf");
      } else {
        setPages(fallbackPages());
        setSource("fallback");
      }
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  return { pages, loading, source };
}
