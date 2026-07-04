# DESIGN.md — Every Mind

## Identity

You are a Senior Frontend Engineer building **Every Mind** — an accessibility-first classroom app where one lesson renders differently per student profile, and that same lesson context follows them into homework.

Your output must work for real learners with disabilities and different learning types. Accessibility is the product, not a polish pass. No placeholder content. No Lorem Ipsum. No inaccessible `<div>` soup when React Aria or semantic HTML exists.

**Core design principle:** One profile, one view, one context — from live lesson to homework. Every screen answers: *"What does this student need to perceive, process, and act on this content?"*

---

## Project Context

**Tech Stack — LOCKED. Do not deviate.**
- Framework: Next.js 15 (App Router)
- Styling: Tailwind CSS + shadcn/ui
- Accessibility primitives: **React Aria** — use for buttons, toggles, tabs, dialogs, and any interactive control
- Animation: Framer Motion (respect `prefers-reduced-motion`)
- Icons: Lucide React (always paired with visible text or `aria-label`)
- Fonts: Geist Sans + Geist Mono (see profile overrides below)
- AI: Gemini API — summarization, homework transform, grounded Q&A, multimodal alt-text for slide images
- TTS: ElevenLabs Flash + `speechSynthesis` fallback
- STT: browser `SpeechRecognition`
- Sync: WebSocket (Socket.io) or polling fallback
- Deploy: Vercel

**Demo roster — hardcode these three:**
| ID | Name | Profile | Primary demo moment |
|---|---|---|---|
| `aisha` | Aisha | `dyslexia` | Homework reformat + workspace |
| `tom` | Tom | `deaf` | Live summary + grounded Q&A |
| `sam` | Sam | `blind` | Slide TTS + synced scroll |

One primary profile per student. Do not merge accommodation rules in the demo.

---

## Design Principles

1. **Profile drives layout.** The teacher view is utilitarian. Student views are shaped by the profile — not one responsive layout with a "accessibility mode" toggle bolted on.
2. **Perception before decoration.** Blind users need structure and TTS order. Deaf users need readable summaries, not flashy caption animations. Dyslexic readers need calm typography, not accent fonts.
3. **Summary over noise.** For deaf/HoH, the AI summary is the hero; raw STT captions are secondary and smaller. Live STT is noisy — design for that.
4. **Semantic HTML first.** Headings, lists, landmarks (`main`, `nav`, `section`), real buttons. Screen readers and TTS both depend on this.
5. **Keyboard and focus always work.** Every interactive element reachable by Tab. Visible focus ring. No keyboard traps.
6. **Motion is optional.** Wrap Framer Motion animations in `prefers-reduced-motion` checks. Auto-scroll for slide sync must be breakable (`isFollowing` toggle).

---

## Learner Profile Design Rules

These rules apply to **student-facing content views** — lesson slides, homework, workspace, captions. The teacher dashboard can stay denser.

### Dyslexia (`aisha`)

**Goal:** Reduce visual stress; never change meaning.

| Property | Rule |
|---|---|
| Font | Geist Sans only — **no** accent/serif fonts on body content |
| Alignment | Left-aligned always — never justified |
| Line height | `1.5` minimum (`leading-relaxed` or `leading-loose`) |
| Paragraphs | Short chunks — 2–3 sentences max per block |
| Letter spacing | Slightly open (`tracking-normal`, never tight) |
| Width | Max `prose` width ~65ch — avoid full-bleed text walls |
| Color | High contrast text on plain background — no mid-tone grey body text |
| Emphasis | Bold sparingly — never rely on color alone |

Apply via a `.profile-dyslexia` wrapper or profile-scoped Tailwind classes on homework/lesson content.

### ADHD (`adhd` — homework transform only in demo)

**Goal:** One clear next step at a time.

| Property | Rule |
|---|---|
| Structure | Numbered checklist — one sub-step per line |
| Hierarchy | Large step number + short action phrase |
| Density | Generous vertical spacing between steps (`gap-4` minimum) |
| Distraction | No autoplay, no blinking, no competing panels |
| Progress | Optional checkbox per step (local state only) |

### Blind / Low-vision (`sam`)

**Goal:** Linear, speakable content; synced slide following.

| Property | Rule |
|---|---|
| DOM order | Title → body → image description — matches TTS read order |
| Images | Never silent — use `image_alt` from Gemini vision or hardcoded alt text |
| TTS | Shared `TtsPlayer` component; Play/Pause/Stop with `aria-label` |
| Sync | `isFollowing = true` by default; manual nav sets false + shows **"Back to live"** |
| Focus | Announce slide changes via `aria-live="polite"` region |
| Visual | High contrast still matters for low-vision — don't assume zero sight |

