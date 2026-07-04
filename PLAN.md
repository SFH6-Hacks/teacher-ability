# Every Mind — Hackathon Build Plan

## Context

Hackathon MVP: a homework accessibility platform where a teacher uploads homework + slides (or records themselves teaching), picks a student from a demo roster (each with a specific disability profile), and the app generates a **Seneca-style personalized homework experience** — bitesized concept cards interleaved with the homework questions, adapted to that student's profile. On the student page, a **Clicky-style AI companion** (heyclicky.com reference) trails the cursor, gives multi-step guided walkthroughs, and **draws annotations on the actual page** — but never gives away answers.

**Spec precedence:** the user's message > `DESIGN.md` + `SPEC.md` > the pasted MASTER SPEC. Key overrides:
- **All AI is Gemini** (not Claude). The flagship AI feature is the cursor companion.
- **Demo data only**: hardcoded roster; file upload UI is fake — the same bundled demo homework/slides are used regardless of what's uploaded (no PDF parsing).
- Live-classroom sync is a **very light subfeature** (static per-profile lesson viewer, no WebSockets).
- App lives in `platform/` (existing fresh Next.js 16 + Tailwind v4 + TS scaffold).
- Follow `DESIGN.md` accessibility rules (profile-driven layouts, React Aria, semantic HTML, TTS order, reduced-motion, contrast) and `AGENTS.md` (minimal, surgical code).

## Roster (demo data, hardcoded)

| ID | Name | Profile | Homework transform |
|---|---|---|---|
| `aisha` | Aisha | dyslexia | Reformat only: chunked 2–3 sentence blocks, left-aligned, 1.5+ line height, ~65ch, 18px+ |
| `leo` | Leo | adhd | Numbered checklist of tiny sub-steps, one action per line, progress checkboxes, generous spacing |
| `sam` | Sam | blind / low-vision | Clean semantic structure (title → body → image alt), TTS player, high contrast |
| `tom` | Tom | deaf | Text-first; lesson recap bullets prominent; no audio-dependent content |

Demo lesson: **Newton's Third Law** (per DESIGN.md) — slides with `content_text` + `image_alt`, a canned "recorded lesson" transcript, and one demo homework worksheet (physics questions). All in `lib/demo-data.ts`.

## Dependencies to add (in `platform/`)

`@google/genai` (Gemini SDK), `react-aria-components`, `framer-motion`, `lucide-react`. Fonts: Geist Sans/Mono via `next/font` (already in scaffold), Instrument Serif for teacher/marketing accent only. **Skip shadcn** — React Aria + Tailwind covers the needed primitives with less setup (deviation from DESIGN.md stack list, same accessibility guarantees).

Env: `platform/.env.local` → `GEMINI_API_KEY` (user provides). Model: `gemini-2.5-flash` with structured JSON output (`responseSchema`); fall back to canned data on error (DESIGN.md: "never show an empty student view to a judge").

## Architecture / Files

```
platform/
  lib/types.ts            — Student, Profile, Slide, Lesson, HomeworkCard, WalkthroughStep
  lib/demo-data.ts        — roster, Newton's 3rd Law slides, demo homework text,
                            backup transcript, PREGENERATED fallback card decks per profile
  lib/store.ts            — module-level in-memory Map: generated assignments, transcripts
  lib/gemini.ts           — Gemini client + JSON-schema call helper with timeout+fallback

  app/layout.tsx          — fonts, skip-link, landmarks
  app/page.tsx            — landing: "I'm a Teacher" / "I'm a Student" + roster shortcut
  app/teacher/page.tsx    — teacher dashboard (the whole teacher flow, one page):
                            1. Upload zone: drag/drop homework + slides (accepts anything,
                               always maps to bundled demo files — labeled with filenames)
                            2. OR "Record your lesson" tab: browser SpeechRecognition
                               captures teacher speech live into a transcript panel;
                               "Use backup transcript" button as stage fallback
                            3. Roster grid: pick student card (name, profile, needs summary)
                            4. "Generate for <name>" → POST /api/generate → link to student page
  app/hw/[studentId]/page.tsx — the Seneca-style student experience (see below)
  app/lesson/[studentId]/page.tsx — LIGHT subfeature: static slide viewer rendered per
                            profile (TTS + image alt for sam, summary-first for tom,
                            dyslexia typography for aisha). No sync, no sockets.

  app/api/generate/route.ts  — homework + slides + transcript + profile → Gemini →
                               structured card deck JSON; store in memory; fallback deck on error
  app/api/assist/route.ts    — cursor companion brain: question card + student attempt state +
                               profile + lesson context + annotatable element map → Gemini →
                               multi-step walkthrough plan JSON (never the answer)
  app/api/summarize/route.ts — recorded transcript delta → 2-3 recap bullets (teacher record tab)

  components/layout/ProfileContent.tsx — profile-scoped typography/structure wrapper (DESIGN.md classes)
  components/slides/TtsPlayer.tsx      — speechSynthesis Play/Pause/Stop, aria-labels,
                                         reads title → body → image alt; reused on hw + lesson pages
  components/homework/CardRenderer.tsx — renders card types (see schema)
  components/homework/ProgressBar.tsx  — "Card X of Y", instant fill, aria-valuenow
  components/homework/Scratchpad.tsx   — local <textarea>, no backend
  components/assistant/Companion.tsx   — the Clicky-style orb (see below)
  components/assistant/AnnotationLayer.tsx — full-page SVG overlay for drawings
```

