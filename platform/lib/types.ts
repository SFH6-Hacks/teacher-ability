export type Profile = "dyslexia" | "adhd" | "blind" | "deaf";

export interface Student {
  id: string;
  name: string;
  profile: Profile;
  profileLabel: string;
  needs: string; // one-line summary shown on teacher roster
}

// What a student is doing on their side of the platform, shown live on the
// teacher's seating plan. "following" = synced to the teacher's current slide.
export type Activity = "following" | "ahead" | "hand" | "homework" | "away";

// A seat in the class. Only students with an accessibility need get a laptop
// connected to Recast — those carry a `profile`. Everyone else is a regular
// student, present in the room but not on the app (no live activity, no deck).
export interface ClassMember {
  id: string;
  name: string;
  profile?: Profile; // present ⇒ connected to Recast
  featured?: boolean; // has a real /hw view wired up for the demo
}

export type ConnectedMember = ClassMember & { profile: Profile };

export function isConnected(m: ClassMember): m is ConnectedMember {
  return m.profile !== undefined;
}

// A student's returned homework. Answers are keyed by card index (as a string,
// since it round-trips through JSON); cards have no stable id of their own.
export interface Submission {
  studentId: string;
  answers: Record<string, string>;
  submittedAt: number;
}

export interface Slide {
  index: number;
  title: string;
  content_text: string;
  image_alt?: string;
}

export interface Lesson {
  id: string;
  title: string;
  slides: Slide[];
  transcript: string;
  summary: string[]; // recap bullets
}

export type HomeworkCard =
  | { type: "concept"; heading: string; body: string; slideRef?: number }
  | {
      type: "mcq";
      question: string;
      options: string[];
      correctIndex: number;
      explanation: string;
    }
  | { type: "short"; question: string; modelPoints: string[] }
  | { type: "steps"; question: string; steps: string[] };

export interface Deck {
  studentId: string;
  title: string;
  cards: HomeworkCard[];
  generatedBy: "gemini" | "fallback";
}

export interface WalkthroughStep {
  say: string;
  spot?: string; // data-spot id on the page
  draw?: "circle" | "underline" | "arrow";
}

export interface Walkthrough {
  steps: WalkthroughStep[];
}