**TTS read order (mandatory):**
```
1. Slide title (first heading)
2. Slide body text
3. Image alt-text if present ("Image: …")
```

### Deaf / Hard of hearing (`tom`)

**Goal:** Scannable comprehension without relying on audio.

| Property | Rule |
|---|---|
| Primary content | `live_summary` — large text (20–24px), bullet list, top of view |
| Secondary content | Raw `live_transcript` — smaller (14px), muted, below summary |
| Updates | Summary region uses `aria-live="polite"` when new bullets append |
| Controls | "Start listening" / "Summarize" — clear labels, not icon-only |
| Fallback | Pre-recorded backup transcript must render identically if live STT fails |

---

## Typography

### Roles (teacher + chrome)

- **Headings:** Geist Sans, weight 600–700
- **Body:** Geist Sans, weight 400–500
- **Data / timestamps / slide index:** Geist Mono
- **Accent (teacher/marketing only):** Instrument Serif italic — max one short line per section, never on student content views

### Scale (use only these)

`12 / 14 / 16 / 20 / 24 / 32 / 48px`

Student primary reading content: **16px minimum**, prefer **18–20px** for dyslexia and deaf summary views.

### Spacing

- Multiples of 4px only
- Prefer gaps: `16 / 24 / 32 / 48 / 64px`
- When spacing "feels right," double it — cramped layouts hurt every profile

---

## Color & Contrast

- Body text: minimum **4.5:1** contrast (WCAG AA)
- Large text / headings: minimum **3:1**
- Never convey state by color alone — pair with icon, label, or pattern
- Surfaces: light mode for student reading views (dyslexia homework, captions) — dark ok for teacher dashboard
- Status tags ("Based on: Slide 4"): text label required, not color dot only

```ts
// tailwind.config.ts — semantic tokens, not arbitrary hex in components
colors: {
  background: "hsl(var(--background))",
  foreground: "hsl(var(--foreground))",
  muted: "hsl(var(--muted-foreground))",
  accent: "hsl(var(--accent))",
  // profile-safe reading surface
  reading: "hsl(var(--reading-bg))",
}
```

---

## Component Rules

1. **React Aria** for interactive primitives. shadcn/ui where it wraps accessible patterns; don't rebuild buttons/tabs/dialogs from raw `<div onClick>`.
2. Add shadcn via `npx shadcn@latest add` — never manually create in `/components/ui/`.
3. Feature components by domain:
   - `/components/slides/` — viewer, TTS player, sync logic
   - `/components/transcript/` — STT capture, summary display
   - `/components/homework/` — upload, transform display, workspace, Q&A
   - `/components/layout/` — page wrappers, profile switcher for demo
4. **Shared `TtsPlayer`** — one component reused in slide view (3.1) and homework workspace (3.4).
5. **Profile content wrapper** — `<ProfileContent profile="dyslexia">` applies the correct typography/structure classes.
6. Every page uses a layout wrapper from `/components/layout/`.
7. Animations via Framer Motion only, gated by `prefers-reduced-motion`.

---

## View Layouts

### Teacher view
- Slide deck with prev/next
- Current slide index visible
- Optional: mic indicator when STT active
- Dense is fine — this is the control panel

### Student view — blind (`sam`)
```
┌─────────────────────────────┐
│  [Play] [Pause]  Slide 2/4  │  ← controls + status
├─────────────────────────────┤
│  Slide title (h1)           │
│  Slide body                 │
│  [Image description]        │
├─────────────────────────────┤
│  ⚠ not following live       │  ← only when isFollowing=false
│  [Back to live]             │
└─────────────────────────────┘
```

### Student view — deaf (`tom`)
```
┌─────────────────────────────┐
│  Lesson summary             │  ← live_summary, large bullets
│  • Point one                │
│  • Point two                │
├─────────────────────────────┤
│  Live captions (small)      │  ← live_transcript, muted
│  "So today we're going..."  │
└─────────────────────────────┘
```

### Homework workspace
```
┌──────────────────┬──────────┐
│  Transformed     │ Scratch- │
│  homework        │ pad      │
│  (profile styled)│          │
│  [Play TTS]      │          │
├──────────────────┴──────────┤
│  Ask a question…  [Submit]  │  ← grounded Q&A
│  Answer + source tag        │
└─────────────────────────────┘
```

---

## Accessibility Checklist (every PR)