## Card deck schema (Gemini structured output for /api/generate)

```ts
{
  title: string,
  cards: Array<
    | { type: "concept"; heading: string; body: string; slideRef?: number }   // bitesize recap from lesson
    | { type: "mcq"; question: string; options: string[]; correctIndex: number; explanation: string }
    | { type: "short"; question: string; keywords: string[]; modelPoints: string[] }
    | { type: "steps"; question: string; steps: string[] }                    // ADHD sub-step checklist
  >
}
```

Generation prompt adapts per profile (dyslexia: same content, chunked; ADHD: everything decomposed into steps + more frequent small wins; blind: linear semantic, alt text spoken; deaf: recap bullets from transcript made prominent). Student page renders **one card at a time** with prev/next + progress bar + `?card=N` URL param (refresh-safe). Final card → celebration screen. MCQ answers check locally with instant feedback (correct = green + label + icon, never color alone).

## The cursor companion (the flagship feature)

**Look/feel (Clicky-inspired):** a soft glowing orb with a simple face, trailing the cursor via framer-motion spring (`useMotionValue` on pointermove, gated by `prefers-reduced-motion` → static docked corner position instead). Idle blink animation. Click it (or press `/`) to open a small input bubble; also an "I'm stuck" button on each question card. Optional voice input via `SpeechRecognition` (same API as teacher recording — reuse).

**Multi-step walkthrough flow:**
1. Question card elements are tagged `data-spot="q-text" | "option-2" | "keyword-hint"` etc. Frontend sends `/api/assist` the card JSON, the spot map (id → text), student's question/attempt count, profile, and lesson context (slides + transcript).
2. Gemini returns a JSON plan: `{ steps: [{ say: string; spot?: string; draw?: "circle"|"underline"|"arrow"; }] }` — 2–4 steps, escalating hints (Socratic ladder), **system prompt hard rule: never state the answer or eliminate options to one; if asked directly for the answer, encourage and redirect; ground everything in the provided lesson content and cite the slide ("From Slide 3…")**.
3. Frontend plays steps sequentially: orb glides to the target element (`getBoundingClientRect`), `AnnotationLayer` draws an animated SVG circle/underline/arrow around it, speech bubble shows `say` text (and TTS-speaks it for sam's profile). "Next"/"Got it" advances; annotations fade between steps.
4. 3 assists per card, then companion says "You've got this — try it, or ask your teacher." (anti-reliance).
5. Fallback if Gemini fails: canned generic step plan ("Read the question again — what is it really asking?").

Bubble region uses `aria-live="polite"`; every companion action reachable by keyboard.

## Teacher recording (sub-feature)

On the teacher dashboard "Record" tab: mic button → `webkitSpeechRecognition` continuous mode → interim + final transcript rendered live; every ~45s (or on stop) send delta to `/api/summarize` → recap bullets shown. Transcript + bullets are stored in the in-memory lesson and fed into generation + assist context. "Load backup transcript" button injects the canned transcript (stage-failure insurance, per SPEC.md).

## Design execution

Per DESIGN.md, strictly: Geist Sans everywhere on student content, type scale 12–48, 4px spacing grid, WCAG AA contrast, light reading surfaces on student views (teacher dashboard may be denser/darker), all interactive elements are React Aria/`<button>`, visible focus rings, `aria-live` on dynamic regions, `prefers-reduced-motion` gates all framer-motion. Student pages are labeled "Aisha's view" etc. Landing/teacher pages get the polish (accent Instrument Serif line allowed there only).

## Implementation order

1. `lib/types.ts`, `lib/demo-data.ts`, `lib/store.ts`, `lib/gemini.ts` — foundation + fallback decks.
2. Student homework page + CardRenderer + ProgressBar + ProfileContent + TtsPlayer (works fully off fallback decks before Gemini is wired).
3. `/api/generate` + teacher dashboard (upload zone, roster, generate → link).
4. Cursor companion: Companion orb + AnnotationLayer + `/api/assist` + hint ladder.
5. Recording tab + `/api/summarize`; light `/lesson/[studentId]` viewer.
6. Landing page polish, celebration screen, keyboard/reduced-motion pass, error states.

## Verification

- `npm run dev` in `platform/`; walk the demo path: teacher uploads (fake) files → picks Aisha → generate → open student link → cards render with dyslexia typography → prev/next + progress + `?card=` persistence → "I'm stuck" → companion glides, draws a circle on the question, 3-step hint ladder, refuses to give the answer when asked directly.
- Repeat for Leo (checklist steps), Sam (TTS reads title→body→alt), Tom (recap bullets prominent).
- Kill `GEMINI_API_KEY` → confirm fallback decks + canned hints render (no empty judge views).
- Record tab: speak → transcript appears → summary bullets; backup transcript button works.
- Tab through the entire student page with keyboard only; check `prefers-reduced-motion` docks the orb.
- `npm run build` passes clean.
