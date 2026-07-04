import type { Profile } from "@/lib/types";
import { lexend } from "./fonts";

export interface ProfileTheme {
  id: Profile;
  /** Page background / base classes applied to the outermost wrapper. */
  page: string;
  /** Card surface classes (background, border, shadow). */
  card: string;
  /** Typography classes for student reading content. */
  content: string;
  /** Optional font class (Lexend for dyslexia). */
  fontClassName?: string;
  /** Accent classes for primary action buttons. */
  accent: string;
  features: {
    tts: boolean;
    autoRead: boolean;
    keyboardNav: boolean;
    focusMode: boolean;
    celebrations: boolean;
    brainBreaks: boolean;
    visualFirst: boolean;
    transcriptBlocks: boolean;
    tintOverlayToggle: boolean;
    reducedDecoration: boolean;
  };
}

const baseFeatures = {
  tts: false,
  autoRead: false,
  keyboardNav: false,
  focusMode: false,
  celebrations: false,
  brainBreaks: false,
  visualFirst: false,
  transcriptBlocks: false,
  tintOverlayToggle: false,
  reducedDecoration: false,
};

export const PROFILE_THEMES: Record<Profile, ProfileTheme> = {
  dyslexia: {
    id: "dyslexia",
    // Cream background reduces glare; calm warm neutrals.
    page: "bg-[#FAF3E3] text-neutral-900",
    card: "rounded-2xl border border-[#e8dcc3] bg-[#FFFBF0] p-8 shadow-sm",
    // Research-backed: generous line height, letter + word spacing, short lines.
    content:
      "text-xl leading-[1.9] tracking-[0.02em] [word-spacing:0.16em] max-w-[60ch] text-left space-y-6",
    fontClassName: lexend.className,
    accent:
      "bg-amber-700 text-white hover:bg-amber-800 focus:outline-amber-700",
    features: { ...baseFeatures, tts: true, tintOverlayToggle: true },
  },
  adhd: {
    id: "adhd",
    // Near-monochrome: nothing competes with the one thing to do next.
    page: "bg-neutral-100 text-neutral-900",
    card: "rounded-2xl border-2 border-neutral-300 bg-white p-8 shadow-sm",
    content: "text-lg leading-relaxed space-y-6",
    accent: "bg-amber-500 text-neutral-950 hover:bg-amber-400 focus:outline-amber-600",
    features: {
      ...baseFeatures,
      focusMode: true,
      celebrations: true,
      brainBreaks: true,
      reducedDecoration: true,
    },
  },
  blind: {
    id: "blind",
    // High contrast dark theme for residual vision; audio-first everywhere.
    page: "bg-neutral-950 text-neutral-50",
    card: "rounded-2xl border border-neutral-700 bg-neutral-900 p-8",
    content: "text-2xl leading-relaxed space-y-6",
    accent: "bg-violet-500 text-white hover:bg-violet-400 focus:outline-violet-400",
    features: { ...baseFeatures, tts: true, autoRead: true, keyboardNav: true },
  },
  deaf: {
    id: "deaf",
    // Clean light theme with teal accents; everything visual, nothing audio-only.
    page: "bg-teal-50/60 text-neutral-900",
    card: "rounded-2xl border border-teal-100 bg-white p-8 shadow-sm",
    content: "text-lg leading-relaxed space-y-5",
    accent: "bg-teal-600 text-white hover:bg-teal-700 focus:outline-teal-600",
    features: { ...baseFeatures, visualFirst: true, transcriptBlocks: true },
  },
};
