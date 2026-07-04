"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  Copy,
  FileText,
  Loader2,
  Mic,
  MicOff,
  Presentation,
  Sparkles,
  Upload,
} from "lucide-react";
import { BACKUP_TRANSCRIPT, ROSTER } from "@/lib/demo-data";
import { useSpeechRecognition } from "@/lib/useSpeechRecognition";
import type { Deck } from "@/lib/types";

function FileDrop({
  label,
  icon,
  file,
  onFile,
}: {
  label: string;
  icon: React.ReactNode;
  file: string | null;
  onFile: (name: string) => void;
}) {
  const id = label.toLowerCase().replace(/\s/g, "-");
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-neutral-600 bg-neutral-800/50 p-8 text-center hover:border-blue-500 focus-within:outline-2 focus-within:outline-blue-500"
    >
      {icon}
      <span className="font-semibold text-neutral-100">{label}</span>
      {file ? (
        <span className="inline-flex items-center gap-1 text-sm text-green-400">
          <Check size={14} aria-hidden="true" /> {file}
        </span>
      ) : (
        <span className="text-sm text-neutral-400">
          Drop a file or click to browse
        </span>
      )}
      <input
        id={id}
        type="file"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f.name);
        }}
      />
    </label>
  );
}

function RecordTab() {
  const speech = useSpeechRecognition();
  const [summary, setSummary] = useState<string[]>([]);
  const [summarizing, setSummarizing] = useState(false);

  const summarize = async (transcript: string) => {
    if (!transcript.trim()) return;
    setSummarizing(true);
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      const data = (await res.json()) as { summary?: string[] };
      if (data.summary) setSummary(data.summary);
    } finally {
      setSummarizing(false);
    }
  };

  const loadBackup = () => {
    speech.setFinalText(BACKUP_TRANSCRIPT);
    void summarize(BACKUP_TRANSCRIPT);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            if (speech.listening) {
              speech.stop();
              void summarize(speech.finalText);
            } else {
              speech.start();
            }
          }}
          disabled={!speech.supported}
          className={`inline-flex items-center gap-2 rounded-lg px-5 py-3 font-semibold focus:outline-2 focus:outline-offset-2 focus:outline-blue-500 disabled:opacity-50 ${
            speech.listening
              ? "bg-red-600 text-white hover:bg-red-700"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {speech.listening ? (
            <>
              <MicOff size={18} aria-hidden="true" /> Stop recording
            </>
          ) : (
            <>
              <Mic size={18} aria-hidden="true" /> Record your lesson
            </>
          )}
        </button>
        <button
          type="button"
          onClick={loadBackup}
          className="rounded-lg border border-neutral-600 px-4 py-3 text-sm font-semibold text-neutral-200 hover:bg-neutral-800 focus:outline-2 focus:outline-offset-2 focus:outline-blue-500"
        >
          Use backup transcript
        </button>
        {!speech.supported && (
          <p className="text-sm text-amber-400">
            Speech recognition isn&apos;t available in this browser — use the
            backup transcript.
          </p>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-neutral-300">
          Transcript {speech.listening && <span className="text-red-400">● live</span>}
        </h3>
        <div
          aria-live="polite"
          className="min-h-28 rounded-lg border border-neutral-700 bg-neutral-900 p-4 text-sm leading-relaxed text-neutral-200"
        >
          {speech.finalText || (
            <span className="text-neutral-500">
              Your speech appears here and grounds the homework help for every
              student.
            </span>
          )}
          <span className="text-neutral-500"> {speech.interim}</span>
        </div>
      </div>

      <div aria-live="polite">
        {summarizing && (
          <p className="inline-flex items-center gap-2 text-sm text-neutral-300">
            <Loader2 size={14} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
            Summarizing with Gemini…
          </p>
        )}
        {summary.length > 0 && (
          <div className="rounded-lg border-l-4 border-blue-500 bg-neutral-800 p-4">
            <h3 className="mb-2 text-sm font-semibold text-blue-300">
              Lesson recap (what students will see)
            </h3>
            <ul className="list-disc space-y-1 pl-5 text-neutral-100">
              {summary.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function RosterCard({ student }: { student: (typeof ROSTER)[number] }) {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [source, setSource] = useState<Deck["generatedBy"] | null>(null);
  const [copied, setCopied] = useState(false);
  const link = `/hw/${student.id}`;

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
    <div className="flex flex-col gap-3 rounded-xl border border-neutral-700 bg-neutral-800/60 p-5">
      <div>
        <h3 className="text-lg font-bold text-white">{student.name}</h3>
        <p className="text-sm font-semibold text-blue-300">{student.profileLabel}</p>
        <p className="mt-1 text-sm text-neutral-400">{student.needs}</p>
      </div>
      <div className="mt-auto space-y-2" aria-live="polite">
        <button
          type="button"
          onClick={() => void generate()}
          disabled={state === "loading"}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 focus:outline-2 focus:outline-offset-2 focus:outline-blue-500"
        >
          {state === "loading" ? (
            <>
              <Loader2 size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
              Personalising for {student.name}…
            </>
          ) : (
            <>
              <Sparkles size={16} aria-hidden="true" />
              {state === "done" ? "Regenerate" : "Generate homework"}
            </>
          )}
        </button>
        {state === "done" && (
          <div className="flex items-center gap-2">
            <Link
              href={link}
              className="flex-1 truncate rounded-lg border border-neutral-600 px-3 py-2 text-center text-sm font-semibold text-green-400 hover:bg-neutral-700 focus:outline-2 focus:outline-blue-500"
            >
              Open {student.name}&apos;s homework
            </Link>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(
                  `${window.location.origin}${link}`,
                );
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              aria-label="Copy student link"
              className="rounded-lg border border-neutral-600 p-2 text-neutral-300 hover:bg-neutral-700 focus:outline-2 focus:outline-blue-500"
            >
              {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
            </button>
          </div>
        )}
        {state === "done" && source === "fallback" && (
          <p className="text-xs text-amber-400">
            Gemini unavailable — using the prepared version.
          </p>
        )}
      </div>
    </div>
  );
}

export default function TeacherPage() {
  const [tab, setTab] = useState<"upload" | "record">("upload");
  const [hwFile, setHwFile] = useState<string | null>(null);
  const [slidesFile, setSlidesFile] = useState<string | null>(null);

  const tabBtn = (active: boolean) =>
    `rounded-lg px-4 py-2 text-sm font-semibold focus:outline-2 focus:outline-offset-2 focus:outline-blue-500 ${
      active ? "bg-blue-600 text-white" : "text-neutral-300 hover:bg-neutral-800"
    }`;

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100">
      <main id="main" className="mx-auto max-w-4xl space-y-10 px-6 py-10">
        <header>
          <p className="font-mono text-xs uppercase tracking-widest text-blue-400">
            Every Mind — teacher
          </p>
          <h1 className="mt-1 text-3xl font-bold text-white">
            Set up today&apos;s homework
          </h1>
          <p className="mt-2 max-w-prose text-neutral-400">
            Add your lesson material, then generate a personalised version of
            the homework for each student. One upload — every mind gets their
            own way in.
          </p>
        </header>

        <section aria-label="Lesson material" className="space-y-4">
          <div role="tablist" aria-label="How to add your lesson" className="flex gap-2">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "upload"}
              onClick={() => setTab("upload")}
              className={tabBtn(tab === "upload")}
            >
              <span className="inline-flex items-center gap-2">
                <Upload size={16} aria-hidden="true" /> Upload files
              </span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "record"}
              onClick={() => setTab("record")}
              className={tabBtn(tab === "record")}
            >
              <span className="inline-flex items-center gap-2">
                <Mic size={16} aria-hidden="true" /> Record yourself teaching
              </span>
            </button>
          </div>

          {tab === "upload" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <FileDrop
                label="Homework"
                icon={<FileText size={28} className="text-blue-400" aria-hidden="true" />}
                file={hwFile}
                onFile={setHwFile}
              />
              <FileDrop
                label="Slides"
                icon={<Presentation size={28} className="text-violet-400" aria-hidden="true" />}
                file={slidesFile}
                onFile={setSlidesFile}
              />
              <p className="text-xs text-neutral-500 sm:col-span-2">
                Hackathon demo: files map to the bundled “Newton&apos;s Third
                Law” lesson and worksheet.
              </p>
            </div>
          ) : (
            <RecordTab />
          )}
        </section>

        <section aria-label="Class roster" className="space-y-4">
          <h2 className="text-xl font-bold text-white">Your class</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {ROSTER.map((s) => (
              <RosterCard key={s.id} student={s} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
