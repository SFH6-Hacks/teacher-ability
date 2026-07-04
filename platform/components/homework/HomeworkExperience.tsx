"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PartyPopper, Trophy } from "lucide-react";
import type { Deck, Student, StudentProgress } from "@/lib/types";
import ProfileContent from "@/components/layout/ProfileContent";
import Companion from "@/components/assistant/Companion";
import CardRenderer, { cardSpeechText } from "./CardRenderer";
import { PROFILE_THEMES } from "./profileTheme";
import ProgressBar from "./ProgressBar";
import Scratchpad from "./Scratchpad";
import StudentHeader, { type HeaderProgress } from "./StudentHeader";
import TintOverlay from "./TintOverlay";
import CelebrationBurst from "./CelebrationBurst";
import BrainBreak from "./BrainBreak";
import FocusTimer from "./FocusTimer";
import RecapPanel from "./RecapPanel";
import Announcer, { announce } from "./Announcer";
import { speak, cancelSpeech } from "@/lib/speak";

function cardLabel(card: Deck["cards"][number]): string {
  return card.type === "concept" ? card.heading : card.question;
}
function Experience({ student, deck }: { student: Student; deck: Deck }) {
  const router = useRouter();
  const params = useSearchParams();
  const theme = PROFILE_THEMES[student.profile];
  const total = deck.cards.length;
  const raw = Number(params.get("card") ?? "1");
  const done = params.get("card") === "done";
  const index = Math.min(Math.max(Number.isNaN(raw) ? 1 : raw, 1), total) - 1;

  const [progress, setProgress] = useState<HeaderProgress>({
    cardsCompleted: 0,
    totalCards: total,
    streak: 0,
  });
  const [burst, setBurst] = useState(0); // CelebrationBurst fire counter
  const [onBreak, setOnBreak] = useState(false); // ADHD brain-break interstitial
  const advancesRef = useRef(0);

  // Answers, lifted here so they survive card navigation (cards remount per
  // index). Keyed by card index; mcq stores the chosen option's text.
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const setAnswer = useCallback(
    (i: number, v: string) => setAnswers((a) => ({ ...a, [i]: v })),
    [],
  );
  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    try {
      await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: student.id, answers }),
      });
    } catch {
      // demo: the store is in-process, so this rarely fails; ignore either way
    }
    setSubmitting(false);
    setSubmitted(true);
  }, [answers, student.id]);

  // Session progress from the server (kept fresh from POST responses after).
  useEffect(() => {
    fetch(`/api/progress?studentId=${student.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((p: StudentProgress | null) => {
        if (p) setProgress({ ...p, totalCards: p.totalCards || total });
      })
      .catch(() => {});
  }, [student.id, total]);

  const goTo = useCallback(
    (card: number | "done") => {
      router.replace(`?card=${card}`, { scroll: true });
    },
    [router],
  );

  const postCardDone = useCallback(
    (cardIndex: number) => {
      fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.id,
          event: "card-done",
          cardIndex,
          totalCards: total,
        }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((p: StudentProgress | null) => {
          if (p) setProgress({ ...p, totalCards: p.totalCards || total });
        })
        .catch(() => {});
    },
    [student.id, total],
  );

  const isLast = index === total - 1;

  const advance = useCallback(() => {
    postCardDone(index);
    if (theme.features.celebrations) setBurst((b) => b + 1);
    advancesRef.current += 1;
    if (theme.features.brainBreaks && !isLast && advancesRef.current % 3 === 0) {
      setOnBreak(true);
    }
    goTo(isLast ? "done" : index + 2);
  }, [postCardDone, index, isLast, goTo, theme.features]);

  const goBack = useCallback(() => {
    if (index > 0) goTo(index);
  }, [index, goTo]);

  const card = deck.cards[index];

  // ---- Blind: auto-read the card on mount / index change --------------------
  useEffect(() => {
    if (!theme.features.autoRead || done) return;
    void speak(`Card ${index + 1} of ${total}. ${cardSpeechText(deck.cards[index])}`);
    announce(`Card ${index + 1} of ${total}. ${cardLabel(deck.cards[index])}`);
    return () => cancelSpeech();
  }, [theme.features.autoRead, done, index, total, deck.cards]);

  // ---- Blind: confirm a selection without revealing correctness --------------
  useEffect(() => {
    if (!theme.features.keyboardNav) return;
    const onSelected = () => {
      const msg =
        "Answer recorded. Press right arrow for the next card, or h for help.";
      announce(msg);
      void speak(msg);
    };
    window.addEventListener("hw:selected", onSelected);
    return () => window.removeEventListener("hw:selected", onSelected);
  }, [theme.features.keyboardNav]);

  // ---- Blind: full keyboard navigation ---------------------------------------
  useEffect(() => {
    if (!theme.features.keyboardNav || done) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)
      )
        return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key.toLowerCase();
      if (e.key === "ArrowRight") {
        e.preventDefault();
        advance();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goBack();
      } else if (key >= "a" && key <= "d" && card.type === "mcq") {
        e.preventDefault();
        window.dispatchEvent(
          new CustomEvent("hw:choose", {
            detail: { index: key.charCodeAt(0) - 97 },
          }),
        );
      } else if (key === "r") {
        e.preventDefault();
        void speak(cardSpeechText(card));
      } else if (key === "h") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("assistant:ask", { detail: {} }));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [theme.features.keyboardNav, done, card, advance, goBack]);

  // ---- Done: spoken celebration for blind ------------------------------------
  useEffect(() => {
    if (!done) return;
    if (theme.features.autoRead) {
      const msg = `Great work, ${student.name}! You finished all ${total} cards.`;
      void speak(msg);
      announce(msg);
      return () => cancelSpeech();
    }
    if (theme.features.celebrations) setBurst((b) => b + 1);
  }, [done, theme.features, student.name, total]);

  const focus = theme.features.focusMode;
  const dark = theme.id === "blind";
  const font = theme.fontClassName ?? "";

  // ---------------------------------------------------------------------------
  // Done screen — theme adapted.
  // ---------------------------------------------------------------------------
  if (done) {
    return (
      <div className={`min-h-screen ${theme.page} ${font}`}>
        {theme.features.celebrations && <CelebrationBurst fire={burst} />}
        {theme.features.keyboardNav && <Announcer />}
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 p-8 text-center">
          <div className="no-print flex flex-col items-center gap-4">
            {theme.features.visualFirst ? (
              <span className="flex size-24 items-center justify-center rounded-full bg-teal-100 text-5xl">
                🏆
              </span>
            ) : theme.features.celebrations ? (
              <Trophy size={56} className="text-amber-500" aria-hidden="true" />
            ) : (
              <PartyPopper
                size={48}
                className={dark ? "text-violet-400" : "text-blue-600"}
                aria-hidden="true"
              />
            )}
            <h1 className="text-3xl font-bold">Great work, {student.name}!</h1>
            <p className={`text-lg ${dark ? "text-neutral-300" : "text-neutral-700"}`}>
              You worked through all {total} cards of {deck.title}.
            </p>
            {progress.streak > 1 && (
              <p className="text-lg font-semibold">
                🔥 {progress.streak} cards in a row without help — brilliant.
              </p>
            )}
          </div>

          {/* Review + hand-in — also the printable area for Export PDF. */}
          <section
            className={`w-full rounded-2xl border p-6 text-left ${
              dark ? "border-neutral-700 bg-neutral-900" : "border-neutral-200 bg-white"
            }`}
          >
            <h2 className="mb-4 text-xl font-bold">
              {student.name} — {deck.title}
            </h2>
            <ol className="space-y-4">
              {deck.cards
                .map((c, i) => ({ c, i }))
                .filter(({ c }) => c.type !== "concept")
                .map(({ c, i }, n) => {
                  const q = c.type === "concept" ? "" : c.question;
                  const a = (answers[i] ?? "").trim();
                  return (
                    <li key={i}>
                      <p className="font-semibold">
                        {n + 1}. {q}
                      </p>
                      <p
                        className={`mt-1 whitespace-pre-line rounded-lg border px-3 py-2 text-sm ${
                          a
                            ? dark
                              ? "border-neutral-700 bg-neutral-950 text-neutral-100"
                              : "border-neutral-200 bg-neutral-50 text-neutral-800"
                            : `border-dashed ${dark ? "border-neutral-700 text-neutral-500" : "border-neutral-300 text-neutral-400"}`
                        }`}
                      >
                        {a || "Not answered yet"}
                      </p>
                    </li>
                  );
                })}
            </ol>

            <div className="no-print mt-6 flex flex-wrap items-center gap-3">
              {!submitted ? (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className={`rounded-lg px-6 py-3 text-base font-semibold focus:outline-2 focus:outline-offset-2 disabled:opacity-60 ${theme.accent}`}
                >
                  {submitting ? "Submitting…" : "Submit to teacher"}
                </button>
              ) : (
                <>
                  <span className="inline-flex items-center gap-2 rounded-lg bg-green-100 px-4 py-2 text-sm font-semibold text-green-900">
                    ✓ Submitted — your teacher can see this now.
                  </span>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className={`rounded-lg border px-4 py-2 text-sm font-semibold focus:outline-2 focus:outline-offset-2 ${
                      dark
                        ? "border-neutral-600 text-neutral-100 hover:bg-neutral-800 focus:outline-violet-400"
                        : "border-neutral-300 text-neutral-800 hover:bg-neutral-100 focus:outline-blue-600"
                    }`}
                  >
                    Export PDF
                  </button>
                </>
              )}
            </div>
          </section>

          <button
            type="button"
            onClick={() => {
              advancesRef.current = 0;
              goTo(1);
            }}
            className={`no-print rounded-lg border px-4 py-2 text-sm font-semibold focus:outline-2 focus:outline-offset-2 ${
              dark
                ? "border-neutral-600 bg-neutral-900 hover:bg-neutral-800 focus:outline-violet-400"
                : "border-neutral-300 bg-white hover:bg-neutral-100 focus:outline-blue-600"
            }`}
          >
            Start again
          </button>
        </main>
      </div>
    );
  }

  const recapItems = deck.cards.slice(0, index).map(cardLabel);

  return (
    <div className={`min-h-screen ${theme.page} ${font}`}>
      {theme.features.tintOverlayToggle ? (
        <StudentHeader
          student={student}
          progress={progress}
          theme={theme}
          title={deck.title}
        >
          <TintOverlay />
        </StudentHeader>
      ) : (
        <StudentHeader
          student={student}
          progress={progress}
          theme={theme}
          title={deck.title}
        />
      )}

      {theme.features.celebrations && <CelebrationBurst fire={burst} />}
      {theme.features.keyboardNav && <Announcer />}

      <main
        id="main"
        className={`mx-auto grid max-w-5xl gap-8 p-6 ${
          focus ? "max-w-3xl" : "lg:grid-cols-[1fr_18rem]"
        }`}
      >
        <div className="space-y-6">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <ProgressBar
                current={index + 1}
                total={total}
                variant={theme.features.celebrations ? "chunky" : "slim"}
                streak={progress.streak}
                dark={dark}
              />
            </div>
            {focus && <FocusTimer resetKey={index} />}
          </div>

          {theme.features.transcriptBlocks && <RecapPanel items={recapItems} />}

          {onBreak ? (
            <BrainBreak onContinue={() => setOnBreak(false)} />
          ) : (
            <>
              <ProfileContent profile={student.profile}>
                <CardRenderer
                  key={index}
                  card={card}
                  profile={student.profile}
                  theme={theme}
                  answer={answers[index] ?? ""}
                  onAnswer={(v) => setAnswer(index, v)}
                  readOnly={submitted}
                />
              </ProfileContent>

              <nav
                aria-label="Card navigation"
                className="flex items-center justify-between gap-4"
              >
                <button
                  type="button"
                  onClick={goBack}
                  disabled={index === 0}
                  className={`rounded-lg border px-6 py-3 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-50 focus:outline-2 focus:outline-offset-2 ${
                    dark
                      ? "border-neutral-600 bg-neutral-900 text-neutral-100 hover:bg-neutral-800 focus:outline-violet-400"
                      : "border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-100 focus:outline-blue-600"
                  }`}
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={advance}
                  className={`rounded-lg px-8 py-3 text-base font-semibold focus:outline-2 focus:outline-offset-2 ${theme.accent}`}
                >
                  {isLast ? "Done!" : "Next"}
                </button>
              </nav>

              {theme.features.keyboardNav && (
                <p className="text-sm text-neutral-400">
                  Keyboard: ← → cards · a–d answer · r re-read · h help
                </p>
              )}
            </>
          )}
        </div>

        {!focus && (
          <aside className="hidden lg:block">
            <Scratchpad />
          </aside>
        )}
      </main>

      <Companion
        profile={student.profile}
        card={card}
        cardKey={`${student.id}-${index}`}
        studentId={student.id}
        cardIndex={index}
      />
    </div>
  );
}

export default function HomeworkExperience(props: {
  student: Student;
  deck: Deck;
}) {
  // useSearchParams requires a Suspense boundary in Next App Router
  return (
    <Suspense>
      <Experience {...props} />
    </Suspense>
  );
}
