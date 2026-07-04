# Project: (No title for now just a variable that will be decided on) — Bare-bones MVP

Build a minimal but functional full-stack web app scaffold for a hackathon demo.
Prioritize a working end-to-end skeleton over polish — every piece should run,
even if rough. We will improve each part in parallel after this.

also reference the AGENTS.md file for your context

## Tech stack(Look at this and the DESIGN.md file)
- Next.js (React) + Tailwind CSS
- Node/Express or Next.js API routes for backend logic
- In-memory data store (single server-side object/array — no database setup)
- Gemini API for: transcript summarization, homework transformation, grounded Q&A
- Browser Web Speech API (and eleven labs as a good backup) for TTS (speechSynthesis) and STT (SpeechRecognition)
- Simple WebSocket (Socket.io) OR polling for teacher→student slide sync — pick
  whichever is faster to scaffold

## Data model (implement exactly this shape)

interface Student {
  id: string;          // e.g. "aisha", "tom", "sam"
  name: string;
  profile: "dyslexia" | "adhd" | "blind" | "deaf" | "low_vision";
}

interface Slide {
  index: number;
  content_text: string;
  image_alt?: string;
}

interface Lesson {
  id: string;
  title: string;
  slides: Slide[];
  current_slide_index: number;
  live_transcript: string;
  live_summary: string;
}

interface Homework {
  id: string;
  lesson_id: string;
  raw_content: string;
  student_versions: Record<string, string>;
}

## Features to scaffold (in this priority order — stop and tell me if running low on scope)

1. TEACHER VIEW: a simple page showing a hardcoded lesson's slides (3-4 slides,
   hardcoded text content) with next/prev buttons. Advancing slides updates
   `current_slide_index` on the shared Lesson object.

2. STUDENT VIEW (blind/low-vision demo): a page that reads `current_slide_index`
   from the same Lesson and displays that slide. Include a "Play" button that
   uses speechSynthesis to read `content_text` aloud. Include a boolean
   `isFollowing` — if true, auto-scroll/update to match teacher's slide; if the
   student manually navigates, set isFollowing to false and show a
   "Back to live" button that resets it to true.

3. STUDENT VIEW (deaf/HoH demo): a page with a "Start listening" button that
   uses SpeechRecognition to capture mic input, appending text to
   `live_transcript`. Every ~30 seconds (or on a manual "Summarize" button for
   the demo), send the current transcript to Gemini with the prompt:
   "Summarize this lesson segment into 2-3 short bullet points a student can
   read quickly." Store the result in `live_summary` and display it prominently,
   with the raw transcript shown smaller below it.

4. HOMEWORK UPLOAD (teacher side): a simple form — paste homework text, link it
   to the current lesson_id, select a student from a hardcoded roster of 3.
   On submit, call Gemini once per selected student with a profile-specific
   prompt:
   - dyslexia: "Reformat this text for a dyslexic reader: short paragraphs,
     simple sentence structure, no content changes."
   - adhd: "Break this into a numbered checklist of small, clear sub-steps."
   - blind: "Rewrite this with clean, linear structure with no reliance on
     visual layout, suitable for text-to-speech reading."
   Store each result in `student_versions[student.id]`.

5. STUDENT HOMEWORK WORKSPACE: a page showing the student's transformed
   homework version, a plain <textarea> scratchpad next to it (local state
   only, no save needed), and a "Play" TTS button reusing the same
   speechSynthesis logic from step 2.

6. GROUNDED Q&A: on the homework workspace page, add a text input:
   "Ask a question about this homework." On submit, call Gemini with:
   - The student's question
   - The full raw_content of the homework
   - The linked lesson's live_transcript + live_summary + all slides'
     content_text
   System instruction: "Answer the student's question using ONLY the lesson
   content provided below. If the answer is not covered in this lesson content,
   say so explicitly and do not use outside knowledge to fill the gap. If you
   do answer, briefly mention which part of the lesson it's based on."
   Display the response, plus a small tag showing what it cited if possible.

## Explicit constraints
- No authentication — hardcode 3 students: Aisha (dyslexia), Tom (deaf),
  Sam (blind).
- No database — one shared in-memory object is fine, reset on server restart.
- No PDF parsing — homework input is plain text only.
- No multi-turn chat memory for the Q&A — single question, single answer.
- No autonomous agent behavior — every AI call is one request, one response.
- Keep components simple and readable — this will be split across 3 people
  editing different files immediately after this scaffold is generated.

## Output
Generate the project as a runnable Next.js app with clear file/folder
separation matching the 3 feature areas above (slides+TTS, transcript+summary,
homework+workspace+Q&A) so three people can each own one folder and iterate
independently. Include a README with setup steps and required env vars
(GEMINI_API_KEY).
