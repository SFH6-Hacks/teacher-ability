import type { Deck, Lesson, Submission } from "./types";
import { DEMO_LESSON } from "./demo-data";

// ponytail: in-memory demo store — swap for a DB if this outlives the hackathon.
// globalThis keeps state across Next dev hot-reloads.
const g = globalThis as unknown as {
  __decks?: Map<string, Deck>;
  __lesson?: Lesson;
  __submissions?: Map<string, Submission>;
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
