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
  __lessonState?: LessonState;
};

export const decks: Map<string, Deck> = (g.__decks ??= new Map());

export const lesson: Lesson = (g.__lesson ??= structuredClone(DEMO_LESSON));

// Live presentation state the teacher broadcasts and students poll.
export interface LessonState {
  index: number; // current slide (0-based)
  presenting: boolean; // teacher is in Present mode
  updatedAt: number;
}

export const lessonState: LessonState = (g.__lessonState ??= {
  index: 0,
  presenting: false,
  updatedAt: Date.now(),
});

// Returned homework, keyed by student id. Seeded with a couple of scripted
// hand-ins so the teacher's submissions list looks alive before anyone in the
// demo has actually submitted.
export const submissions: Map<string, Submission> = (g.__submissions ??=
  seedSubmissions());

function seedSubmissions(): Map<string, Submission> {
  const m = new Map<string, Submission>();
  const now = Date.now();
  const stdAnswers = {
    "1": "Perimeter is the distance around a shape. Area is the space inside it.",
    "5": "Area = 6 \u00D7 4 = 24 cm\u00B2. Perimeter = 2 \u00D7 (6 + 4) = 20 cm.",
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
