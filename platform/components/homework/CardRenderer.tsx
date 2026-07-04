"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  BadgeCheck,
  Check,
  CircleHelp,
  Lightbulb,
  ListChecks,
  Sparkles,
  X,
} from "lucide-react";
import type { HomeworkCard, Profile } from "@/lib/types";
import TtsPlayer from "@/components/slides/TtsPlayer";
import type { ProfileTheme } from "./profileTheme";

/** Text the TTS player reads for this card, in DESIGN.md order. */
export function cardSpeechText(card: HomeworkCard): string {
  switch (card.type) {
    case "concept":
      return `${card.heading}. ${card.body}`;
    case "mcq":
      return `${card.question}. Options: ${card.options
        .map((o, i) => `${String.fromCharCode(97 + i)}: ${o}`)
        .join(". ")}`;
    case "short":
      return card.question;
    case "steps":
      return `${card.question}. Steps: ${card.steps.join(". ")}`;
  }
}

/** Ask the cursor companion for help with the current card. */
function askAssistant() {
  window.dispatchEvent(new CustomEvent("assistant:ask", { detail: {} }));
}

/** Confusion-detector contract: fired whenever an MCQ option is chosen. */
function reportAnswer(correct: boolean) {
  window.dispatchEvent(new CustomEvent("hw:answer", { detail: { correct } }));
}

function StuckButton({ theme }: { theme: ProfileTheme }) {
  const dark = theme.id === "blind";
  return (
    <button
      type="button"
      onClick={askAssistant}
      className={`inline-flex items-center gap-2 rounded-lg border-2 px-4 py-2 text-sm font-semibold focus:outline-2 focus:outline-offset-2 ${
        dark
          ? "border-violet-400 bg-neutral-900 text-violet-300 hover:bg-neutral-800 focus:outline-violet-400"
          : "border-blue-600 bg-white text-blue-700 hover:bg-blue-50 focus:outline-blue-600"
      }`}
    >
      <CircleHelp size={16} aria-hidden="true" />
      I&apos;m stuck
    </button>
  );
}

