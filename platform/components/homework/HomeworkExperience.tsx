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

function cardLabel(card: Deck["cards"][number]): string {
  return card.type === "concept" ? card.heading : card.question;
}

function speak(text: string) {
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.95;
  window.speechSynthesis.speak(u);
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
    speak(`Card ${index + 1} of ${total}. ${cardSpeechText(deck.cards[index])}`);
    announce(`Card ${index + 1} of ${total}. ${cardLabel(deck.cards[index])}`);
    return () => window.speechSynthesis.cancel();
  }, [theme.features.autoRead, done, index, total, deck.cards]);

  // ---- Blind: announce + speak answer feedback -------------------------------
  useEffect(() => {
    if (!theme.features.keyboardNav) return;
    const onAnswer = (e: Event) => {
      const correct = (e as CustomEvent<{ correct: boolean }>).detail?.correct;
      const msg = correct
        ? "Correct! Well done. Press right arrow for the next card."
        : "Not quite. Try another option, or press h for help.";
      announce(msg);
      speak(msg);
    };
    window.addEventListener("hw:answer", onAnswer);
    return () => window.removeEventListener("hw:answer", onAnswer);
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
        speak(cardSpeechText(card));
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
      speak(msg);
      announce(msg);
      return () => window.speechSynthesis.cancel();
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
          <button
            type="button"
            onClick={() => {
              advancesRef.current = 0;
              goTo(1);
            }}
            className={`rounded-lg border px-4 py-2 text-sm font-semibold focus:outline-2 focus:outline-offset-2 ${
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
