"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mic,
  MicOff,
  Play,
  X,
} from "lucide-react";
import { BACKUP_TRANSCRIPT, CLASS, DEMO_LESSON } from "@/lib/demo-data";
import { useSpeechRecognition } from "@/lib/useSpeechRecognition";
import { useLessonDeck } from "@/lib/useLessonDeck";
import { isConnected } from "@/lib/types";
import { DeckCanvas } from "@/components/lesson/DeckCanvas";

const CONNECTED_COUNT = CLASS.filter(isConnected).length;

export function LessonStage() {
  const { pages, loading, source } = useLessonDeck();
  const total = pages.length;

  const [current, setCurrent] = useState(0);
  const [presenting, setPresenting] = useState(false);
  const [broadcasting, setBroadcasting] = useState(true);

  const clampedCurrent = total ? Math.min(current, total - 1) : 0;
  const page = pages[clampedCurrent];

  // Broadcast the current slide (+ present state) so student tabs can follow.
  const broadcast = useCallback((index: number, present: boolean) => {
    fetch("/api/lesson/slide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ index, presenting: present }),
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (broadcasting && total) broadcast(clampedCurrent, presenting);
  }, [clampedCurrent, presenting, broadcasting, total, broadcast]);

  const go = useCallback(
    (delta: number) =>
      setCurrent((c) => Math.min(total - 1, Math.max(0, c + delta))),
    [total],
  );

  // Present mode: fullscreen + arrow-key navigation.
  useEffect(() => {
    if (!presenting) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        go(-1);
      } else if (e.key === "Escape") {
        setPresenting(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [presenting, go]);

  // ---- Speech capture (transcript grounds the homework help) ----------------
  const speech = useSpeechRecognition();
  const [summary, setSummary] = useState<string[]>([]);
  const [summarizing, setSummarizing] = useState(false);
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
          <h2 className="text-lg font-bold text-stone-900">{DEMO_LESSON.title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setBroadcasting((v) => !v)}
            aria-pressed={broadcasting}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-600 ${
              broadcasting
                ? "bg-teal-700 text-white hover:bg-teal-800"
                : "bg-stone-100 text-stone-500 hover:bg-stone-200"
            }`}
          >
            <span className="relative flex h-2 w-2" aria-hidden="true">
              {broadcasting && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70 motion-reduce:hidden" />
              )}
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${broadcasting ? "bg-white" : "bg-stone-400"}`}
              />
            </span>
            {broadcasting ? "Live sync on" : "Live sync off"}
          </button>
          <button
            type="button"
            onClick={() => setPresenting(true)}
            disabled={!total}
            className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-stone-900"
          >
            <Play size={14} aria-hidden="true" /> Present
          </button>
        </div>
      </div>

      {/* the slide */}
      {loading || !page ? (
        <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-stone-100 text-sm text-stone-400">
          <Loader2 size={18} className="mr-2 animate-spin motion-reduce:animate-none" aria-hidden="true" />
          Loading slides…
        </div>
      ) : (
        <DeckCanvas page={page} />
      )}

      {/* controls */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={clampedCurrent === 0}
            className="inline-flex items-center gap-1 rounded-lg border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
          >
            <ChevronLeft size={16} aria-hidden="true" /> Prev
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            disabled={total === 0 || clampedCurrent === total - 1}
            className="inline-flex items-center gap-1 rounded-lg border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
          >
            Next <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
        <span className="text-xs font-medium text-stone-500">
          Slide {total ? clampedCurrent + 1 : 0} of {total}
          {source === "fallback" && " · sample slides"}
        </span>
      </div>

      {/* thumbnail rail */}
      {total > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {pages.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrent(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === clampedCurrent}
              className={`w-24 shrink-0 rounded-lg p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ${
                i === clampedCurrent ? "ring-2 ring-teal-600" : "ring-1 ring-stone-200"
              }`}
            >
              <DeckCanvas page={p} thumb />
            </button>
          ))}
        </div>
      )}

      {source === "fallback" && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Showing sample slides — drop a real export at{" "}
          <code className="font-mono">public/lesson.pdf</code> to present it.
        </p>
      )}

      {/* transcript capture — grounds the homework help; kept low-key */}
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
          <button
            type="button"
            onClick={toggleMic}
            disabled={!ready}
            className={`ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 disabled:opacity-50 ${
              speech.listening
                ? "bg-amber-500 text-white hover:bg-amber-600"
                : "border border-stone-300 text-stone-700 hover:bg-stone-100"
            }`}
          >
            {speech.listening ? (
              <>
                <MicOff size={13} aria-hidden="true" /> Stop
              </>
            ) : (
              <>
                <Mic size={13} aria-hidden="true" /> Capture speech
              </>
            )}
          </button>
          {mounted && !speech.supported && (
            <button
              type="button"
              onClick={() => {
                speech.setFinalText(BACKUP_TRANSCRIPT);
                void summarize(BACKUP_TRANSCRIPT);
              }}
              className="text-xs font-semibold text-teal-700 underline underline-offset-2 hover:text-teal-800"
            >
              Use backup
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
                <Loader2 size={13} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
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

      {/* Present mode — fullscreen, broadcasts to the class */}
      {presenting && page && (
        <div className="fixed inset-0 z-50 flex flex-col bg-stone-950 p-6">
          <div className="mb-4 flex items-center justify-between text-stone-300">
            <span className="inline-flex items-center gap-2 text-sm font-semibold">
              <span className="h-2 w-2 animate-pulse rounded-full bg-teal-400 motion-reduce:animate-none" />
              {broadcasting
                ? `Broadcasting to ${CONNECTED_COUNT} students`
                : "Live sync off"}
            </span>
            <button
              type="button"
              onClick={() => setPresenting(false)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-stone-800 px-3 py-1.5 text-sm font-semibold text-white hover:bg-stone-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <X size={15} aria-hidden="true" /> Exit (Esc)
            </button>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-5xl">
              <DeckCanvas page={page} />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-center gap-6 text-stone-300">
            <button
              type="button"
              onClick={() => go(-1)}
              disabled={clampedCurrent === 0}
              className="rounded-full bg-stone-800 p-3 hover:bg-stone-700 disabled:opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Previous slide"
            >
              <ChevronLeft size={22} aria-hidden="true" />
            </button>
            <span className="text-sm font-medium tabular-nums">
              {clampedCurrent + 1} / {total}
            </span>
            <button
              type="button"
              onClick={() => go(1)}
              disabled={clampedCurrent === total - 1}
              className="rounded-full bg-stone-800 p-3 hover:bg-stone-700 disabled:opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Next slide"
            >
              <ChevronRight size={22} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
