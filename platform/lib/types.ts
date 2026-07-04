export type Profile = "dyslexia" | "adhd" | "blind" | "deaf";

export interface Student {
  id: string;
  name: string;
  profile: Profile;
  profileLabel: string;
  needs: string; // one-line summary shown on teacher roster
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