function McqCard({
  card,
  theme,
}: {
  card: Extract<HomeworkCard, { type: "mcq" }>;
  theme: ProfileTheme;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const reduced = useReducedMotion();
  const answered = picked !== null;
  const correct = picked === card.correctIndex;
  const dark = theme.id === "blind";
  const visual = theme.features.visualFirst;

  const choose = (i: number) => {
    setPicked(i);
    reportAnswer(i === card.correctIndex);
  };

  // Blind keyboard nav: HomeworkExperience dispatches "hw:choose" for keys a–d.
  useEffect(() => {
    if (!theme.features.keyboardNav) return;
    const onChoose = (e: Event) => {
      const i = (e as CustomEvent<{ index: number }>).detail?.index;
      if (typeof i === "number" && i >= 0 && i < card.options.length) choose(i);
    };
    window.addEventListener("hw:choose", onChoose);
    return () => window.removeEventListener("hw:choose", onChoose);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card, theme.features.keyboardNav]);

  return (
    <div className="space-y-6">
      <p data-spot="question" className="font-semibold">
        {card.question}
      </p>
      <div className="space-y-3" role="group" aria-label="Answer options">
        {card.options.map((option, i) => {
          const isPick = picked === i;
          const isRight = answered && i === card.correctIndex;
          const wrongPick = isPick && !correct;
          const base = dark
            ? isRight
              ? "border-green-500 bg-green-950 text-green-100"
              : wrongPick
                ? "border-red-500 bg-red-950 text-red-100"
                : "border-neutral-600 bg-neutral-900 hover:border-violet-400"
            : isRight
              ? "border-green-700 bg-green-50"
              : wrongPick
                ? "border-red-700 bg-red-50"
                : "border-neutral-300 bg-white hover:border-blue-500";
          return (
            <motion.button
              key={i}
              type="button"
              data-spot={`option-${i}`}
              onClick={() => choose(i)}
              aria-pressed={isPick}
              animate={
                reduced || !visual
                  ? undefined
                  : isRight && isPick
                    ? {
                        boxShadow: [
                          "0 0 0 0 rgba(34,197,94,0.7)",
                          "0 0 0 14px rgba(34,197,94,0)",
                        ],
                        transition: { duration: 0.7, repeat: 1 },
                      }
                    : wrongPick
                      ? { x: [0, -7, 7, -5, 5, 0], transition: { duration: 0.4 } }
                      : undefined
              }
              className={`block w-full rounded-lg border-2 px-4 py-3 text-left text-base leading-relaxed focus:outline-2 focus:outline-offset-2 ${dark ? "focus:outline-violet-400" : "focus:outline-blue-600"} ${base}`}
            >
              <span
                className={`mr-2 font-mono text-sm ${dark ? "text-neutral-400" : "text-neutral-500"}`}
              >
                {String.fromCharCode(97 + i)})
              </span>
              {option}
              {isRight && (
                <span
                  className={`ml-2 inline-flex items-center gap-1 font-semibold ${dark ? "text-green-300" : "text-green-800"}`}
                >
                  {visual ? (
                    <BadgeCheck size={18} aria-hidden="true" />
                  ) : (
                    <Check size={16} aria-hidden="true" />
                  )}{" "}
                  Correct
                </span>
              )}
              {wrongPick && (
                <span
                  className={`ml-2 inline-flex items-center gap-1 font-semibold ${dark ? "text-red-300" : "text-red-800"}`}
                >
                  <X size={16} aria-hidden="true" /> Not quite
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
      <div aria-live="polite">
        {answered && (
          <p
            className={`rounded-lg border-l-4 p-4 ${
              correct
                ? dark
                  ? "border-green-500 bg-green-950 text-green-100"
                  : "border-green-700 bg-green-50 text-green-900"
                : dark
                  ? "border-amber-500 bg-amber-950 text-amber-100"
                  : "border-amber-600 bg-amber-50 text-amber-900"
            }`}
          >
            {correct
              ? card.explanation
              : "Have another look — try asking the helper if you're stuck."}
          </p>
        )}
      </div>
    </div>
  );
}

function ShortCard({
  card,
  theme,
}: {
  card: Extract<HomeworkCard, { type: "short" }>;
  theme: ProfileTheme;
}) {
  const [answer, setAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);
  const dark = theme.id === "blind";
  return (
    <div className="space-y-6">
      <p data-spot="question" className="whitespace-pre-line font-semibold">
        {card.question}
      </p>
      <div>
        <label
          htmlFor="short-answer"
          className={`mb-2 block text-sm font-semibold ${dark ? "text-neutral-300" : "text-neutral-700"}`}
        >
          Your answer
        </label>
        <textarea
          id="short-answer"
          data-spot="answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={4}
          className={`w-full rounded-lg border p-4 text-base leading-relaxed focus:outline-2 focus:outline-offset-2 ${
            dark
              ? "border-neutral-600 bg-neutral-950 text-neutral-50 focus:outline-violet-400"
              : "border-neutral-300 bg-white focus:outline-blue-600"
          }`}
        />
      </div>
      {!revealed ? (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className={`rounded-lg border px-4 py-2 text-sm font-semibold focus:outline-2 focus:outline-offset-2 ${
            dark
              ? "border-neutral-600 bg-neutral-900 text-neutral-100 hover:bg-neutral-800 focus:outline-violet-400"
              : "border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-100 focus:outline-blue-600"
          }`}
        >
          Check what a good answer includes
        </button>
      ) : (
        <div
          data-spot="model-points"
          className={`rounded-lg border-l-4 p-4 ${
            dark
              ? "border-violet-400 bg-neutral-800 text-neutral-100"
              : "border-blue-600 bg-blue-50"
          }`}
          aria-live="polite"
        >
          <p
            className={`mb-2 text-sm font-semibold ${dark ? "text-violet-300" : "text-blue-900"}`}
          >
            A good answer includes:
          </p>
          <ul
            className={`list-disc space-y-1 pl-5 ${dark ? "text-neutral-100" : "text-blue-950"}`}
          >
            {card.modelPoints.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function StepsCard({
  card,
  theme,
}: {
  card: Extract<HomeworkCard, { type: "steps" }>;
  theme: ProfileTheme;
}) {
  const [done, setDone] = useState<boolean[]>(() => card.steps.map(() => false));
  const reduced = useReducedMotion();
  const celebrate = theme.features.celebrations;
  const nextIndex = done.findIndex((v) => !v); // "do this now" emphasis
  const dark = theme.id === "blind";

  return (
    <div className="space-y-6">
      <p data-spot="question" className="font-semibold">
        {card.question}
      </p>
      <ol className="space-y-4">
        {card.steps.map((step, i) => {
          const isNext = celebrate && i === nextIndex;
          return (
            <li key={i} data-spot={`step-${i}`}>
              <motion.label
                animate={
                  celebrate && done[i] && !reduced
                    ? { scale: [1, 1.03, 1], transition: { duration: 0.35 } }
                    : undefined
                }
                className={`flex cursor-pointer items-start gap-4 rounded-lg border-2 p-4 ${
                  done[i]
                    ? dark
                      ? "border-green-500 bg-green-950"
                      : "border-green-700 bg-green-50"
                    : isNext
                      ? "border-amber-500 bg-amber-50 ring-2 ring-amber-300 ring-offset-2"
                      : dark
                        ? "border-neutral-600 bg-neutral-900"
                        : "border-neutral-300 bg-white"
                } ${celebrate && !done[i] && !isNext ? "opacity-60" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={done[i]}
                  onChange={() =>
                    setDone((d) => d.map((v, j) => (j === i ? !v : v)))
                  }
                  className="mt-1 size-5 accent-green-700"
                />
                <span className="flex-1">
                  {isNext && (
                    <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-amber-700">
                      Do this now
                    </span>
                  )}
                  <span
                    className={`mr-2 font-mono text-2xl font-bold ${dark ? "text-violet-300" : "text-blue-700"}`}
                  >
                    {i + 1}
                  </span>
                  <span
                    className={done[i] ? (dark ? "text-green-200" : "text-green-900") : ""}
                  >
                    {step}
                  </span>
                </span>
                {celebrate && done[i] && (
                  <motion.span
                    initial={reduced ? false : { scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="text-amber-500"
                    aria-hidden="true"
                  >
                    <Sparkles size={20} />
                  </motion.span>
                )}
              </motion.label>
            </li>
          );
        })}
      </ol>
      <p
        aria-live="polite"
        className={`text-sm font-semibold ${dark ? "text-green-300" : "text-green-800"}`}
      >
        {done.every(Boolean) && "All steps done — brilliant. Hit Next!"}
      </p>
    </div>
  );
}

const TYPE_ICON: Record<
  HomeworkCard["type"],
  { Icon: typeof Lightbulb; label: string }
> = {
  concept: { Icon: Lightbulb, label: "Idea from the lesson" },
  steps: { Icon: ListChecks, label: "Step-by-step task" },
  mcq: { Icon: CircleHelp, label: "Pick an answer" },
  short: { Icon: CircleHelp, label: "Write an answer" },
};

export default function CardRenderer({
  card,
  profile,
  theme,
}: {
  card: HomeworkCard;
  profile: Profile;
  theme: ProfileTheme;
}) {
  const isQuestion = card.type !== "concept";
  const dark = theme.id === "blind";
  const { Icon, label } = TYPE_ICON[card.type];

  return (
    <section
      aria-label={isQuestion ? "Homework question" : "Lesson recap"}
      className={theme.card}
    >
      {theme.features.visualFirst && (
        <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-teal-100 px-3 py-1 text-sm font-semibold text-teal-900">
          <Icon size={16} aria-hidden="true" />
          {label}
        </p>
      )}

      {card.type === "concept" ? (
        <div className="space-y-4">
          {!theme.features.reducedDecoration && (
            <p
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${
                dark
                  ? "bg-neutral-800 text-violet-300"
                  : theme.id === "deaf"
                    ? "bg-teal-50 text-teal-800"
                    : "bg-blue-50 text-blue-800"
              }`}
            >
              <Lightbulb size={14} aria-hidden="true" />
              {card.slideRef ? `From slide ${card.slideRef}` : "From the lesson"}
            </p>
          )}
          <h2 data-spot="question" className="text-2xl font-bold">
            {card.heading}
          </h2>
          <p>{card.body}</p>
        </div>
      ) : card.type === "mcq" ? (
        <McqCard card={card} theme={theme} />
      ) : card.type === "short" ? (
        <ShortCard card={card} theme={theme} />
      ) : (
        <StepsCard card={card} theme={theme} />
      )}

      <div
        className={`mt-8 flex flex-wrap items-center gap-3 border-t pt-6 ${dark ? "border-neutral-800" : "border-neutral-100"}`}
      >
        {theme.features.tts && <TtsPlayer text={cardSpeechText(card)} />}
        {isQuestion && <StuckButton theme={theme} />}
      </div>
    </section>
  );
}
