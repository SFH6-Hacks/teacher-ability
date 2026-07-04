"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Loader2, Sparkles, X } from "lucide-react";
import { PROFILE_THEME } from "@/lib/profiles";
import { PROFILE_NEEDS } from "@/lib/demo-data";
import type { Activity, ConnectedMember, Deck } from "@/lib/types";
import { ACTIVITY_META, initials } from "./activityMeta";

const ACTIVITIES: Activity[] = [
  "following",
  "ahead",
  "hand",
  "homework",
  "away",
];

export function StudentDetail({
  student,
  activity,
  onSetActivity,
  onClose,
}: {
  student: ConnectedMember;
  activity: Activity;
  onSetActivity: (activity: Activity) => void;
  onClose: () => void;
}) {
  const theme = PROFILE_THEME[student.profile];
  const needs = PROFILE_NEEDS[student.profile];
  const meta = ACTIVITY_META[activity];
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [source, setSource] = useState<Deck["generatedBy"] | null>(null);

  const generate = async () => {
    setState("loading");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: student.id }),
      });
      const data = (await res.json()) as { deck?: Deck };
      setSource(data.deck?.generatedBy ?? "fallback");
    } catch {
      setSource("fallback");
    }
    setState("done");
  };

  return (
    <section
      aria-label={`${student.name} detail`}
      className="flex flex-col gap-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex h-12 w-12 items-center justify-center rounded-full text-base font-bold ring-2 ${theme.softBg} ${theme.softText} ${theme.ring}`}
          aria-hidden="true"
        >
          {initials(student.name)}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-stone-900">{student.name}</h2>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold ${theme.softBg} ${theme.softBorder} ${theme.softText}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${theme.dot}`} />
            {theme.label}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close student detail"
          className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <p className="text-sm leading-relaxed text-stone-600">{needs}</p>

      <div className="rounded-lg bg-stone-50 px-3 py-2.5">
        <p className={`text-sm font-semibold ${meta.text}`}>
          {student.name} {meta.verb}
        </p>
        <div className="mt-2.5">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
            Set state
          </p>
          <div className="flex flex-wrap gap-1.5">
            {ACTIVITIES.map((a) => {
              const m = ACTIVITY_META[a];
              const Icon = m.icon;
              const active = a === activity;
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => onSetActivity(a)}
                  aria-pressed={active}
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ${
                    active
                      ? "bg-stone-800 text-white"
                      : "bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-100"
                  }`}
                >
                  <Icon size={12} aria-hidden={true} />
                  {m.chip}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-auto space-y-2">
        <button
          type="button"
          onClick={() => void generate()}
          disabled={state === "loading"}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-600"
        >
          {state === "loading" ? (
            <>
              <Loader2
                size={15}
                className="animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
              Recasting for {student.name}…
            </>
          ) : (
            <>
              <Sparkles size={15} aria-hidden="true" />
              {state === "done" ? "Recast again" : "Recast homework"}
            </>
          )}
        </button>
        {state === "done" && (
          <>
            {student.featured ? (
              <Link
                href={`/hw/${student.id}`}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
              >
                Open {student.name}&apos;s view
                <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
            ) : (
              <p className="text-center text-xs text-stone-400">
                Preview view is wired up for the featured demo students.
              </p>
            )}
            {source === "fallback" && (
              <p className="text-center text-xs text-amber-600">
                Gemini unavailable — using the prepared version.
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
