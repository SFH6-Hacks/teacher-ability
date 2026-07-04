import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Check,
  Flame,
  HandHelping,
  Keyboard,
  MonitorPlay,
  MousePointer2,
  Volume2,
} from "lucide-react";
import { getStudent } from "@/lib/demo-data";
import { getProgress } from "@/lib/store";
import { PROFILE_THEMES } from "@/components/homework/profileTheme";

export const dynamic = "force-dynamic";

const INPUT_LABEL: Record<string, string> = {
  keyboard: "Keyboard",
  voice: "Voice",
  mouse: "Mouse",
  touch: "Touch",
};
const OUTPUT_LABEL: Record<string, string> = {
  text: "Text",
  audio: "Audio",
  visual: "Visual",
};

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const student = getStudent(id);
  if (!student) notFound();

  const theme = PROFILE_THEMES[student.profile];
  const progress = getProgress(student.id);
  const dark = theme.id === "blind";
  const font = theme.fontClassName ?? "";

  const muted = dark ? "text-neutral-400" : "text-neutral-500";
  const pill = dark
    ? "bg-neutral-800 text-neutral-100"
    : theme.id === "deaf"
      ? "bg-teal-100 text-teal-900"
      : theme.id === "dyslexia"
        ? "bg-[#f0e6cd] text-neutral-800"
        : "bg-neutral-200 text-neutral-800";
  const sectionTitle = `text-sm font-bold uppercase tracking-wide ${muted}`;
  const pct = progress.totalCards
    ? Math.round((progress.cardsCompleted / progress.totalCards) * 100)
    : 0;

  return (
    <div className={`min-h-screen ${theme.page} ${font}`}>
      <main className="mx-auto max-w-3xl space-y-8 p-6 py-10">
        {/* Identity */}
        <header className="flex flex-wrap items-center gap-6">
          <span
            aria-hidden="true"
            className="flex size-24 items-center justify-center rounded-3xl text-5xl shadow-md"
            style={{ backgroundColor: student.avatar?.color ?? "#3B82F6" }}
          >
            {student.avatar?.emoji ?? "🙂"}
          </span>
          <div className="min-w-0">
            <h1 className="text-4xl font-bold">{student.name}</h1>
            <p className={`mt-1 text-lg ${muted}`}>
              {student.age ? `Age ${student.age} · ` : ""}
              {student.grade ?? ""}
            </p>
            <p className={`mt-2 inline-block rounded-full px-3 py-1 text-sm font-semibold ${pill}`}>
              {student.profileLabel}
            </p>
          </div>
          <div className="ml-auto flex flex-col gap-2">
            <Link
              href={`/hw/${student.id}`}
              className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold focus:outline-2 focus:outline-offset-2 ${theme.accent}`}
            >
              Homework <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link
              href={`/lesson/${student.id}`}
              className={`inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-semibold focus:outline-2 focus:outline-offset-2 ${
                dark
                  ? "border-neutral-600 bg-neutral-900 hover:bg-neutral-800 focus:outline-violet-400"
                  : "border-neutral-300 bg-white hover:bg-neutral-100 focus:outline-blue-600"
              }`}
            >
              <MonitorPlay size={16} aria-hidden="true" /> Lesson
            </Link>
          </div>
        </header>

        <p className={`${theme.card} text-lg leading-relaxed`}>{student.needs}</p>

        {/* Progress */}
        <section aria-label="Progress" className={theme.card}>
          <h2 className={sectionTitle}>Progress this session</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-3xl font-bold">
                {progress.cardsCompleted}
                <span className={`text-lg font-semibold ${muted}`}>
                  /{progress.totalCards || "—"}
                </span>
              </p>
              <p className={`text-sm ${muted}`}>cards completed</p>
              <div
                className={`mt-2 h-2.5 w-full rounded-full ${dark ? "bg-neutral-800" : "bg-neutral-200"}`}
                role="progressbar"
                aria-valuenow={progress.cardsCompleted}
                aria-valuemin={0}
                aria-valuemax={progress.totalCards || 1}
                aria-label={`${progress.cardsCompleted} of ${progress.totalCards} cards completed`}
              >
                <div
                  className={`h-2.5 rounded-full ${dark ? "bg-violet-400" : "bg-green-600"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
            <div>
              <p className="flex items-center gap-2 text-3xl font-bold">
                <Flame
                  size={26}
                  aria-hidden="true"
                  className={progress.streak > 0 ? "text-orange-500" : muted}
                />
                {progress.streak}
              </p>
              <p className={`text-sm ${muted}`}>streak — cards in a row without help</p>
            </div>
            <div>
              <p className="flex items-center gap-2 text-3xl font-bold">
                <HandHelping size={26} aria-hidden="true" className={muted} />
                {progress.assistsUsed}
              </p>
              <p className={`text-sm ${muted}`}>helper assists used</p>
            </div>
          </div>
          <p className={`mt-4 text-xs ${muted}`}>
            This session only — progress resets when the demo server restarts.
          </p>
        </section>

        {/* Interests & strengths */}
        <div className="grid gap-8 sm:grid-cols-2">
          <section aria-label="Interests" className={theme.card}>
            <h2 className={sectionTitle}>Into right now</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {(student.interests ?? []).map((it) => (
                <li key={it} className={`rounded-full px-3 py-1 text-sm font-semibold ${pill}`}>
                  {it}
                </li>
              ))}
            </ul>
          </section>
          <section aria-label="Strengths" className={theme.card}>
            <h2 className={sectionTitle}>Strengths</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {(student.strengths ?? []).map((st) => (
                <li
                  key={st}
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${
                    dark ? "bg-violet-950 text-violet-200" : "bg-green-100 text-green-900"
                  }`}
                >
                  {st}
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Accommodations */}
        <section aria-label="Accommodations" className={theme.card}>
          <h2 className={sectionTitle}>How this app adapts for {student.name}</h2>
          <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {(student.accommodations ?? []).map((a) => (
              <li key={a} className="flex items-start gap-2.5">
                <Check
                  size={18}
                  aria-hidden="true"
                  className={`mt-1 shrink-0 ${dark ? "text-green-400" : "text-green-700"}`}
                />
                <span className="leading-relaxed">{a}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Reading level + preferred modes */}
        <section aria-label="Learning preferences" className={theme.card}>
          <h2 className={sectionTitle}>Learning preferences</h2>
          <div className="mt-4 space-y-4">
            {student.readingLevel && (
              <p className="flex items-start gap-2.5">
                <BookOpen size={18} aria-hidden="true" className={`mt-1 shrink-0 ${muted}`} />
                <span>
                  <span className="font-semibold">Reading: </span>
                  {student.readingLevel}
                </span>
              </p>
            )}
            <div className="flex flex-wrap gap-x-8 gap-y-3">
              <div>
                <p className={`mb-1.5 text-xs font-bold uppercase tracking-wide ${muted}`}>
                  Prefers to answer with
                </p>
                <ul className="flex flex-wrap gap-2">
                  {(student.preferredInput ?? []).map((m) => (
                    <li
                      key={m}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${pill}`}
                    >
                      {m === "keyboard" ? (
                        <Keyboard size={14} aria-hidden="true" />
                      ) : (
                        <MousePointer2 size={14} aria-hidden="true" />
                      )}
                      {INPUT_LABEL[m]}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className={`mb-1.5 text-xs font-bold uppercase tracking-wide ${muted}`}>
                  Learns best from
                </p>
                <ul className="flex flex-wrap gap-2">
                  {(student.preferredOutput ?? []).map((m) => (
                    <li
                      key={m}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${pill}`}
                    >
                      {m === "audio" ? (
                        <Volume2 size={14} aria-hidden="true" />
                      ) : (
                        <MonitorPlay size={14} aria-hidden="true" />
                      )}
                      {OUTPUT_LABEL[m]}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Teacher notes */}
        {student.notes && (
          <blockquote
            className={`rounded-r-xl border-l-4 p-5 text-lg leading-relaxed ${
              dark
                ? "border-violet-400 bg-neutral-900 text-neutral-200"
                : theme.id === "deaf"
                  ? "border-teal-500 bg-white text-neutral-800"
                  : theme.id === "dyslexia"
                    ? "border-amber-600 bg-[#FFFBF0] text-neutral-800"
                    : "border-amber-500 bg-white text-neutral-800"
            }`}
          >
            <p className={`mb-1 text-xs font-bold uppercase tracking-wide ${muted}`}>
              Teacher notes
            </p>
            {student.notes}
          </blockquote>
        )}
      </main>
    </div>
  );
}
