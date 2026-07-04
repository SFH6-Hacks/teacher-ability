"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  useVelocity,
  type AnimationPlaybackControls,
} from "framer-motion";
import { Mic, MicOff, Send } from "lucide-react";
import type {
  HelpGate,
  HelpPlan,
  HelpStep,
  HomeworkCard,
  Profile,
} from "@/lib/types";
import { useSpeechRecognition } from "@/lib/useSpeechRecognition";
import AnnotationLayer, { type StrokeGeometry } from "./AnnotationLayer";
import DiagramCanvas from "./DiagramCanvas";
import MascotFace, { type Expression } from "./MascotFace";
import SpeechBubble, { Typewriter, type BubbleSide } from "./SpeechBubble";
import { buildFallbackPlan } from "./fallbackPlans";
import { captureContext } from "./capture";
import { useConfusionDetector } from "./useConfusionDetector";

const MAX_ASSISTS = 3;
const SIZE = 64; // mascot px (size-16)
const BUBBLE_H = 340; // worst-case bubble height budget for side/clamp maths
const PEN = { x: 54, y: 54 }; // crayon tip offset within the mascot's body

const CAPPED_MESSAGE =
  "You've had three helps on this one — now it's your turn. Have a real go, and if you're still stuck, ask your teacher. You've got this!";

const OFFER_MESSAGE = "You look a bit stuck — want a hand?";
const LOADING_MESSAGE = "Let me look at your screen… 👀";

type Mode =
  | { kind: "follow" }
  | { kind: "ask" }
  | { kind: "loading" }
  | { kind: "offer"; reason: string }
  | { kind: "plan"; plan: HelpPlan; index: number }
  | { kind: "done" }
  | { kind: "capped" };

function pickVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find(
      (v) => v.lang.startsWith("en") && /natural|neural|google/i.test(v.name),
    ) ??
    voices.find((v) => v.lang.startsWith("en")) ??
    null
  );
}

function speak(text: string, onSpeaking?: (on: boolean) => void) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const voice = pickVoice();
  if (voice) u.voice = voice;
  u.rate = 1;
  u.pitch = 1.15;
  u.onstart = () => onSpeaking?.(true);
  u.onend = () => onSpeaking?.(false);
  u.onerror = () => onSpeaking?.(false);
  window.speechSynthesis.speak(u);
}

function gateSpot(step: HelpStep): string | undefined {
  return (
    step.pointer?.targetSpot ?? step.pointer?.to?.spot ?? step.pointer?.from?.spot
  );
}

/** Client fallback when /api/assist/check is down: share ≥1 significant word. */
function looseMatch(answer: string, expected: string): boolean {
  const norm = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean);
  const expectedWords = new Set(norm(expected).filter((w) => w.length > 3));
  return norm(answer).some((w) => expectedWords.has(w));
}

// ---------------------------------------------------------------------------
// Mini-check gate UI (one tiny question the student must answer to advance).
// ---------------------------------------------------------------------------

