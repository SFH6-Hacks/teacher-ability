import type { Profile } from "./types";

/*
 * Per-profile colour system. These are FUNCTIONAL, not decorative — the teacher
 * scans the seating plan mid-lesson and tells minds apart by hue. Kept muted and
 * distinct from the teal primary and the amber live-status colour.
 *
 * Tailwind v4 detects class names as literal strings, so every class here is
 * spelled out in full — do not build them dynamically.
 */
export interface ProfileTheme {
  label: string; // full label for detail views
  short: string; // compact label for tight badges
  dot: string; // solid swatch — bg colour
  ring: string; // ring colour for avatars/seats
  softText: string; // readable coloured text on light bg
  softBg: string; // tint fill for badges
  softBorder: string; // tint border
}

export const PROFILE_THEME: Record<Profile, ProfileTheme> = {
  dyslexia: {
    label: "Dyslexia",
    short: "Dyslexia",
    dot: "bg-violet-500",
    ring: "ring-violet-400",
    softText: "text-violet-700",
    softBg: "bg-violet-50",
    softBorder: "border-violet-200",
  },
  adhd: {
    label: "ADHD",
    short: "ADHD",
    dot: "bg-rose-500",
    ring: "ring-rose-400",
    softText: "text-rose-700",
    softBg: "bg-rose-50",
    softBorder: "border-rose-200",
  },
  blind: {
    label: "Blind / low-vision",
    short: "Low-vision",
    dot: "bg-blue-500",
    ring: "ring-blue-400",
    softText: "text-blue-700",
    softBg: "bg-blue-50",
    softBorder: "border-blue-200",
  },
  deaf: {
    label: "Deaf / hard of hearing",
    short: "Deaf / HoH",
    dot: "bg-emerald-500",
    ring: "ring-emerald-400",
    softText: "text-emerald-700",
    softBg: "bg-emerald-50",
    softBorder: "border-emerald-200",
  },
};

export const PROFILE_ORDER: Profile[] = ["dyslexia", "adhd", "blind", "deaf"];
