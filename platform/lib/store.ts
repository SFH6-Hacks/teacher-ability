import type { Deck, Lesson, StudentProgress, Submission } from "./types";
import { DEMO_LESSON } from "./demo-data";

// ponytail: in-memory demo store — swap for a DB if this outlives the hackathon.
// globalThis keeps state across Next dev hot-reloads.
const g = globalThis as unknown as {
  __decks?: Map<string, Deck>;
  __lesson?: Lesson;
  __submissions?: Map<string, Submission>;
  __progress?: Map<string, StudentProgress>;
  __assistedCards?: Map<string, Set<number>>;
};

export const decks: Map<string, Deck> = (g.__decks ??= new Map());

export const lesson: Lesson = (g.__lesson ??= structuredClone(DEMO_LESSON));

// Returned homework, keyed by student id. Seeded with a couple of scripted
// hand-ins so the teacher's submissions list looks alive before anyone in the
// demo has actually submitted.
export const submissions: Map<string, Submission> = (g.__submissions ??=
  seedSubmissions());

function seedSubmissions(): Map<string, Submission> {
  const m = new Map<string, Submission>();
  const now = Date.now();
  const stdAnswers = {
    "2": "Every action has an equal and opposite reaction — same size, opposite direction.",
    "3": "She pushes the water backwards, so the water pushes her forwards.",
  };
  m.set("priya", {
    studentId: "priya",
    answers: stdAnswers,
    submittedAt: now - 8 * 60_000,
  });
  m.set("amara", {
    studentId: "amara",
    answers: stdAnswers,
    submittedAt: now - 3 * 60_000,
  });
  return m;
}

// ---------------------------------------------------------------------------
// Student progress (this session only — resets with the server).
// ---------------------------------------------------------------------------

export const progress: Map<string, StudentProgress> = (g.__progress ??=
  new Map());

// Which card indices the student used an assist on (breaks the streak).
const assistedCards: Map<string, Set<number>> = (g.__assistedCards ??=
  new Map());

export function getProgress(
  studentId: string,
  totalCards?: number,
): StudentProgress {
  let p = progress.get(studentId);
  if (!p) {
    p = {
      cardsCompleted: 0,
      totalCards: totalCards ?? 0,
      assistsUsed: 0,
      streak: 0,
    };
    progress.set(studentId, p);
  }
  if (totalCards) p.totalCards = totalCards;
  return p;
}

export function recordCardDone(
  studentId: string,
  cardIndex: number,
  totalCards: number,
): StudentProgress {
  const p = getProgress(studentId, totalCards);
  p.cardsCompleted = Math.max(p.cardsCompleted, cardIndex + 1);
  const assisted = assistedCards.get(studentId)?.has(cardIndex) ?? false;
  p.streak = assisted ? 0 : p.streak + 1;
  p.lastActive = new Date().toISOString();
  return p;
}

export function recordAssist(
  studentId: string,
  cardIndex?: number,
): StudentProgress {
  const p = getProgress(studentId);
  p.assistsUsed += 1;
  p.lastActive = new Date().toISOString();
  if (cardIndex !== undefined) {
    const set = assistedCards.get(studentId) ?? new Set<number>();
    set.add(cardIndex);
    assistedCards.set(studentId, set);
  }
  return p;
}
