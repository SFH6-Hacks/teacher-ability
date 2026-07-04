"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PartyPopper } from "lucide-react";
import type { Deck, Student } from "@/lib/types";
import ProfileContent from "@/components/layout/ProfileContent";
import CardRenderer from "./CardRenderer";
import ProgressBar from "./ProgressBar";
import Scratchpad from "./Scratchpad";
import Companion from "@/components/assistant/Companion";

function Experience({ student, deck }: { student: Student; deck: Deck }) {
  const router = useRouter();
  const params = useSearchParams();
  const total = deck.cards.length;
  const raw = Number(params.get("card") ?? "1");
  const done = params.get("card") === "done";
  const index = Math.min(Math.max(Number.isNaN(raw) ? 1 : raw, 1), total) - 1;

  const goTo = (card: number | "done") => {
    router.replace(`?card=${card}`, { scroll: true });
  };

  if (done) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 p-8 text-center">
        <PartyPopper size={48} className="text-blue-600" aria-hidden="true" />
        <h1 className="text-3xl font-bold">
          Great work, {student.name}!
        </h1>
        <p className="text-lg text-neutral-700">
          You worked through all {total} cards of {deck.title}.
        </p>
        <button
          type="button"
          onClick={() => goTo(1)}
          className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-neutral-100 focus:outline-2 focus:outline-offset-2 focus:outline-blue-600"
        >
          Start again
        </button>
      </main>
    );
  }

  const card = deck.cards[index];
  const isLast = index === total - 1;

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-wide text-neutral-500">
              {student.name}&apos;s view — {student.profileLabel}
            </p>
            <h1 className="text-xl font-bold">{deck.title}</h1>
          </div>
          <div className="w-full max-w-sm">
            <ProgressBar current={index + 1} total={total} />
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto grid max-w-5xl gap-8 p-6 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-6">
          <ProfileContent profile={student.profile}>
            <CardRenderer
              key={index}
              card={card}
              profile={student.profile}
            />
          </ProfileContent>

          <nav aria-label="Card navigation" className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => goTo(index)}
              disabled={index === 0}
              className="rounded-lg border border-neutral-300 bg-white px-6 py-3 text-base font-semibold text-neutral-800 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-2 focus:outline-offset-2 focus:outline-blue-600"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => goTo(isLast ? "done" : index + 2)}
              className="rounded-lg bg-blue-600 px-8 py-3 text-base font-semibold text-white hover:bg-blue-700 focus:outline-2 focus:outline-offset-2 focus:outline-blue-600"
            >
              {isLast ? "Done!" : "Next"}
            </button>
          </nav>
        </div>

        <aside className="hidden lg:block">
          <Scratchpad />
        </aside>
      </main>

      <Companion
        profile={student.profile}
        card={card}
        cardKey={`${student.id}-${index}`}
      />
    </div>
  );
}

export default function HomeworkExperience(props: {
  student: Student;
  deck: Deck;
}) {
  // useSearchParams requires a Suspense boundary in Next App Router
  return (
    <Suspense>
      <Experience {...props} />
    </Suspense>
  );
}
