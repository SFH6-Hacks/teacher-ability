"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Pause, Play } from "lucide-react";
import {
  ACTIVITY_LOOP_SECONDS,
  ACTIVITY_SCRIPT,
  CLASS,
  DEMO_LESSON,
  INITIAL_ACTIVITY,
} from "@/lib/demo-data";
import { type Activity, isConnected } from "@/lib/types";
import { LessonStage } from "@/components/teacher/LessonStage";
import { SeatingPlan } from "@/components/teacher/SeatingPlan";
import { StudentDetail } from "@/components/teacher/StudentDetail";
import { HomeworkPanel } from "@/components/teacher/HomeworkPanel";

// Display clock starts mid-lesson so the room reads as "already in progress".
const LESSON_START_SECONDS = 14 * 60 + 32;

// Only connected students carry live activity / a homework deck.
const CONNECTED = CLASS.filter(isConnected);

function fmt(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function TeacherConsole() {
  const baseActivity = useCallback((): Record<string, Activity> => {
    const base: Record<string, Activity> = {};
    for (const s of CONNECTED) base[s.id] = "following";
    return { ...base, ...INITIAL_ACTIVITY };
  }, []);

  const [activity, setActivity] = useState<Record<string, Activity>>(baseActivity);
  const [slide, setSlide] = useState(0);
  const [liveSync, setLiveSync] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const secRef = useRef(0);

  // The scripted room: one tick a second, replaying the timeline on a loop so
  // students drift and reconnect on stage without any real telemetry.
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      secRef.current += 1;
      setElapsed(secRef.current);
      const pos = secRef.current % ACTIVITY_LOOP_SECONDS;
      if (pos === 0) {
        setActivity(baseActivity());
      } else {
        const beat = ACTIVITY_SCRIPT.find((b) => b.at === pos);
        if (beat) setActivity((a) => ({ ...a, ...beat.patch }));
      }
    }, 1000);
    return () => clearInterval(id);
  }, [playing, baseActivity]);

  const followingCount = useMemo(
    () =>
      CONNECTED.filter((s) => (activity[s.id] ?? "following") === "following")
        .length,
    [activity],
  );

  const selected = selectedId ? CLASS.find((s) => s.id === selectedId) ?? null : null;
  const selectedConnected = selected && isConnected(selected) ? selected : null;

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-3">
          <Link
            href="/"
            className="wordmark text-2xl leading-none text-stone-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
          >
            Recast
          </Link>
          <span className="hidden h-6 w-px bg-stone-200 sm:block" aria-hidden="true" />
          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-sm font-semibold text-stone-800">
              {DEMO_LESSON.title}
            </p>
            <p className="text-xs text-stone-500">
              Year 9 Science · Period 3 · {CLASS.length} students
            </p>
          </div>

          <div className="ml-auto flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold tabular-nums text-stone-600">
              <span
                className="h-1.5 w-1.5 rounded-full bg-amber-500 motion-safe:animate-pulse"
                aria-hidden="true"
              />
              Live {fmt(LESSON_START_SECONDS + elapsed)}
            </span>
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              aria-pressed={playing}
              className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
            >
              {playing ? (
                <>
                  <Pause size={13} aria-hidden="true" /> Simulating
                </>
              ) : (
                <>
                  <Play size={13} aria-hidden="true" /> Paused
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <main
        id="main"
        className="mx-auto max-w-7xl space-y-5 px-6 py-6"
      >
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <LessonStage
              lesson={DEMO_LESSON}
              slideIndex={slide}
              onSlide={setSlide}
              liveSync={liveSync}
              onToggleSync={() => setLiveSync((v) => !v)}
            />
          </div>
          <div>
            {selectedConnected ? (
              <StudentDetail
                student={selectedConnected}
                activity={activity[selectedConnected.id] ?? "following"}
                onSetActivity={(a) =>
                  setActivity((prev) => ({ ...prev, [selectedConnected.id]: a }))
                }
                onClose={() => setSelectedId(null)}
              />
            ) : (
              <HomeworkPanel students={CLASS} />
            )}
          </div>
        </div>

        <SeatingPlan
          students={CLASS}
          activity={activity}
          selectedId={selectedId}
          onSelect={(id) => setSelectedId((cur) => (cur === id ? null : id))}
          followingCount={followingCount}
          connectedCount={CONNECTED.length}
        />
      </main>
    </div>
  );
}
