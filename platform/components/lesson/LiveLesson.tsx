"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Radio, Rewind } from "lucide-react";
import type { Student } from "@/lib/types";
import { useLessonDeck } from "@/lib/useLessonDeck";
import { DeckCanvas } from "@/components/lesson/DeckCanvas";
import TtsPlayer from "@/components/slides/TtsPlayer";
import ProfileContent from "@/components/layout/ProfileContent";
import StudentHeader from "@/components/homework/StudentHeader";
import { PROFILE_THEMES } from "@/components/homework/profileTheme";
import { speak, cancelSpeech } from "@/lib/speak";

interface LiveState {
  index: number;
  presenting: boolean;
}

export function LiveLesson({ student }: { student: Student }) {
  const { pages, loading, source } = useLessonDeck();
  const total = pages.length;

  const [teacher, setTeacher] = useState<LiveState>({ index: 0, presenting: false });
  const [following, setFollowing] = useState(true);
  const [manual, setManual] = useState(0);

  // Poll the teacher's broadcast slide.
  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("/api/lesson/slide")
        .then((r) => (r.ok ? r.json() : null))
        .then((s: (LiveState & { updatedAt?: number }) | null) => {
          if (alive && s) setTeacher({ index: s.index, presenting: s.presenting });
        })
        .catch(() => {});
    load();
    const id = setInterval(load, 1000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const clamp = (i: number) => (total ? Math.min(Math.max(i, 0), total - 1) : 0);
  const viewIndex = clamp(following ? teacher.index : manual);
  const page = pages[viewIndex];
  const teacherIndex = clamp(teacher.index);

  // Blind: auto-read whatever slide is in view.
  useEffect(() => {
    if (student.profile !== "blind" || !page) return;
    void speak(`${page.title}. ${page.text}`);
    return () => cancelSpeech();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewIndex, student.profile]);

  const openThumb = (i: number) => {
    setManual(i);
    setFollowing(false);
  };

  useEffect(() => {
    const thumb = document.getElementById(`thumb-${viewIndex}`);
    if (thumb) {
      thumb.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [viewIndex]);

  const theme = PROFILE_THEMES[student.profile];

  return (
    <div className={`min-h-screen ${theme.page}`}>
      <StudentHeader student={student} theme={theme} title="Live Lesson">
        {/* follow status */}
        {following ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700">
            <Radio size={13} className="animate-pulse motion-reduce:animate-none" aria-hidden="true" />
            Following live
          </span>
        ) : (
          <button
            type="button"
            onClick={() => {
              setFollowing(true);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-amber-500"
          >
            <Rewind size={13} aria-hidden="true" /> Back to live
          </button>
        )}
        <Link
          href={`/hw/${student.id}`}
          className="rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-stone-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
        >
          Homework
        </Link>
      </StudentHeader>

      <main id="main" className="mx-auto max-w-4xl space-y-4 p-6">
        {!following && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            You&apos;re reviewing slide {viewIndex + 1}. The teacher is on slide{" "}
            {teacherIndex + 1} — tap <span className="font-semibold">Back to live</span> to catch up.
          </p>
        )}

        {loading || !page ? (
          <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-stone-200 text-sm text-stone-400">
            Loading the lesson…
          </div>
        ) : (
          <>
            <DeckCanvas page={page} />

            {/* per-profile reading support */}
            {student.profile === "blind" && (
              <div className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-3">
                <TtsPlayer text={`${page.title}. ${page.text}`} />
                <span className="text-sm text-stone-500">Slide read aloud automatically</span>
              </div>
            )}
            {(student.profile === "deaf" ||
              student.profile === "dyslexia" ||
              student.profile === "adhd") && (
              <section
                aria-label="Slide text"
                className="rounded-xl border border-stone-200 bg-white p-5"
              >
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-teal-700">
                  On this slide
                </p>
                <ProfileContent profile={student.profile}>
                  <h2 className="text-xl font-bold">{page.title}</h2>
                  <p>{page.text}</p>
                </ProfileContent>
              </section>
            )}
          </>
        )}

        {/* thumbnails — click to review, which breaks live sync */}
        {total > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {pages.map((p, i) => (
              <button
                key={i}
                id={`thumb-${i}`}
                type="button"
                onClick={() => openThumb(i)}
                aria-label={`Review slide ${i + 1}`}
                aria-current={i === viewIndex}
                className={`relative w-24 shrink-0 rounded-lg p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ${
                  i === viewIndex ? "ring-2 ring-teal-600" : "ring-1 ring-stone-200"
                }`}
              >
                <DeckCanvas page={p} thumb />
                {i === teacherIndex && (
                  <span className="absolute right-1 top-1 rounded-full bg-teal-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
                    LIVE
                  </span>
                )}
              </button>
            ))}
          </div>
        )}


      </main>
    </div>
  );
}
