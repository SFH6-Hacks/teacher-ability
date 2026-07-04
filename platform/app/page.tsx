import Link from "next/link";
import { BookOpen, GraduationCap } from "lucide-react";
import { ROSTER } from "@/lib/demo-data";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <main id="main" className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-12 px-6 py-16">
        <header className="space-y-4 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-blue-600">
            Every Mind
          </p>
          <h1 className="text-5xl font-bold text-neutral-900">
            Homework that meets
            <br />
            every mind where it is.
          </h1>
          <p className="mx-auto max-w-xl text-lg leading-relaxed text-neutral-600">
            One lesson, one worksheet — rendered differently for each
            student&apos;s needs, with a friendly AI helper that guides
            thinking instead of giving answers.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/teacher"
            className="flex flex-col items-center gap-3 rounded-2xl border-2 border-neutral-900 bg-neutral-900 p-8 text-white hover:bg-neutral-800 focus:outline-2 focus:outline-offset-2 focus:outline-blue-600"
          >
            <GraduationCap size={32} aria-hidden="true" />
            <span className="text-xl font-bold">I&apos;m a teacher</span>
            <span className="text-sm text-neutral-300">
              Upload or record a lesson, personalise the homework
            </span>
          </Link>
          <div className="flex flex-col gap-3 rounded-2xl border-2 border-neutral-200 bg-white p-8">
            <span className="flex items-center justify-center gap-2 text-xl font-bold text-neutral-900">
              <BookOpen size={24} aria-hidden="true" />
              I&apos;m a student
            </span>
            <ul className="grid grid-cols-2 gap-2">
              {ROSTER.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/hw/${s.id}`}
                    className="block rounded-lg border border-neutral-300 px-3 py-2 text-center text-sm font-semibold text-blue-700 hover:bg-blue-50 focus:outline-2 focus:outline-offset-2 focus:outline-blue-600"
                  >
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="text-center text-xs text-neutral-500">
              Demo roster — each opens that student&apos;s personalised view
            </p>
          </div>
        </div>
      </main>
      <footer className="p-4 text-center text-xs text-neutral-400">
        Hackathon proof of concept — not for real classroom use.
      </footer>
    </div>
  );
}
