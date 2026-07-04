"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import { Mic, MicOff, Send, Sparkles, X } from "lucide-react";
import type { HomeworkCard, Profile, WalkthroughStep } from "@/lib/types";
import AnnotationLayer, { type SpotRect } from "./AnnotationLayer";
import { useSpeechRecognition } from "@/lib/useSpeechRecognition";

const MAX_ASSISTS = 3;

const CAPPED_MESSAGE =
  "You've had three helps on this one — now it's your turn. Have a real go, and if you're still stuck, ask your teacher. You've got this!";

const FALLBACK_STEPS: WalkthroughStep[] = [
  {
    say: "Let's slow down. Read the question one more time — I've underlined it for you.",
    spot: "question",
    draw: "underline",
  },
  {
    say: "What is it actually asking you to do? Say it in your own words first.",
    spot: "question",
    draw: "circle",
  },
  {
    say: "Now look back at the recap cards from the lesson — the idea you need is in there. Try it!",
  },
];

type Mode =
  | { kind: "follow" }
  | { kind: "ask" }
  | { kind: "loading" }
  | { kind: "capped" }
  | { kind: "step"; steps: WalkthroughStep[]; index: number };

function collectSpots(): { id: string; text: string }[] {
  return Array.from(document.querySelectorAll<HTMLElement>("[data-spot]")).map(
    (el) => ({
      id: el.dataset.spot ?? "",
      text: (el.textContent ?? "").trim().slice(0, 200),
    }),
  );
}

