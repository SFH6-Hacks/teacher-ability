# Every Mind — Hackathon Spec v2

**One-liner:** A teacher runs one lesson. The app renders it live, differently, per student — and everything captured during that lesson (slides + transcript) becomes the grounding context for homework help afterwards. One profile, one context, from lesson to homework.

**Core differentiator:** Not content generation (Diffit/MagicSchool do that). The moat is **persistent per-student profile + persistent lesson context**, carried from live class into homework.

---

## 1. Locked feature set

| # | Feature | Who it's for | Status |
|---|---------|-------------|--------|
| 1 | TTS reads slide content aloud, synced auto-scroll (breakable) | Blind / low-vision | Build |
| 2 | Live transcript of teacher speech + AI running summary | Deaf / HoH / anyone | Build — **also feeds #5** |
| 3 | Homework upload → per-student transformed version | Dyslexia / ADHD / blind | Build |
| 4 | In-app workspace to do the homework (content view + scratchpad + TTS) | All homework users | Build |
| 5 | **Grounded homework Q&A** — ask a question, answered only from this lesson's slides+transcript | All homework users | Build — **this is your best Gemini story** |

No open-ended agent. No autonomous multi-step tool use. #5 is a single, tightly-scoped, grounded API call — not "Clicky." Say "grounded Q&A assistant" in the pitch, never "agent."

---

## 2. Data model

```
Student {
  id, name
  profile: enum[dyslexia, adhd, blind, deaf, low_vision]
}

Lesson {
  id
  slides: [{ index, content_text, image_alt? }]
  live_transcript: string          // append-only during class
  live_summary: string             // regenerated periodically from transcript
  current_slide_index: int         // broadcast to students
}

Homework {
  id
  lesson_id: -> Lesson             // links homework to the lesson that grounds it
  raw_content: text/pdf
  student_versions: { student_id -> transformed_content }
}
```

The `lesson_id` link on `Homework` is the whole point — it's what lets #5 pull the right context.

---

## 3. Feature specs

### 3.1 Slide TTS + synced scroll (blind/low-vision)
- Teacher's slide view broadcasts `current_slide_index` (WebSocket, polling fallback).
- Student: `isFollowing = true` by default, auto-scrolls to match; manual scroll sets `isFollowing = false` + shows "Back to live" button.
- TTS via ElevenLabs Flash + `speechSynthesis` fallback (reuse from Anki project). Read structured order: title → body → image alt-text, not raw innerText dump.

### 3.2 Live transcript + AI summary (deaf/HoH)
- Browser `SpeechRecognition` for live STT on teacher mic → append to `live_transcript`.
- Every ~30-60s, send the new delta to Gemini: "Summarize this segment into 2-3 bullet points a student can read." Append to `live_summary`.
- Student view: small raw captions + larger running summary as primary focus.
- **Risk:** raw STT is noisy live — lean on the AI summary, not raw captions, for the visible primary text. Have a pre-recorded backup transcript ready in case live mic fails on stage.
- **Critical dependency:** `live_transcript` is the context source for feature #5 — this must be captured and stored even if it's never shown perfectly on-screen.

### 3.3 Homework transform
- Teacher uploads/pastes homework, linked to a `lesson_id`.
- Select student(s) from roster → Gemini transforms per profile:
  - Dyslexia: reformat only (chunked, left-aligned, sans-serif, 1.5 spacing) — no content change.
  - ADHD: break into numbered checklist of smaller sub-steps.
  - Blind: clean semantic structure, feeds into TTS from 3.1.
- Output: one homework, tabbed per student, labeled by name.

### 3.4 In-app homework workspace
- Split view: transformed content + `<textarea>` scratchpad (local state, no backend needed).
- TTS play button reuses 3.1's component.
- No submission/grading — out of scope.

### 3.5 Grounded homework Q&A (replaces the cut tutor)
This is the feature to build carefully — it's your best Usefulness, Creativity, and Gemini-API story combined.

**Flow:**
1. Student is in the workspace (3.4), looking at a specific homework question.
2. Student types a question ("I don't get part b").
3. App constructs a Gemini prompt with:
   - The student's question
   - The specific homework question/section they're stuck on
   - The linked lesson's `live_transcript` + `live_summary` + relevant `slides[].content_text`
4. **System prompt constraint (critical):** *"Answer using ONLY the lesson content provided below. If the answer isn't covered in this lesson, say so explicitly — do not use outside knowledge to fill gaps. When you do answer, mention which part of the lesson it's based on."*
5. Response is displayed with a small tag like "Based on: Slide 4 — Newton's Third Law" if traceable, or "Not covered in this lesson" if not.

**Why this is bounded, not an agent:** one request, one response, no tool calls, no autonomy, no memory across turns needed for the demo. Do not build multi-turn chat unless #1–4 are fully done with time to spare.

**Gemini API story for judges:** this is retrieval-grounded generation — the model is explicitly constrained to a context window built from *your own captured lesson data*, with a refusal behavior when the context doesn't cover the question, and traceable attribution back to the source slide. That's the line to say out loud in presentation.

---

## 4. Tech stack
- Frontend: Next.js/React, Tailwind, React Aria (accessible primitives — free WCAG points).
- TTS: ElevenLabs Flash + `speechSynthesis` fallback.
- STT: browser `SpeechRecognition`.
- AI: Gemini API — summarization (3.2), transformation (3.3), grounded Q&A (3.5).
- Sync: WebSocket (Socket.io) or polling fallback.
- No auth — hardcode 3-4 student profiles for the demo.

---

## 5. Build order (team split)
1. **Person A:** Slide view + TTS + synced scroll (3.1). Self-contained.
2. **Person B:** Live STT + Gemini summary pipeline (3.2). Self-contained, but **flag to the team the moment `live_transcript` is capturable in a usable format** — Person D needs it.
3. **Person C:** Homework upload + Gemini transform prompts + per-student render (3.3). Needs roster data model (30 min setup with Person D).
4. **Person D:** Roster data model + workspace UI (3.4) + grounded Q&A (3.5) once B's transcript is available + demo polish/glue.

Build priority if time runs short: **3.1 and 3.3 first** (most reliable, visually clear) → **3.5 next** (your differentiator, but needs 3.2's data) → **3.2's live polish last** (the summary pipeline can be rough as long as transcript capture works well enough to feed 3.5).

---

## 6. Explicitly out of scope
- Open-ended/autonomous agent, multi-turn tutoring chat, tool use
- Assignment distribution, submission, grading, due dates
- Math grid / dyscalculia tools
- Visual countdown timer, standalone task-breakdown module
- Real auth/accounts

---

## 7. Demo script
1. Open on the Paul Stone quote (paperwork burden) — 15 seconds, sets stakes.
2. Teacher's slide deck live → switch to "Aisha's view" (blind) → TTS reads slide, scroll synced, break sync manually.
3. Switch to "Tom's view" (deaf) → live captions + AI summary updating as you talk.
4. Cut to homework: upload one worksheet → show it rendered differently for Aisha and Tom by name.
5. **New closing beat:** in Tom's homework workspace, type a question about the worksheet → show the grounded answer appear, citing the exact slide from the lesson you just demoed. Say explicitly: "That answer only exists because it's grounded in the lesson we just watched — not the model guessing."
6. Close on: "One profile, one lesson context, follows the student through class and homework — not a generator, a system."
