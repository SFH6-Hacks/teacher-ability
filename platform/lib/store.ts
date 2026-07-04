import type { Deck, Lesson } from "./types";
import { DEMO_LESSON } from "./demo-data";

// ponytail: in-memory demo store — swap for a DB if this outlives the hackathon.
// globalThis keeps state across Next dev hot-reloads.
const g = globalThis as unknown as {
  __decks?: Map<string, Deck>;
  __lesson?: Lesson;
};

export const decks: Map<string, Deck> = (g.__decks ??= new Map());

export const lesson: Lesson = (g.__lesson ??= structuredClone(DEMO_LESSON));
