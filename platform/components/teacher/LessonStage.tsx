"use client";

import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Loader2,
  Mic,
  MicOff,
} from "lucide-react";
import { BACKUP_TRANSCRIPT } from "@/lib/demo-data";
import { useSpeechRecognition } from "@/lib/useSpeechRecognition";
import type { Lesson } from "@/lib/types";

export function LessonStage({
  lesson,
  slideIndex,
  onSlide,
  liveSync,
  onToggleSync,
}: {
  lesson: Lesson;
  slideIndex: number; // 0-based
  onSlide: (i: number) => void;
  liveSync: boolean;
  onToggleSync: () => void;
}) {
  const slide = lesson.slides[slideIndex];
  const total = lesson.slides.length;

  const speech = useSpeechRecognition();
  const [summary, setSummary] = useState<string[]>([]);
  const [summarizing, setSummarizing] = useState(false);

  // `speech.supported` reads the browser API, so it differs between server and
  // client. Gate anything that depends on it behind a mount flag so the first
  // client render matches the server HTML (no hydration mismatch).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const ready = mounted && speech.supported;

  const summarize = async (transcript: string) => {
    if (!transcript.trim()) return;
    setSummarizing(true);
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      const data = (await res.json()) as { summary?: string[] };
      if (data.summary) setSummary(data.summary);
    } finally {
      setSummarizing(false);
    }
  };

  const toggleMic = () => {
    if (speech.listening) {
      speech.stop();
      void summarize(speech.finalText);
    } else {
      speech.start();
    }
  };

  const caption = speech.finalText
    ? `${speech.finalText} ${speech.interim}`.trim()
    : speech.interim;

  return (
    <section
      aria-label="Lesson control"
      className="flex flex-col gap-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
            Now teaching
          </p>
          <h2 className="text-lg font-bold text-stone-900">{lesson.title}</h2>
        </div>
        {/* live-sync: the one control that broadcasts to every student */}
        <button
          type="button"
          onClick={onToggleSync}
          aria-pressed={liveSync}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-600 ${
            liveSync
              ? "bg-teal-700 text-white hover:bg-teal-800"
              : "bg-stone-100 text-stone-500 hover:bg-stone-200"
          }`}
        >
          <span
            className={`relative flex h-2 w-2 ${liveSync ? "" : "opacity-60"}`}
            aria-hidden="true"
          >
            {liveSync && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70 motion-reduce:hidden" />
            )}
            <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
          </span>
          {liveSync ? "Live sync on" : "Live sync off"}
        </button>
      </div>

      {/* the stage — the slide, given room to breathe */}
      <div className="rounded-xl border border-stone-200 bg-stone-50 p-8">
        <div className="mb-4 flex items-center gap-2">
          {lesson.slides.map((s, i) => (
            <span
              key={s.index}
              className={`h-1.5 rounded-full transition-all ${
                i === slideIndex ? "w-6 bg-teal-600" : "w-1.5 bg-stone-300"
              }`}
              aria-hidden="true"
            />
          ))}
          <span className="ml-auto text-xs font-medium text-stone-500">
            Slide {slideIndex + 1} of {total}
          </span>
        </div>
        <h3 className="text-2xl font-bold text-stone-900">{slide.title}</h3>
        <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-stone-700">
          {slide.content_text}
        </p>
        {slide.image_alt && (
          <p className="mt-4 flex items-start gap-2 rounded-lg bg-white p-3 text-xs text-stone-500">
            <ImageIcon size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>
              <span className="font-semibold text-stone-600">Described image:</span>{" "}
              {slide.image_alt}
            </span>
          </p>
        )}
      </div>

      {/* controls — close to the stage but visually secondary */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSlide(Math.max(0, slideIndex - 1))}
            disabled={slideIndex === 0}
            className="inline-flex items-center gap-1 rounded-lg border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
          >
            <ChevronLeft size={16} aria-hidden="true" /> Prev
          </button>
          <button
            type="button"
            onClick={() => onSlide(Math.min(total - 1, slideIndex + 1))}
            disabled={slideIndex === total - 1}
            className="inline-flex items-center gap-1 rounded-lg border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
          >
            Next <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
        <button
          type="button"
          onClick={toggleMic}
          disabled={!ready}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-600 disabled:opacity-50 ${
            speech.listening
              ? "bg-amber-500 text-white hover:bg-amber-600"
              : "border border-stone-300 text-stone-700 hover:bg-stone-100"
          }`}
        >
          {speech.listening ? (
            <>
              <MicOff size={16} aria-hidden="true" /> Stop capturing
            </>
          ) : (
            <>
              <Mic size={16} aria-hidden="true" /> Capture speech
            </>
          )}
        </button>
      </div>

      {/* transcript ticker — grounds the homework help; kept low-key */}
      <div>
        <div className="mb-1.5 flex items-center gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Transcript
          </h3>
          {speech.listening && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500 motion-reduce:animate-none" />
              recording
            </span>
          )}
          {mounted && !speech.supported && (
            <button
              type="button"
              onClick={() => {
                speech.setFinalText(BACKUP_TRANSCRIPT);
                void summarize(BACKUP_TRANSCRIPT);
              }}
              className="ml-auto text-xs font-semibold text-teal-700 underline underline-offset-2 hover:text-teal-800"
            >
              Use backup transcript
            </button>
          )}
        </div>
        <p
          aria-live="polite"
          className="line-clamp-2 min-h-[2.5rem] rounded-lg bg-stone-50 px-3 py-2 text-sm leading-relaxed text-stone-600"
        >
          {caption || (
            <span className="text-stone-400">
              Your speech is captured here and grounds every student&apos;s
              homework help.
            </span>
          )}
        </p>
        {(summarizing || summary.length > 0) && (
          <div
            aria-live="polite"
            className="mt-2 rounded-lg border-l-2 border-teal-500 bg-teal-50/60 px-3 py-2"
          >
            {summarizing ? (
              <p className="inline-flex items-center gap-2 text-xs text-stone-600">
                <Loader2
                  size={13}
                  className="animate-spin motion-reduce:animate-none"
                  aria-hidden="true"
                />
                Summarising with Gemini…
              </p>
            ) : (
              <ul className="list-disc space-y-0.5 pl-4 text-xs text-stone-700">
                {summary.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
