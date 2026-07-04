"use client";

import { useState } from "react";
import { Check, Download, FileText, Loader2, Sparkles, Upload } from "lucide-react";
import { PROFILE_ORDER, PROFILE_THEME } from "@/lib/profiles";
import { DEMO_HOMEWORK_TITLE } from "@/lib/demo-data";
import type { ClassMember } from "@/lib/types";

export function HomeworkPanel({ students }: { students: ClassMember[] }) {
  const [recast, setRecast] = useState<"none" | "working" | "done">("none");
  const [exported, setExported] = useState(false);

  const byProfile = PROFILE_ORDER.map((p) => ({
    profile: p,
    theme: PROFILE_THEME[p],
    count: students.filter((s) => s.profile === p).length,
  })).filter((g) => g.count > 0);

  const recastAll = async () => {
    setRecast("working");
    // Design pass: the real per-profile conversion lands with the student side.
    await new Promise((r) => setTimeout(r, 1100));
    setRecast("done");
  };

  return (
    <section
      aria-label="Homework"
      className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
          Homework
        </p>
        <h2 className="text-lg font-bold text-stone-900">Linked to this lesson</h2>
      </div>

      {/* imported source deck (stubbed to the bundled worksheet for the demo) */}
      <div className="flex items-center gap-3 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5">
        <FileText size={18} className="shrink-0 text-teal-700" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-stone-800">
            {DEMO_HOMEWORK_TITLE}
          </p>
          <p className="text-xs text-stone-500">Newton&apos;s Third Law · 5 questions</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-md border border-stone-300 px-2 py-1 text-xs font-semibold text-stone-600 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
        >
          <Upload size={12} aria-hidden="true" /> Replace
        </button>
      </div>

      {recast === "done" ? (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
            Recast into {byProfile.length} versions
          </p>
          {byProfile.map((g) => (
            <div
              key={g.profile}
              className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm ${g.theme.softBg} ${g.theme.softBorder}`}
            >
              <span className={`h-2 w-2 rounded-full ${g.theme.dot}`} aria-hidden="true" />
              <span className={`font-semibold ${g.theme.softText}`}>{g.theme.label}</span>
              <span className="ml-auto text-xs text-stone-500">{g.count} students</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-lg bg-stone-50 px-3 py-6 text-center text-sm text-stone-500">
          No homework recast for this lesson yet.
        </p>
      )}

      <div className="mt-auto space-y-2">
        <button
          type="button"
          onClick={() => void recastAll()}
          disabled={recast === "working"}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-600"
        >
          {recast === "working" ? (
            <>
              <Loader2 size={15} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
              Recasting for the class…
            </>
          ) : (
            <>
              <Sparkles size={15} aria-hidden="true" />
              {recast === "done" ? "Recast again" : "Recast for the class"}
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => {
            setExported(true);
            setTimeout(() => setExported(false), 2000);
          }}
          disabled={recast !== "done"}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
        >
          {exported ? (
            <>
              <Check size={15} className="text-teal-700" aria-hidden="true" /> Decks exported
            </>
          ) : (
            <>
              <Download size={15} aria-hidden="true" /> Export decks
            </>
          )}
        </button>
      </div>
    </section>
  );
}
