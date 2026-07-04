import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="font-sans bg-background text-foreground min-h-screen">
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-8 py-4 flex items-center gap-4">
          <span className="font-serif font-semibold text-[22px] tracking-tight">Recast</span>
          <span className="ml-auto text-xs font-semibold text-stone-500 font-mono uppercase tracking-widest">
            Hackathon demo · built on Gemini
          </span>
          <Link
            href="/teacher"
            className="bg-teal-700 text-white rounded-full px-5 py-2.5 text-[13.5px] font-semibold hover:bg-teal-800 transition-colors"
          >
            Watch the demo
          </Link>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-8 pt-24 pb-20 text-left">
        <p className="font-mono text-[12.5px] font-semibold tracking-widest uppercase text-teal-700 mb-5">
          One lesson · every mind
        </p>
        <h1 className="text-[52px] leading-[1.06] font-bold tracking-tight mb-6">
          A classroom of one<br />
          lesson, rendered<br />
          <em className="font-serif italic font-medium text-teal-700">differently for every mind.</em>
        </h1>
        <p className="max-w-2xl text-lg leading-[1.6] text-stone-700 mb-10">
          Teach once. Recast follows each student's profile live in class — then carries that exact lesson, slide by slide, into their homework. Not another content generator. The same context, from lesson to homework, for one student.
        </p>
        <div className="flex gap-4 items-center">
          <Link
            href="/teacher"
            className="bg-teal-700 text-white rounded-xl px-7 py-3.5 text-[15px] font-semibold hover:bg-teal-800 transition-colors"
          >
            See the live demo
          </Link>
          <a
            href="#grounded"
            className="border border-stone-300 text-stone-700 rounded-xl px-7 py-3.5 text-[15px] font-semibold hover:bg-stone-200 transition-colors"
          >
            Read how it's grounded
          </a>
        </div>
      </section>

      <section className="bg-zinc-900 text-stone-50 py-16 px-8">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <p className="text-2xl leading-[1.5] font-medium font-serif italic">
            "Every accommodation plan I write turns into paperwork nobody has time to act on mid-lesson."
          </p>
          <p className="text-sm leading-[1.65] text-stone-400">
            — the gap Recast starts from. Accommodations exist on paper. They rarely reach the moment a student is actually stuck, live, in class or at the kitchen table that night.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto py-24 px-8">
        <p className="font-mono text-[12.5px] font-semibold tracking-widest uppercase text-stone-500 mb-3 text-center">
          How it works
        </p>
        <h2 className="text-center text-3xl font-bold tracking-tight mb-16">
          One context, carried the whole way
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-stone-200 rounded-2xl p-8">
            <p className="font-mono text-xs text-teal-700 font-bold mb-3">01 — LIVE LESSON</p>
            <h3 className="text-[19px] font-bold mb-3">Teach normally. Recast adapts silently.</h3>
            <p className="text-sm leading-[1.6] text-stone-600">
              One slide deck, one classroom. Sam gets it read aloud in sequence. Tom gets a live AI summary of what you just said, in writing, above the raw captions.
            </p>
          </div>
          <div className="bg-white border border-stone-200 rounded-2xl p-8">
            <p className="font-mono text-xs text-teal-700 font-bold mb-3">02 — RECAST HOMEWORK</p>
            <h3 className="text-[19px] font-bold mb-3">One worksheet becomes four.</h3>
            <p className="text-sm leading-[1.6] text-stone-600">
              Same questions, same rigor — reformatted per profile: chunked and calm for Aisha, one small step at a time for Leo, TTS-first and linear for Sam.
            </p>
          </div>
          <div className="bg-white border border-stone-200 rounded-2xl p-8">
            <p className="font-mono text-xs text-teal-700 font-bold mb-3">03 — GROUNDED Q&A</p>
            <h3 className="text-[19px] font-bold mb-3">Stuck on question 3? Ask.</h3>
            <p className="text-sm leading-[1.6] text-stone-600">
              The answer is generated only from the lesson you just watched — cited back to the slide. If it isn't in the lesson, it says so, out loud.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white border-y border-stone-200 py-24 px-8">
        <div className="max-w-6xl mx-auto">
          <p className="font-mono text-[12.5px] font-semibold tracking-widest uppercase text-stone-500 mb-3 text-center">
            Meet the room
          </p>
          <h2 className="text-center text-3xl font-bold tracking-tight mb-16">
            Four minds, one lesson: Newton's Third Law
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div className="border border-stone-200 rounded-2xl p-6 text-center">
              <span className="flex w-14 h-14 rounded-2xl bg-amber-500 items-center justify-center text-2xl mx-auto mb-4">🦊</span>
              <h4 className="mb-1 text-base font-bold">Aisha</h4>
              <p className="mb-3 text-xs font-semibold text-stone-500">Dyslexia</p>
              <p className="text-[12.5px] leading-[1.55] text-stone-600">
                Calm typography, short chunks, read-aloud on every card.
              </p>
            </div>
            <div className="border border-stone-200 rounded-2xl p-6 text-center">
              <span className="flex w-14 h-14 rounded-2xl bg-red-500 items-center justify-center text-2xl mx-auto mb-4">🚀</span>
              <h4 className="mb-1 text-base font-bold">Leo</h4>
              <p className="mb-3 text-xs font-semibold text-stone-500">ADHD</p>
              <p className="text-[12.5px] leading-[1.55] text-stone-600">
                One step at a time, visible progress, small wins that celebrate.
              </p>
            </div>
            <div className="border border-stone-200 rounded-2xl p-6 text-center">
              <span className="flex w-14 h-14 rounded-2xl bg-violet-500 items-center justify-center text-2xl mx-auto mb-4">🎧</span>
              <h4 className="mb-1 text-base font-bold">Sam</h4>
              <p className="mb-3 text-xs font-semibold text-stone-500">Blind / low-vision</p>
              <p className="text-[12.5px] leading-[1.55] text-stone-600">
                Linear, speakable, TTS-first — nothing conveyed by sight alone.
              </p>
            </div>
            <div className="border border-stone-200 rounded-2xl p-6 text-center">
              <span className="flex w-14 h-14 rounded-2xl bg-teal-500 items-center justify-center text-2xl mx-auto mb-4">🎨</span>
              <h4 className="mb-1 text-base font-bold">Tom</h4>
              <p className="mb-3 text-xs font-semibold text-stone-500">Deaf / hard of hearing</p>
              <p className="text-[12.5px] leading-[1.55] text-stone-600">
                Text-first recap of everything spoken, nothing audio-only.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="grounded" className="max-w-4xl mx-auto py-24 px-8">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-700 mt-2.5 animate-pulse shrink-0"></span>
          <div>
            <p className="font-mono text-[12.5px] font-semibold tracking-widest uppercase text-teal-700 mb-3">
              Why this is a Gemini story, not a generator
            </p>
            <h2 className="text-[28px] font-bold tracking-tight mb-4">
              Grounded, not guessing.
            </h2>
            <p className="text-base leading-[1.65] text-stone-700 mb-5">
              Every homework answer is generated from a context window built entirely out of <em className="font-serif italic font-medium">this class's</em> transcript and slides — not the model's general knowledge. Ask something the lesson didn't cover, and it says so, explicitly, instead of filling the gap.
            </p>
            <p className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 text-teal-700 rounded-xl px-4 py-2.5 text-[13.5px] font-semibold">
              "Based on: Slide 3 — Force pairs" — the citation shown with every grounded answer.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-zinc-900 text-stone-50 py-24 px-8 text-center">
        <p className="font-serif italic font-medium text-[26px] leading-[1.5] max-w-2xl mx-auto mb-8">
          "One profile, one lesson context — follows the student through class and homework. Not a generator. A system."
        </p>
        <Link
          href="/teacher"
          className="bg-teal-700 text-white rounded-xl px-8 py-4 text-[15px] font-semibold inline-block hover:bg-teal-800 transition-colors"
        >
          Walk through the demo
        </Link>
      </section>

      <footer className="py-8 px-8 text-center text-xs text-stone-400">
        Recast · built for the hackathon on Gemini · demo data, four students, one lesson.
      </footer>
    </div>
  );
}
