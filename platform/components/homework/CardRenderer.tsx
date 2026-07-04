"use client";

import { useEffect, useState } from "react";
import { CircleHelp, Lightbulb, ListChecks } from "lucide-react";
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
    // Steps are on-demand hints now, so read only the question aloud.
    case "steps":
      return card.question;
  }
}

/** Ask the cursor companion for help with the current card. */
function askAssistant() {
  window.dispatchEvent(new CustomEvent("assistant:ask", { detail: {} }));
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

interface AnswerProps {
  answer: string;
  onAnswer: (value: string) => void;
  readOnly: boolean;
}

function McqCard({
  card,
  theme,
  answer,
  onAnswer,
  readOnly,
}: {
  card: Extract<HomeworkCard, { type: "mcq" }>;
  theme: ProfileTheme;
} & AnswerProps) {
  const dark = theme.id === "blind";
  const pickedIndex = card.options.indexOf(answer);

  // Selection only — no correct/incorrect marking. A neutral "hw:selected"
  // event lets the blind flow confirm the choice without revealing an answer.
  const choose = (i: number) => {
    if (readOnly) return;
    onAnswer(card.options[i]);
    window.dispatchEvent(new CustomEvent("hw:selected"));
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
  }, [card, theme.features.keyboardNav, readOnly]);

  return (
    <div className="space-y-6">
      <p data-spot="question" className="font-semibold">
        {card.question}
      </p>
      <div className="space-y-3" role="group" aria-label="Answer options">
        {card.options.map((option, i) => {
          const isPick = pickedIndex === i;
          const base = dark
            ? isPick
              ? "border-violet-400 bg-neutral-800"
              : "border-neutral-600 bg-neutral-900 hover:border-violet-400"
            : isPick
              ? "border-blue-600 bg-blue-50"
              : "border-neutral-300 bg-white hover:border-blue-500";
          return (
            <button
              key={i}
              type="button"
              data-spot={`option-${i}`}
              onClick={() => choose(i)}
              aria-pressed={isPick}
              disabled={readOnly}
              className={`block w-full rounded-lg border-2 px-4 py-3 text-left text-base leading-relaxed disabled:cursor-default focus:outline-2 focus:outline-offset-2 ${dark ? "focus:outline-violet-400" : "focus:outline-blue-600"} ${base}`}
            >
              <span
                className={`mr-2 font-mono text-sm ${dark ? "text-neutral-400" : "text-neutral-500"}`}
              >
                {String.fromCharCode(97 + i)})
              </span>
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ShortCard({
  card,
  theme,
  answer,
  onAnswer,
  readOnly,
}: {
  card: Extract<HomeworkCard, { type: "short" }>;
  theme: ProfileTheme;
} & AnswerProps) {
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
          onChange={(e) => onAnswer(e.target.value)}
          readOnly={readOnly}
          rows={4}
          className={`w-full rounded-lg border p-4 text-base leading-relaxed read-only:opacity-70 focus:outline-2 focus:outline-offset-2 ${
            dark
              ? "border-neutral-600 bg-neutral-950 text-neutral-50 focus:outline-violet-400"
              : "border-neutral-300 bg-white focus:outline-blue-600"
          }`}
        />
      </div>
      {card.modelPoints.length > 0 &&
        (!revealed ? (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className={`rounded-lg border px-4 py-2 text-sm font-semibold focus:outline-2 focus:outline-offset-2 ${
              dark
                ? "border-neutral-600 bg-neutral-900 text-neutral-100 hover:bg-neutral-800 focus:outline-violet-400"
                : "border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-100 focus:outline-blue-600"
            }`}
          >
            Give me a hint
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
        ))}
    </div>
  );
}

function StepsCard({
  card,
  theme,
  answer,
  onAnswer,
  readOnly,
}: {
  card: Extract<HomeworkCard, { type: "steps" }>;
  theme: ProfileTheme;
} & AnswerProps) {
  // Steps are hints, revealed one at a time only when the student asks — so
  // they get scaffolding without being handed the whole method up front.
  const [shown, setShown] = useState(0);
  const dark = theme.id === "blind";
  return (
    <div className="space-y-6">
      <p data-spot="question" className="font-semibold">
        {card.question}
      </p>
      <div>
        <label
          htmlFor="steps-answer"
          className={`mb-2 block text-sm font-semibold ${dark ? "text-neutral-300" : "text-neutral-700"}`}
        >
          Your answer
        </label>
        <textarea
          id="steps-answer"
          data-spot="answer"
          value={answer}
          onChange={(e) => onAnswer(e.target.value)}
          readOnly={readOnly}
          rows={4}
          className={`w-full rounded-lg border p-4 text-base leading-relaxed read-only:opacity-70 focus:outline-2 focus:outline-offset-2 ${
            dark
              ? "border-neutral-600 bg-neutral-950 text-neutral-50 focus:outline-violet-400"
              : "border-neutral-300 bg-white focus:outline-blue-600"
          }`}
        />
      </div>

      {shown > 0 && (
        <ol data-spot="hints" className="space-y-2" aria-live="polite">
          {card.steps.slice(0, shown).map((step, i) => (
            <li
              key={i}
              className={`flex items-start gap-3 rounded-lg border-l-4 border-amber-500 p-3 ${
                dark ? "bg-amber-950 text-amber-100" : "bg-amber-50 text-amber-950"
              }`}
            >
              <span className="font-mono text-lg font-bold text-amber-600">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      )}

      {shown < card.steps.length && (
        <button
          type="button"
          onClick={() => setShown((n) => n + 1)}
          className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold focus:outline-2 focus:outline-offset-2 ${
            dark
              ? "border-neutral-600 bg-neutral-900 text-neutral-100 hover:bg-neutral-800 focus:outline-violet-400"
              : "border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-100 focus:outline-blue-600"
          }`}
        >
          <Lightbulb size={16} aria-hidden="true" />
          {shown === 0 ? "Give me a hint" : "Next hint"}
        </button>
      )}
    </div>
  );
}

const TYPE_ICON: Record<
  HomeworkCard["type"],
  { Icon: typeof Lightbulb; label: string }
> = {
  concept: { Icon: Lightbulb, label: "Idea from the lesson" },
  steps: { Icon: ListChecks, label: "Work it through" },
  mcq: { Icon: CircleHelp, label: "Pick an answer" },
  short: { Icon: CircleHelp, label: "Write an answer" },
};

export default function CardRenderer({
  card,
  theme,
  answer,
  onAnswer,
  readOnly,
}: {
  card: HomeworkCard;
  profile: Profile;
  theme: ProfileTheme;
} & AnswerProps) {
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
        <McqCard card={card} theme={theme} answer={answer} onAnswer={onAnswer} readOnly={readOnly} />
      ) : card.type === "short" ? (
        <ShortCard card={card} theme={theme} answer={answer} onAnswer={onAnswer} readOnly={readOnly} />
      ) : (
        <StepsCard card={card} theme={theme} answer={answer} onAnswer={onAnswer} readOnly={readOnly} />
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