function MiniCheck({
  gate,
  profile,
  onPass,
}: {
  gate: HelpGate;
  profile: Profile;
  onPass: () => void;
}) {
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [fails, setFails] = useState(0);
  const [checking, setChecking] = useState(false);
  const speech = useSpeechRecognition();

  const fullAnswer = [answer, speech.finalText].filter(Boolean).join(" ").trim();

  const submit = async () => {
    if (!fullAnswer || checking) return;
    speech.stop();
    setChecking(true);
    let verdict: "pass" | "close" | "retry" = "retry";
    let say = "Close — have one more think about it!";
    try {
      const res = await fetch("/api/assist/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: gate.question,
          expected: gate.expected,
          answer: fullAnswer,
          profile,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { verdict?: typeof verdict; say?: string };
        if (data.verdict) verdict = data.verdict;
        if (data.say) say = data.say;
      } else {
        verdict = looseMatch(fullAnswer, gate.expected ?? "") ? "pass" : "retry";
      }
    } catch {
      verdict = looseMatch(fullAnswer, gate.expected ?? "") ? "pass" : "retry";
    }
    setChecking(false);
    if (verdict === "pass") {
      onPass();
      return;
    }
    setFeedback(say);
    setFails((f) => f + 1);
    setAnswer("");
    speech.setFinalText("");
  };

  return (
    <div className="space-y-2">
      <p className="font-semibold text-neutral-900">{gate.question}</p>
      {feedback && <p className="text-sm text-violet-700">{feedback}</p>}
      {fails < 2 ? (
        <div className="flex items-center gap-2">
          <input
            value={fullAnswer}
            onChange={(e) => {
              setAnswer(e.target.value);
              if (speech.finalText) speech.setFinalText("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void submit();
              }
            }}
            placeholder="Type your answer…"
            aria-label="Your answer"
            className="w-full min-w-0 flex-1 rounded-lg border border-neutral-300 p-2 text-base focus:outline-2 focus:outline-offset-1 focus:outline-blue-600"
          />
          {speech.supported && (
            <button
              type="button"
              onClick={() => (speech.listening ? speech.stop() : speech.start())}
              aria-label={speech.listening ? "Stop voice input" : "Speak your answer"}
              className={`rounded-lg border px-2.5 py-2 focus:outline-2 focus:outline-blue-600 ${
                speech.listening
                  ? "border-red-600 bg-red-50 text-red-700"
                  : "border-neutral-300 text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              {speech.listening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
          )}
          <button
            type="button"
            onClick={() => void submit()}
            disabled={checking || !fullAnswer}
            aria-label="Check my answer"
            className="rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 disabled:opacity-50 focus:outline-2 focus:outline-offset-2 focus:outline-blue-600"
          >
            <Send size={16} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onPass}
          className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 focus:outline-2 focus:outline-offset-2 focus:outline-green-700"
        >
          Got it — my turn
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// The mascot itself.
// ---------------------------------------------------------------------------

export default function Companion({
  profile,
  card,
  cardKey,
  studentId,
  cardIndex,
}: {
  profile: Profile;
  card: HomeworkCard;
  cardKey: string;
  studentId?: string;
  cardIndex?: number;
}) {
  const reduced = useReducedMotion();
  const [mode, setMode] = useState<Mode>({ kind: "follow" });
  const [question, setQuestion] = useState("");
  const [assistCounts, setAssistCounts] = useState<Record<string, number>>({});
  const [pupil, setPupil] = useState({ x: 0, y: 0 });
  const [happyFlash, setHappyFlash] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const [diagramOpen, setDiagramOpen] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [wobble, setWobble] = useState(0);
  const [bubbleSide, setBubbleSide] = useState<BubbleSide>("above");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drawingRef = useRef(false);
  const drawTokenRef = useRef(0);
  const tracedTokenRef = useRef(0);
  const controlsRef = useRef<AnimationPlaybackControls[]>([]);
  const speech = useSpeechRecognition();

  // Annotation pointer for the current step (measured after scroll settles).
  const [pointer, setPointer] = useState<HelpStep["pointer"] | null>(null);

  // Reset when the student moves to a new card (render-phase adjustment).
  const [prevCardKey, setPrevCardKey] = useState(cardKey);
  if (prevCardKey !== cardKey) {
    setPrevCardKey(cardKey);
    setMode({ kind: "follow" });
    setPointer(null);
    setQuestion("");
  }

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 150, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 150, damping: 18, mass: 0.4 });
  // lean into the direction of travel — sells the "flying" feel for free
  const vx = useVelocity(sx);
  const lean = useTransform(vx, [-1500, 1500], [-9, 9], { clamp: true });
  const progress = useMotionValue(0);

  // The bubble hides while the mascot is mid-flight drawing an annotation.
  const bubbleOpen = mode.kind !== "follow" && !drawing;

  const stopFlight = useCallback(() => {
    for (const c of controlsRef.current) c.stop();
    controlsRef.current = [];
  }, []);

  // Follow the cursor while idle (the mascot settles in place — never a
  // corner — whenever it has something to say), and always aim the pupils
  // at the cursor.
  useEffect(() => {
    // initial perch (also the resting spot on touch devices / reduced motion)
    x.set(window.innerWidth - SIZE - 24);
    y.set(window.innerHeight - SIZE - 24);
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      setMode((m) => {
        if (m.kind === "follow" && !reduced) {
          x.set(Math.min(e.clientX + 24, window.innerWidth - SIZE - 8));
          y.set(Math.min(e.clientY + 24, window.innerHeight - SIZE - 8));
        }
        return m;
      });
      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = 0;
          const cx = sx.get() + SIZE / 2;
          const cy = sy.get() + SIZE / 2;
          const dx = e.clientX - cx;
          const dy = e.clientY - cy;
          setPupil({
            x: Math.max(-3, Math.min(3, dx / 50)),
            y: Math.max(-3, Math.min(3, dy / 50)),
          });
        });
      }
    };
    window.addEventListener("pointermove", onMove);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, [reduced, x, y, sx, sy]);

  // When a bubble opens, the mascot settles right where it is: just pick the
  // side with room for the bubble and nudge within the viewport. No corner.
  // Layout effect so the side is right before the bubble's first paint.
  useLayoutEffect(() => {
    if (!bubbleOpen) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const below = y.get() + SIZE + BUBBLE_H + 16 < vh;
    setBubbleSide(below ? "below" : "above");
    x.set(Math.min(Math.max(x.get(), 8), vw - SIZE - 8));
    y.set(
      below
        ? Math.min(Math.max(y.get(), 8), vh - SIZE - 8)
        : Math.max(y.get(), BUBBLE_H + 24),
    );
  }, [bubbleOpen, x, y]);

  // Stop any leftover speech / flight when the card changes.
  useEffect(() => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    stopFlight();
    drawingRef.current = false;
    setDrawing(false);
    progress.set(0);
  }, [cardKey, stopFlight, progress]);

  const close = useCallback(() => {
    setMode({ kind: "follow" });
    setPointer(null);
    setQuestion("");
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    stopFlight();
    drawingRef.current = false;
    setDrawing(false);
    progress.set(0);
  }, [stopFlight, progress]);

  const flashHappy = useCallback((ms = 800) => {
    setHappyFlash(true);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setHappyFlash(false), ms);
  }, []);

  // The mascot talks to everyone except deaf students (they get the wide,
  // text-first bubble instead). The face lip-syncs while it speaks.
  const speakAloud = useCallback(
    (text: string) => {
      if (profile !== "deaf") speak(text, setSpeaking);
    },
    [profile],
  );

  const openAsk = useCallback(() => {
    if ((assistCounts[cardKey] ?? 0) >= MAX_ASSISTS) {
      setMode({ kind: "capped" });
      speakAloud(CAPPED_MESSAGE);
      return;
    }
    setMode({ kind: "ask" });
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [cardKey, assistCounts, speakAloud]);

  // ---- confusion detection -------------------------------------------------
  const { trigger, clear } = useConfusionDetector({
    cardKey,
    enabled: mode.kind === "follow",
  });

  // Render-phase adjustment: a fresh trigger flips us straight into offer mode.
  if (trigger) {
    if (mode.kind === "follow" && (assistCounts[cardKey] ?? 0) < MAX_ASSISTS) {
      // being shaken visibly rattles the mascot before it offers help
      if (trigger.reason === "mouse-shake") setWobble((w) => w + 1);
      setMode({ kind: "offer", reason: trigger.reason });
    }
    clear();
  }

  // The offer is spoken so it lands even if the student isn't looking at it.
  useEffect(() => {
    if (mode.kind === "offer") speakAloud(OFFER_MESSAGE);
  }, [mode.kind, speakAloud]);

  // ---- the help plan flow --------------------------------------------------

  // Guard against double-advancing (Enter + click + gate all racing).
  const advancingRef = useRef(false);
  const modeRef = useRef<Mode>(mode);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  /**
   * Drawing finished (or never got going): land the mascot beside what it just
   * drew, pop the bubble from its mouth there, and say the step out loud.
   */
  const finishDraw = useCallback(
    (token: number) => {
      if (drawTokenRef.current !== token || !drawingRef.current) return;
      stopFlight();
      progress.set(1); // leave the annotation fully drawn
      drawingRef.current = false;
      setDrawing(false);
      const m = modeRef.current;
      if (m.kind !== "plan") return;
      const step = m.plan.steps[m.index];
      const spot = gateSpot(step);
      const el = spot
        ? document.querySelector<HTMLElement>(`[data-spot="${CSS.escape(spot)}"]`)
        : null;
      const r = el?.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      let tx = x.get();
      let ty = y.get();
      if (r) {
        // perch beside the target: right if there's room, else left
        tx =
          r.right + SIZE + 40 < vw
            ? r.right + 24
            : Math.max(8, r.left - SIZE - 24);
        ty = r.top + r.height / 2 - SIZE / 2;
      }
      const below = ty + SIZE + BUBBLE_H + 16 < vh;
      setBubbleSide(below ? "below" : "above");
      tx = Math.min(Math.max(tx, 8), vw - SIZE - 8);
      ty = below
        ? Math.min(Math.max(ty, 8), vh - SIZE - 8)
        : Math.max(ty, BUBBLE_H + 24);
      x.set(tx);
      y.set(ty);
      speakAloud(step.say);
    },
    [stopFlight, progress, x, y, speakAloud],
  );

  /**
   * AnnotationLayer measured its strokes: ride the pen tip. The mascot's x/y
   * follow pointAt(t) while the same progress value reveals the strokes, so
   * the drawing literally comes out of the mascot's crayon.
   */
  const handleGeometry = useCallback(
    (g: StrokeGeometry) => {
      const token = drawTokenRef.current;
      if (!drawingRef.current || tracedTokenRef.current === token) return;
      tracedTokenRef.current = token;
      progress.set(0);
      const duration = Math.min(2.4, Math.max(0.8, g.total / 650));
      controlsRef.current.push(
        animate(progress, 1, {
          duration,
          ease: "easeInOut",
          onUpdate: (t) => {
            const p = g.pointAt(t);
            x.set(p.x - PEN.x);
            y.set(p.y - PEN.y);
          },
          onComplete: () => finishDraw(token),
        }),
      );
    },
    [progress, x, y, finishDraw],
  );

  const showStep = useCallback(
    (plan: HelpPlan, index: number) => {
      setMode({ kind: "plan", plan, index });
      setPointer(null);
      setShowSkip(false);
      setDiagramOpen(true);
      stopFlight();
      const step = plan.steps[index];

      const spot = step.pointer ? gateSpot(step) : undefined;
      const el = spot
        ? document.querySelector<HTMLElement>(`[data-spot="${CSS.escape(spot)}"]`)
        : null;
      if (profile !== "blind" && step.pointer && el) {
        el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
      }

      // Full performance (fly + trace) only when there's something to draw
      // and motion is welcome; otherwise annotate in place as before.
      const perform = profile !== "blind" && !reduced && !!step.pointer && !!el;
      if (!perform) {
        if (profile !== "blind" && step.pointer) {
          setTimeout(() => setPointer(step.pointer ?? null), reduced ? 50 : 450);
        }
        speakAloud(step.say);
        return;
      }

      drawingRef.current = true;
      setDrawing(true);
      const token = ++drawTokenRef.current;
      // wait for the smooth scroll to settle before measuring anything
      setTimeout(() => {
        if (drawTokenRef.current !== token || !drawingRef.current) return;
        const r = el!.getBoundingClientRect();
        // fly to the target, crayon at the ready
        controlsRef.current.push(
          animate(x, Math.max(8, r.left - SIZE - 12), {
            type: "spring",
            stiffness: 140,
            damping: 17,
          }),
          animate(y, Math.max(8, r.top - SIZE - 4), {
            type: "spring",
            stiffness: 140,
            damping: 17,
          }),
        );
        progress.set(0);
        setPointer(step.pointer ?? null); // AnnotationLayer measures → handleGeometry traces
        // if no strokes materialise (missing spot etc.), don't leave the kid waiting
        setTimeout(() => {
          if (drawTokenRef.current === token && tracedTokenRef.current !== token) {
            finishDraw(token);
          }
        }, 1000);
      }, 450);
    },
    [profile, reduced, speakAloud, stopFlight, progress, x, y, finishDraw],
  );

  const advance = useCallback(
    (plan: HelpPlan, index: number) => {
      if (advancingRef.current) return;
      advancingRef.current = true;
      flashHappy();
      window.speechSynthesis?.cancel();
      setTimeout(() => {
        advancingRef.current = false;
        // The student may have changed card (or closed) during the happy beat.
        const m = modeRef.current;
        if (m.kind !== "plan" || m.plan !== plan || m.index !== index) return;
        if (index + 1 < plan.steps.length) {
          showStep(plan, index + 1);
        } else {
          setMode({ kind: "done" });
          setPointer(null);
          const cheer =
            profile === "adhd"
              ? "BOOM — you powered through it. Go get the next one!"
              : "Nice thinking — now finish it off yourself. You've got this!";
          speakAloud(cheer);
          setTimeout(() => {
            setMode((m) => (m.kind === "done" ? { kind: "follow" } : m));
          }, 2600);
        }
      }, 800);
    },
    [flashHappy, showStep, profile, speakAloud],
  );

  const runHelp = useCallback(
    async (askText?: string, reason?: string) => {
      const n = (assistCounts[cardKey] ?? 0) + 1;
      setAssistCounts((c) => ({ ...c, [cardKey]: n }));
      if (studentId) {
        // fire-and-forget: the teacher dashboard tracks assist usage
        fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId, event: "assist", cardIndex }),
        }).catch(() => {});
      }
      speech.stop();
      speech.setFinalText("");
      setQuestion("");
      setMode({ kind: "loading" });

      let plan: HelpPlan | null = null;
      try {
        const ctx = await captureContext();
        const res = await fetch("/api/assist/vision", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: askText || undefined,
            reason,
            card,
            profile,
            registry: ctx.registry,
            viewport: ctx.viewport,
            imageBase64: ctx.imageBase64 ?? undefined,
            assistNumber: n,
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as { plan?: HelpPlan };
          if (data.plan?.steps?.length) plan = data.plan;
        }
      } catch {
        // fall through to the canned plan — never leave the student hanging
      }
      showStep(plan ?? buildFallbackPlan(card, profile), 0);
    },
    [assistCounts, cardKey, studentId, cardIndex, speech, card, profile, showStep],
  );

  // ---- gates ---------------------------------------------------------------

  const step = mode.kind === "plan" ? mode.plan.steps[mode.index] : null;

  // What the step's gate effectively is on THIS screen for THIS student:
  // blind students always advance by button/Enter, and a hover/click gate
  // whose target element is missing degrades to got-it (never trap anyone).
  let resolvedGate: HelpGate["type"] = "got-it";
  if (step) {
    resolvedGate = profile === "blind" ? "got-it" : (step.gate?.type ?? "got-it");
    if (resolvedGate === "hover-target" || resolvedGate === "click-target") {
      const spot = gateSpot(step);
      const el =
        typeof document !== "undefined" && spot
          ? document.querySelector<HTMLElement>(
              `[data-spot="${CSS.escape(spot)}"]`,
            )
          : null;
      if (!el) resolvedGate = "got-it";
    }
  }

  // Wire hover/click gates: one-shot listener on the target element.
  useEffect(() => {
    if (mode.kind !== "plan") return;
    if (resolvedGate !== "hover-target" && resolvedGate !== "click-target") return;
    const s = mode.plan.steps[mode.index];
    const spot = gateSpot(s);
    const el = spot
      ? document.querySelector<HTMLElement>(`[data-spot="${CSS.escape(spot)}"]`)
      : null;
    if (!el) return;
    const plan = mode.plan;
    const index = mode.index;
    const event = resolvedGate === "hover-target" ? "pointerenter" : "click";
    const onHit = () => advance(plan, index);
    el.addEventListener(event, onHit, { once: true });
    const skipTimer = setTimeout(() => setShowSkip(true), 10_000);
    return () => {
      el.removeEventListener(event, onHit);
      clearTimeout(skipTimer);
    };
  }, [mode, resolvedGate, advance]);

  // Keyboard shortcuts: "/" ask, Escape close, Enter advances got-it gates,
  // plus the homework UI's "assistant:ask" event.
  useEffect(() => {
    const onAsk = () => openAsk();
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = ["TEXTAREA", "INPUT"].includes(t.tagName);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        openAsk();
      }
      if (e.key === "Escape") close();
      if (e.key === "Enter" && !typing && t.tagName !== "BUTTON") {
        if (mode.kind === "plan" && resolvedGate === "got-it") {
          e.preventDefault();
          advance(mode.plan, mode.index);
        } else if (mode.kind === "done") {
          close();
        }
      }
    };
    window.addEventListener("assistant:ask", onAsk);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("assistant:ask", onAsk);
      window.removeEventListener("keydown", onKey);
    };
  }, [openAsk, close, mode, resolvedGate, advance]);

  // ---- render --------------------------------------------------------------

  const expression: Expression = happyFlash
    ? "happy"
    : mode.kind === "loading"
      ? "thinking"
      : mode.kind === "offer"
        ? "concerned"
        : mode.kind === "done"
          ? "happy"
          : "idle";

  const fullQuestion = [question, speech.finalText].filter(Boolean).join(" ").trim();
  const helpsLeft = MAX_ASSISTS - (assistCounts[cardKey] ?? 0);
  const instantText = profile === "blind";
  const showAnnotations = profile !== "blind";

  const gotItButton = (label = "Got it") =>
    mode.kind === "plan" && (
      <button
        type="button"
        onClick={() => advance(mode.plan, mode.index)}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-2 focus:outline-offset-2 focus:outline-blue-600"
      >
        {label}
      </button>
    );

  return (
    <>
      {showAnnotations && (
        <AnnotationLayer
          pointer={pointer ?? null}
          progress={reduced ? undefined : progress}
          onGeometry={handleGeometry}
        />
      )}
      {showAnnotations && step?.diagram && diagramOpen && (
        <DiagramCanvas
          diagram={step.diagram}
          profile={profile}
          onClose={() => setDiagramOpen(false)}
        />
      )}

      {/* The mascot */}
      <motion.button
        type="button"
        onClick={() => (bubbleOpen ? close() : openAsk())}
        aria-label={bubbleOpen ? "Close helper" : "Ask the helper (or press /)"}
        style={{ x: sx, y: sy, rotate: reduced ? 0 : lean }}
        className="fixed left-0 top-0 z-[70] size-16 rounded-3xl bg-gradient-to-br from-blue-500 to-violet-600 p-1 shadow-lg shadow-blue-500/40 focus:outline-2 focus:outline-offset-2 focus:outline-blue-600"
      >
        <motion.div
          key={wobble}
          animate={
            wobble && !reduced ? { rotate: [0, -14, 12, -9, 6, 0] } : { rotate: 0 }
          }
          transition={{ duration: 0.5 }}
          className="size-full"
        >
          <MascotFace
            expression={expression}
            pupilOffset={pupil}
            speaking={speaking}
          />
        </motion.div>
        {drawing && (
          <span
            aria-hidden="true"
            className="absolute -bottom-2 -right-2 rotate-90 text-xl"
          >
            ✏️
          </span>
        )}
      </motion.button>

      {bubbleOpen && (
        <SpeechBubble
          // remount on side flip: framer keeps stale top/bottom inline styles
          key={bubbleSide}
          profile={profile}
          onClose={close}
          mx={sx}
          my={sy}
          side={bubbleSide}
        >
          {mode.kind === "ask" && (
            <div className="space-y-3">
              <label htmlFor="helper-q" className="text-sm text-neutral-700">
                What are you stuck on? I&apos;ll guide you — I won&apos;t give you
                the answer.
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
                    void runHelp(fullQuestion || "I'm stuck on this question.");
                  }
                }}
                rows={2}
                placeholder="e.g. I don't get what a reaction force is"
                className="w-full rounded-lg border border-neutral-300 p-3 text-base focus:outline-2 focus:outline-offset-1 focus:outline-blue-600"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    void runHelp(fullQuestion || "I'm stuck on this question.")
                  }
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
            <p className="text-base text-neutral-700">{LOADING_MESSAGE}</p>
          )}

          {mode.kind === "offer" && (
            <div className="space-y-4">
              <p className="text-base leading-relaxed text-neutral-900">
                <Typewriter text={OFFER_MESSAGE} instant={instantText} />
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void runHelp(undefined, mode.reason)}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-2 focus:outline-offset-2 focus:outline-blue-600"
                >
                  Yes, help me
                </button>
                <button
                  type="button"
                  onClick={close}
                  className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 focus:outline-2 focus:outline-offset-2 focus:outline-blue-600"
                >
                  I&apos;m fine
                </button>
              </div>
            </div>
          )}

          {mode.kind === "capped" && (
            <p className="text-base leading-relaxed text-neutral-800">
              {CAPPED_MESSAGE}
            </p>
          )}

          {mode.kind === "done" && (
            <p className="text-base leading-relaxed text-neutral-900">
              {profile === "adhd"
                ? "BOOM — you powered through it. Go get the next one! 🎉"
                : "Nice thinking — now finish it off yourself. You've got this! ✨"}
            </p>
          )}

          {mode.kind === "plan" && step && (
            <div className="space-y-4">
              {profile !== "adhd" && (
                <p className="font-mono text-xs text-neutral-500">
                  Step {mode.index + 1} of {mode.plan.steps.length}
                </p>
              )}
              <p className="text-base leading-relaxed text-neutral-900">
                <Typewriter text={step.say} instant={instantText} />
              </p>

              {resolvedGate === "got-it" && gotItButton(
                mode.index + 1 < mode.plan.steps.length ? "Got it" : "Got it — my turn",
              )}

              {(resolvedGate === "hover-target" || resolvedGate === "click-target") && (
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold text-violet-700">
                    {resolvedGate === "hover-target"
                      ? "Move your mouse to the part I marked →"
                      : "Click the part I marked →"}
                  </p>
                  {showSkip && (
                    <button
                      type="button"
                      onClick={() => advance(mode.plan, mode.index)}
                      className="ml-auto text-xs text-neutral-500 underline hover:text-neutral-700 focus:outline-2 focus:outline-blue-600"
                    >
                      skip →
                    </button>
                  )}
                </div>
              )}

              {resolvedGate === "mini-check" && (
                <MiniCheck
                  key={`${cardKey}-${mode.index}`}
                  gate={step.gate}
                  profile={profile}
                  onPass={() => advance(mode.plan, mode.index)}
                />
              )}
            </div>
          )}
        </SpeechBubble>
      )}
    </>
  );
}
