"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { PROFILE_THEME } from "@/lib/profiles";
import { type Activity, type ClassMember, type ConnectedMember, isConnected } from "@/lib/types";
import { ACTIVITY_META, initials } from "./activityMeta";

function ConnectedSeat({
  member,
  activity,
  selected,
  onSelect,
  reduceMotion,
}: {
  member: ConnectedMember;
  activity: Activity;
  selected: boolean;
  onSelect: () => void;
  reduceMotion: boolean;
}) {
  const theme = PROFILE_THEME[member.profile];
  const meta = ACTIVITY_META[activity];
  const Icon = meta.icon;

  // The exceptions are what should catch the eye — off-task dims, ahead/hand
  // gets an amber outline, homework a teal one. Following stays calm and plain.
  const flagged = activity === "ahead" || activity === "hand";
  const stateRing = selected
    ? "ring-2 ring-teal-600"
    : flagged
      ? "ring-1 ring-amber-300"
      : activity === "homework"
        ? "ring-1 ring-teal-200"
        : "ring-1 ring-stone-200";

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      layout={!reduceMotion}
      animate={{ opacity: activity === "away" ? 0.55 : 1 }}
      transition={{ duration: reduceMotion ? 0 : 0.4 }}
      aria-pressed={selected}
      aria-label={`${member.name}, ${theme.label}, ${meta.chip}`}
      className={`group relative flex flex-col items-center gap-1.5 rounded-xl bg-white p-2.5 text-center shadow-sm transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ${stateRing}`}
    >
      {/* profile hue — functional, lets her scan minds fast */}
      <span
        className={`absolute right-2 top-2 h-2 w-2 rounded-full ${theme.dot}`}
        aria-hidden="true"
      />
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ring-2 ${theme.softBg} ${theme.softText} ${theme.ring}`}
        aria-hidden="true"
      >
        {initials(member.name)}
      </span>
      <span className="max-w-full truncate text-xs font-semibold text-stone-800">
        {member.name}
      </span>
      <span
        className={`flex items-center gap-1 text-[11px] font-medium leading-none ${meta.text}`}
      >
        <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
          {meta.pulse && !reduceMotion && (
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full ${meta.dot} opacity-75`}
            />
          )}
          <span
            className={`relative inline-flex h-1.5 w-1.5 rounded-full ${meta.dot}`}
          />
        </span>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={activity}
            initial={reduceMotion ? false : { opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -3 }}
            transition={{ duration: 0.2 }}
            className="inline-flex items-center gap-1"
          >
            <Icon size={11} aria-hidden={true} />
            {meta.chip}
          </motion.span>
        </AnimatePresence>
      </span>
    </motion.button>
  );
}

// A regular student — in the room, but not on a Recast laptop. Deliberately
// quiet: no colour, no activity, so the connected students read as the ones
// the teacher can actually act on.
function RegularSeat({ member }: { member: ClassMember }) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-stone-200 bg-stone-50/70 p-2.5 text-center">
      <span
        className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-sm font-semibold text-stone-400 ring-1 ring-stone-200"
        aria-hidden="true"
      >
        {initials(member.name)}
      </span>
      <span className="max-w-full truncate text-xs font-medium text-stone-500">
        {member.name}
      </span>
      <span className="text-[11px] leading-none text-stone-300">Not on Recast</span>
    </div>
  );
}

export function SeatingPlan({
  students,
  activity,
  selectedId,
  onSelect,
  followingCount,
  connectedCount,
}: {
  students: ClassMember[];
  activity: Record<string, Activity>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  followingCount: number;
  connectedCount: number;
}) {
  const reduceMotion = useReducedMotion() ?? false;
  const [connectedOnly, setConnectedOnly] = useState(false);

  const shown = connectedOnly ? students.filter(isConnected) : students;

  return (
    <section
      aria-label="Class seating plan"
      className="rounded-2xl border border-stone-200 bg-stone-50/60 p-4"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h2 className="text-sm font-semibold text-stone-700">Seating plan</h2>
          <p className="text-xs text-stone-500" aria-live="polite">
            <span className="font-semibold text-teal-700">{followingCount}</span>{" "}
            of {connectedCount} on Recast following
          </p>
        </div>
        <button
          type="button"
          onClick={() => setConnectedOnly((v) => !v)}
          aria-pressed={connectedOnly}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ${
            connectedOnly
              ? "bg-teal-700 text-white hover:bg-teal-800"
              : "border border-stone-300 text-stone-600 hover:bg-stone-100"
          }`}
        >
          {connectedOnly ? "Showing connected" : "Connected only"}
        </button>
      </div>

      {/* the board, to orient the chart like a real classroom */}
      <div className="mx-auto mb-4 w-2/3 rounded-full border border-stone-200 bg-white py-1 text-center text-[10px] font-semibold uppercase tracking-widest text-stone-400">
        Front of class
      </div>

      <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-6 lg:grid-cols-8">
        {shown.map((s) =>
          isConnected(s) ? (
            <ConnectedSeat
              key={s.id}
              member={s}
              activity={activity[s.id] ?? "following"}
              selected={selectedId === s.id}
              onSelect={() => onSelect(s.id)}
              reduceMotion={reduceMotion}
            />
          ) : (
            <RegularSeat key={s.id} member={s} />
          ),
        )}
      </div>
    </section>
  );
}