export default function Companion({
  profile,
  card,
  cardKey,
}: {
  profile: Profile;
  card: HomeworkCard;
  cardKey: string;
}) {
  const reduced = useReducedMotion();
  const [mode, setMode] = useState<Mode>({ kind: "follow" });
  const [question, setQuestion] = useState("");
  const [annotation, setAnnotation] = useState<{
    rect: SpotRect;
    draw?: WalkthroughStep["draw"];
  } | null>(null);
  const [assistCounts, setAssistCounts] = useState<Record<string, number>>({});
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const speech = useSpeechRecognition();

  // Reset the helper when the student moves to a new card (render-phase
  // state adjustment — the React-sanctioned alternative to a setState effect).
  const [prevCardKey, setPrevCardKey] = useState(cardKey);
  if (prevCardKey !== cardKey) {
    setPrevCardKey(cardKey);
    setMode({ kind: "follow" });
    setAnnotation(null);
    setQuestion("");
  }

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 150, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 150, damping: 18, mass: 0.4 });

  const dock = useCallback(() => {
    x.set(window.innerWidth - 96);
    y.set(window.innerHeight - 96);
  }, [x, y]);

  // Follow the cursor (or stay docked under reduced motion / while busy).
  useEffect(() => {
    dock();
    if (reduced) return;
    const onMove = (e: PointerEvent) => {
      setMode((m) => {
        if (m.kind === "follow") {
          x.set(Math.min(e.clientX + 24, window.innerWidth - 72));
          y.set(Math.min(e.clientY + 24, window.innerHeight - 72));
        }
        return m;
      });
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduced, x, y, dock]);

  const close = useCallback(() => {
    setMode({ kind: "follow" });
    setAnnotation(null);
    setQuestion("");
    window.speechSynthesis?.cancel();
    if (reduced) dock();
  }, [reduced, dock]);

  // Stop any speech left over from the previous card.
  useEffect(() => {
    window.speechSynthesis?.cancel();
  }, [cardKey]);

  const openAsk = useCallback(() => {
    if ((assistCounts[cardKey] ?? 0) >= MAX_ASSISTS) {
      setMode({ kind: "capped" });
      return;
    }
    setMode({ kind: "ask" });
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [cardKey, assistCounts]);

  // "I'm stuck" buttons + "/" shortcut.
  useEffect(() => {
    const onAsk = () => openAsk();
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "/" && !["TEXTAREA", "INPUT"].includes(t.tagName)) {
        e.preventDefault();
        openAsk();
      }
      if (e.key === "Escape") close();
    };
    window.addEventListener("assistant:ask", onAsk);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("assistant:ask", onAsk);
      window.removeEventListener("keydown", onKey);
    };
  }, [openAsk, close]);

  const showStep = useCallback(
    (steps: WalkthroughStep[], index: number) => {
      setMode({ kind: "step", steps, index });
      const step = steps[index];
      setAnnotation(null);
      if (step.spot) {
        const el = document.querySelector<HTMLElement>(
          `[data-spot="${CSS.escape(step.spot)}"]`,
        );
        if (el) {
          el.scrollIntoView({
            behavior: reduced ? "auto" : "smooth",
            block: "center",
          });
          // measure after the scroll settles
          setTimeout(
            () => {
              const r = el.getBoundingClientRect();
              if (!reduced) {
                x.set(Math.min(r.right + 20, window.innerWidth - 72));
                y.set(Math.max(r.top - 40, 8));
              }
              setAnnotation({
                rect: {
                  top: r.top,
                  left: r.left,
                  width: r.width,
                  height: r.height,
                },
                draw: step.draw ?? "circle",
              });
            },
            reduced ? 50 : 450,
          );
        }
      }
      if (profile === "blind") {
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(step.say));
      }
    },
    [profile, reduced, x, y],
  );

  const fullQuestion = [question, speech.finalText]
    .filter(Boolean)
    .join(" ")
    .trim();

  const ask = useCallback(async () => {
    const n = (assistCounts[cardKey] ?? 0) + 1;
    setAssistCounts((c) => ({ ...c, [cardKey]: n }));
    speech.stop();
    speech.setFinalText("");
    setMode({ kind: "loading" });
    let steps = FALLBACK_STEPS;
    try {
      const res = await fetch("/api/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: fullQuestion || "I'm stuck on this question.",
          card,
          profile,
          spots: collectSpots(),
          assistNumber: n,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { steps?: WalkthroughStep[] };
        if (data.steps?.length) steps = data.steps;
      }
    } catch {
      // fall through to FALLBACK_STEPS — never leave the student hanging
    }
    setQuestion("");
    showStep(steps, 0);
  }, [card, cardKey, profile, fullQuestion, assistCounts, speech, showStep]);

  const bubbleOpen = mode.kind !== "follow";
  const helpsLeft = MAX_ASSISTS - (assistCounts[cardKey] ?? 0);

  return (
    <>
      <AnnotationLayer rect={annotation?.rect ?? null} draw={annotation?.draw} />

      {/* The orb */}
      <motion.button
        type="button"
        onClick={() => (bubbleOpen ? close() : openAsk())}
        aria-label={bubbleOpen ? "Close helper" : "Ask the helper (or press /)"}
        style={{ x: sx, y: sy }}
        className="fixed left-0 top-0 z-50 flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-blue-500/40 focus:outline-2 focus:outline-offset-2 focus:outline-blue-600"
      >
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="size-1.5 animate-pulse rounded-full bg-white motion-reduce:animate-none" />
          <span className="size-1.5 animate-pulse rounded-full bg-white motion-reduce:animate-none" />
        </span>
      </motion.button>

      {/* The bubble — fixed panel, doesn't chase the cursor */}
      {bubbleOpen && (
        <div
          role="dialog"
          aria-label="Homework helper"
          className="fixed bottom-6 right-6 z-50 w-[22rem] max-w-[calc(100vw-3rem)] rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl"
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="inline-flex items-center gap-2 text-sm font-bold text-violet-700">
              <Sparkles size={16} aria-hidden="true" />
              Helper
            </p>
            <button
              type="button"
              onClick={close}
              aria-label="Close helper"
              className="rounded p-1 text-neutral-500 hover:bg-neutral-100 focus:outline-2 focus:outline-blue-600"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>

          <div aria-live="polite">
            {mode.kind === "ask" && (
              <div className="space-y-3">
                <label htmlFor="helper-q" className="text-sm text-neutral-700">
                  What are you stuck on? I&apos;ll guide you — I won&apos;t give
                  you the answer.
                </label>
                <textarea
                  id="helper-q"
                  ref={inputRef}
                  value={fullQuestion}
                  onChange={(e) => {
                    setQuestion(e.target.value);
                    if (speech.finalText) speech.setFinalText("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void ask();
                    }
                  }}
                  rows={2}
                  placeholder="e.g. I don't get what a reaction force is"
                  className="w-full rounded-lg border border-neutral-300 p-3 text-base focus:outline-2 focus:outline-offset-1 focus:outline-blue-600"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void ask()}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-2 focus:outline-offset-2 focus:outline-blue-600"
                  >
                    <Send size={14} aria-hidden="true" />
                    Help me think
                  </button>
                  {speech.supported && (
                    <button
                      type="button"
                      onClick={() =>
                        speech.listening ? speech.stop() : speech.start()
                      }
                      aria-label={
                        speech.listening ? "Stop voice input" : "Speak your question"
                      }
                      className={`rounded-lg border px-3 py-2 focus:outline-2 focus:outline-blue-600 ${
                        speech.listening
                          ? "border-red-600 bg-red-50 text-red-700"
                          : "border-neutral-300 text-neutral-700 hover:bg-neutral-100"
                      }`}
                    >
                      {speech.listening ? <MicOff size={16} /> : <Mic size={16} />}
                    </button>
                  )}
                  <span className="ml-auto font-mono text-xs text-neutral-500">
                    {helpsLeft} help{helpsLeft === 1 ? "" : "s"} left
                  </span>
                </div>
              </div>
            )}

            {mode.kind === "loading" && (
              <p className="text-base text-neutral-700">Thinking about the best way to help…</p>
            )}

            {mode.kind === "capped" && (
              <p className="text-base leading-relaxed text-neutral-800">{CAPPED_MESSAGE}</p>
            )}

            {mode.kind === "step" && (
              <div className="space-y-4">
                <p className="font-mono text-xs text-neutral-500">
                  Step {mode.index + 1} of {mode.steps.length}
                </p>
                <p className="text-base leading-relaxed text-neutral-900">
                  {mode.steps[mode.index].say}
                </p>
                {mode.index + 1 < mode.steps.length ? (
                  <button
                    type="button"
                    onClick={() => showStep(mode.steps, mode.index + 1)}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-2 focus:outline-offset-2 focus:outline-blue-600"
                  >
                    Next step
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={close}
                    className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 focus:outline-2 focus:outline-offset-2 focus:outline-green-700"
                  >
                    Got it — my turn
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
