import Link from "next/link";
import { notFound } from "next/navigation";
import { BACKUP_SUMMARY, getStudent } from "@/lib/demo-data";
import { lesson } from "@/lib/store";
import ProfileContent from "@/components/layout/ProfileContent";
import TtsPlayer from "@/components/slides/TtsPlayer";

export const dynamic = "force-dynamic";

// Light subfeature: a static per-profile view of the lesson slides.
export default async function LessonPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const student = getStudent(studentId);
  if (!student) notFound();

  const summary = lesson.summary.length ? lesson.summary : BACKUP_SUMMARY;

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-wide text-neutral-500">
              {student.name}&apos;s view — {student.profileLabel}
            </p>
            <h1 className="text-xl font-bold">{lesson.title}</h1>
          </div>
          <Link
            href={`/hw/${student.id}`}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-2 focus:outline-offset-2 focus:outline-blue-600"
          >
            Go to homework
          </Link>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-3xl space-y-8 p-6">
        {student.profile === "deaf" && (
          <section
            aria-label="Lesson summary"
            className="rounded-xl border-l-4 border-blue-600 bg-white p-6 shadow-sm"
          >
            <h2 className="mb-3 text-xl font-bold">What the teacher said</h2>
            <ul className="list-disc space-y-2 pl-5 text-xl leading-relaxed">
              {summary.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
            {lesson.transcript && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-semibold text-neutral-600">
                  Full transcript
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                  {lesson.transcript}
                </p>
              </details>
            )}
          </section>
        )}

        <ProfileContent profile={student.profile}>
          {lesson.slides.map((slide) => (
            <section
              key={slide.index}
              aria-label={`Slide ${slide.index}`}
              className="rounded-xl border border-neutral-200 bg-white p-8 shadow-sm"
            >
              <p className="mb-2 font-mono text-xs text-neutral-500">
                Slide {slide.index} of {lesson.slides.length}
              </p>
              <h2 className="mb-3 text-2xl font-bold">{slide.title}</h2>
              <p className="leading-relaxed">{slide.content_text}</p>
              {slide.image_alt && (
                <p className="mt-4 rounded-lg bg-neutral-100 p-4 text-neutral-700">
                  <span className="font-semibold">Image: </span>
                  {slide.image_alt}
                </p>
              )}
              {student.profile === "blind" && (
                <div className="mt-6">
                  <TtsPlayer
                    text={`${slide.title}. ${slide.content_text}${slide.image_alt ? ` Image: ${slide.image_alt}` : ""}`}
                  />
                </div>
              )}
            </section>
          ))}
        </ProfileContent>
      </main>
    </div>
  );
}
