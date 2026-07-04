"use client";

import { useState } from "react";
import { Check, CircleHelp, Lightbulb, X } from "lucide-react";
import type { HomeworkCard, Profile } from "@/lib/types";
import TtsPlayer from "@/components/slides/TtsPlayer";

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

function StuckButton() {
  return (
    <button
      type="button"
      onClick={askAssistant}
      className="inline-flex items-center gap-2 rounded-lg border-2 border-blue-600 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 focus:outline-2 focus:outline-offset-2 focus:outline-blue-600"
    >
      <CircleHelp size={16} aria-hidden="true" />
      I&apos;m stuck
    </button>
  );
}

function McqCard({ card }: { card: Extract<HomeworkCard, { type: "mcq" }> }) {
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;
  const correct = picked === card.correctIndex;

  return (
    <div className="space-y-6">
      <p data-spot="question" className="font-semibold">
        {card.question}
      </p>
      <div className="space-y-3" role="group" aria-label="Answer options">
        {card.options.map((option, i) => {
          const isPick = picked === i;
          const isRight = answered && i === card.correctIndex;
          return (
            <button
              key={i}
              type="button"
              data-spot={`option-${i}`}
              onClick={() => setPicked(i)}
              aria-pressed={isPick}
              className={`block w-full rounded-lg border-2 px-4 py-3 text-left text-base leading-relaxed focus:outline-2 focus:outline-offset-2 focus:outline-blue-600 ${
                isRight
                  ? "border-green-700 bg-green-50"
                  : isPick
                    ? "border-red-700 bg-red-50"
                    : "border-neutral-300 bg-white hover:border-blue-500"
              }`}
            >
              <span className="mr-2 font-mono text-sm text-neutral-500">
                {String.fromCharCode(97 + i)})
              </span>
              {option}
              {isRight && (
                <span className="ml-2 inline-flex items-center gap-1 font-semibold text-green-800">
                  <Check size={16} aria-hidden="true" /> Correct
                </span>
              )}
              {isPick && !correct && (
                <span className="ml-2 inline-flex items-center gap-1 font-semibold text-red-800">
                  <X size={16} aria-hidden="true" /> Not quite
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div aria-live="polite">
        {answered && (
          <p
            className={`rounded-lg border-l-4 p-4 ${
              correct
                ? "border-green-700 bg-green-50 text-green-900"
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

function ShortCard({ card }: { card: Extract<HomeworkCard, { type: "short" }> }) {
  const [answer, setAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="space-y-6">
      <p data-spot="question" className="whitespace-pre-line font-semibold">
        {card.question}
      </p>
      <div>
        <label htmlFor="short-answer" className="mb-2 block text-sm font-semibold text-neutral-700">
          Your answer
        </label>
        <textarea
          id="short-answer"
          data-spot="answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-neutral-300 bg-white p-4 text-base leading-relaxed focus:outline-2 focus:outline-offset-2 focus:outline-blue-600"
        />
      </div>
      {!revealed ? (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-100 focus:outline-2 focus:outline-offset-2 focus:outline-blue-600"
        >
          Check what a good answer includes
        </button>
      ) : (
        <div
          data-spot="model-points"
          className="rounded-lg border-l-4 border-blue-600 bg-blue-50 p-4"
          aria-live="polite"
        >
          <p className="mb-2 text-sm font-semibold text-blue-900">
            A good answer includes:
          </p>
          <ul className="list-disc space-y-1 pl-5 text-blue-950">
            {card.modelPoints.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function StepsCard({ card }: { card: Extract<HomeworkCard, { type: "steps" }> }) {
  const [done, setDone] = useState<boolean[]>(() => card.steps.map(() => false));
  return (
    <div className="space-y-6">
      <p data-spot="question" className="font-semibold">
        {card.question}
      </p>
      <ol className="space-y-4">
        {card.steps.map((step, i) => (
          <li key={i} data-spot={`step-${i}`}>
            <label
              className={`flex cursor-pointer items-start gap-4 rounded-lg border-2 p-4 ${
                done[i] ? "border-green-700 bg-green-50" : "border-neutral-300 bg-white"
              }`}
            >
              <input
                type="checkbox"
                checked={done[i]}
                onChange={() =>
                  setDone((d) => d.map((v, j) => (j === i ? !v : v)))
                }
                className="mt-1 size-5 accent-green-700"
              />
              <span>
                <span className="mr-2 font-mono text-2xl font-bold text-blue-700">
                  {i + 1}
                </span>
                <span className={done[i] ? "text-green-900" : ""}>{step}</span>
              </span>
            </label>
          </li>
        ))}
      </ol>
      <p aria-live="polite" className="text-sm font-semibold text-green-800">
        {done.every(Boolean) && "All steps done — brilliant. Hit Next!"}
      </p>
    </div>
  );
}

export default function CardRenderer({
  card,
  profile,
}: {
  card: HomeworkCard;
  profile: Profile;
}) {
  const isQuestion = card.type !== "concept";
  return (
    <section
      aria-label={isQuestion ? "Homework question" : "Lesson recap"}
      className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm"
    >
      {card.type === "concept" ? (
        <div className="space-y-4">
          <p className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-800">
            <Lightbulb size={14} aria-hidden="true" />
            {card.slideRef ? `From slide ${card.slideRef}` : "From the lesson"}
          </p>
          <h2 data-spot="question" className="text-2xl font-bold">
            {card.heading}
          </h2>
          <p className="text-lg leading-relaxed">{card.body}</p>
        </div>
      ) : card.type === "mcq" ? (
        <McqCard card={card} />
      ) : card.type === "short" ? (
        <ShortCard card={card} />
      ) : (
        <StepsCard card={card} />
      )}

      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-neutral-100 pt-6">
        {(profile === "blind" || profile === "dyslexia") && (
          <TtsPlayer text={cardSpeechText(card)} />
        )}
        {isQuestion && <StuckButton />}
      </div>
    </section>
  );
}