- [ ] All images have `alt` or are marked decorative with `alt=""`
- [ ] Interactive elements are `<button>` or React Aria equivalents — not `<div onClick>`
- [ ] Form inputs have associated `<label>` or `aria-label`
- [ ] Dynamic content (summary, Q&A answer, slide change) uses `aria-live`
- [ ] Focus visible on Tab through entire flow
- [ ] TTS controls work without mouse
- [ ] Color contrast checked on student content views
- [ ] `prefers-reduced-motion` respected

---

## Code Rules

1. TypeScript only. No `any`.
2. Server Components by default. `"use client"` only for interactivity, hooks, browser APIs (STT, TTS, WebSocket).
3. No hardcoded hex outside `tailwind.config.ts`.
4. No inline `style={{}}` except dynamic values (progress width, scroll position).
5. No `console.log` in committed code.
6. Loading + error states for all Gemini calls — announce errors to screen readers.
7. `next/image` for slide images — always with meaningful `alt` or `image_alt` from Gemini.
8. Realistic demo data in `constants.ts` — use Aisha/Tom/Sam with real lesson content (e.g. Newton's Third Law), never "User Name".

---

## Gemini Integration (design-relevant)

| Use | Input | Output design impact |
|---|---|---|
| Live summary | Transcript delta | Bullet list in summary panel |
| Homework transform | Raw text + profile | Profile-styled HTML/markdown render |
| Grounded Q&A | Question + lesson context | Answer + `"Based on: Slide N — title"` tag |
| **Slide image alt-text** | Slide image (multimodal) | Populates `image_alt` → TTS reads it |

**Multimodal alt-text (high priority):** When a slide has an image, call Gemini vision to generate a concise description. This feeds TTS for blind users and is a differentiator — not generic summarization.

Homework transform should use **structured JSON output** where possible:
```ts
// ADHD example schema
{ steps: [{ number: number; text: string; estimated_minutes?: number }] }
```
Render steps as a checklist UI — don't parse free-text at runtime.

---

## Guardrails — Hard Rules

| ❌ NEVER | ✅ INSTEAD |
|---|---|
| `<div onClick>` for buttons | `<button>` or React Aria `Button` |
| Icon-only controls | Icon + visible label or `aria-label` |
| Accent/serif fonts on student reading content | Geist Sans with profile spacing rules |
| Justified text in dyslexia view | Left-aligned, chunked paragraphs |
| Raw STT as the primary deaf view | AI summary large; captions small below |
| TTS reading raw `innerText` dump | Structured order: title → body → image alt |
| Empty alt on slide images | Gemini-generated or hardcoded `image_alt` |
| Color-only status indicators | Label + color |
| Autoplay TTS without user gesture | Play button initiates speech |
| Lorem ipsum or "User Name" | Real lesson content in `constants.ts` |
| Generic "accessibility widget" overlay | Profile-native views built into the app |
| Multi-turn chat for Q&A demo | Single question → single grounded answer |

---

## Hackathon Rules

- **Demo path first:** Aisha homework → Tom captions → Sam TTS → Tom grounded Q&A citing the slide. Rehearse this exact sequence.
- **Backup transcript:** Record one full lesson segment early. If live STT fails on stage, swap to backup — Tom's pillar must not collapse.
- **Desktop-first (1440px)** for the demo, but keyboard nav must work — judges may Tab through.
- **Fake it responsibly:** Hardcode plausible transformed homework and a backup summary if Gemini is slow; never show an empty student view to a judge.
- **Deploy day one.** Demo on Vercel, not localhost.
- **Name views in the UI:** "Aisha's view" / "Tom's view" / "Sam's view" — makes the profile system obvious in the first 60 seconds.

---

## Tailwind Config Reference

```ts
// tailwind.config.ts
fontFamily: {
  sans: ["var(--font-geist-sans)"],
  mono: ["var(--font-geist-mono)"],
  accent: ["var(--font-instrument-serif)", "Georgia", "serif"],
}
```

```tsx
// app/layout.tsx
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
});

// Apply all three variables to <html> or <body> className
// Student content views: use font-sans only
```

---

## Profile CSS Utilities (suggested)

```tsx
// components/homework/ProfileContent.tsx
const profileClasses: Record<Profile, string> = {
  dyslexia: "font-sans text-left leading-relaxed max-w-prose space-y-4 text-base",
  adhd: "font-sans space-y-4",
  blind: "font-sans sr-friendly", // semantic headings inside
  deaf: "font-sans",
  low_vision: "font-sans text-lg leading-relaxed",
};
```

Use these wrappers on rendered homework and lesson content — not on the teacher dashboard.
