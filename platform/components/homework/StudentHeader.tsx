"use client";

import Link from "next/link";
import { User } from "lucide-react";
import type { Student } from "@/lib/types";
import type { ProfileTheme } from "./profileTheme";
import TangramMascot from "../assistant/TangramMascot";

export interface HeaderProgress {
  cardsCompleted: number;
  totalCards: number;
}

const headerSurface: Record<ProfileTheme["id"], string> = {
  dyslexia: "border-[#e8dcc3] bg-[#FFFBF0]",
  adhd: "border-neutral-300 bg-white",
  blind: "border-neutral-700 bg-neutral-900",
  deaf: "border-teal-100 bg-white",
};

/**
 * Compact personalized header: avatar chip, greeting, streak, progress
 * fraction, and a link to the student's profile page. `children` slot is for
 * theme extras (e.g. the dyslexia tint toggle).
 */
export default function StudentHeader({
  student,
  progress,
  theme,
  title,
  children,
}: {
  student: Student;
  progress?: HeaderProgress;
  theme: ProfileTheme;
  title?: string;
  children?: React.ReactNode;
}) {
  const dark = theme.id === "blind";
  const muted = dark ? "text-neutral-400" : "text-neutral-500";

  return (
    <header className={`border-b px-6 py-3 ${headerSurface[theme.id]}`}>
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2">
        <Link
          href={`/student/${student.id}`}
          className={`group flex items-center gap-3 rounded-lg px-2 py-1 -ml-2 focus:outline-2 focus:outline-offset-2 ${dark ? "focus:outline-violet-400 hover:bg-neutral-800" : "focus:outline-blue-600 hover:bg-black/5"}`}
          aria-label={`View ${student.name}'s profile`}
        >
          <TangramMascot figure="person" colorScheme={theme.id} className="size-10 drop-shadow-sm" />
          <span className="leading-tight">
            <span className="block font-bold">Hi {student.name}!</span>
            <span className={`block text-xs ${muted} group-hover:underline`}>
              {title ?? student.profileLabel} · View profile
            </span>
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-3">
          {progress && (
            <span
              className={`rounded-full px-3 py-1 font-mono text-sm font-semibold ${dark ? "bg-neutral-800 text-neutral-200" : "bg-black/5 text-neutral-700"}`}
              aria-label={`${progress.cardsCompleted} of ${progress.totalCards} cards completed`}
            >
              {progress.cardsCompleted}/{progress.totalCards} done
            </span>
          )}
          {children}
        </div>
      </div>
    </header>
  );
}
