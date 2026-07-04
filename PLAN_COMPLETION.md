Done ✅ (the app is built and working)

- Foundation — lib/types.ts, lib/demo-data.ts (roster of 4: Aisha/dyslexia, Leo/ADHD, Sam/blind, Tom/deaf + Newton's Third Law lesson, demo worksheet, backup transcript, full fallback decks per profile), lib/store.ts (in-memory), lib/gemini.ts (gemini-2.5-flash, structured JSON, timeout → fallback).
- Student experience — /hw/[studentId]: Seneca-style one-cart-answer/steps cards), progress bar, ?card=N refresh-safeposition, scratchpad, TTS player, profile-styled typography, celebration screen.
- Cursor companion (flagship) — orb trails the cursor (framer-motion spring, docks under reduced-motion), "I'm stuck" / / key / voice input → Gemini returns a multi-step walkthrough that flies the orb to tagged elements and draws circles/underlines/arrows on the page via SVG overlay. Anti-cheat system prompt, 3-helps-per-card cap, client fallback steps if Gemini is down.
- Teacher dashboard — /teacher: fake upload dropzones (map t tab with live speech-to-text + Gemini recap bullets +backup-transcript button, roster grid with per-student "Generate homework" → link + copy.
- APIs — /api/generate, /api/assist, /api/summarize, all Gem
- Extras — landing page, light /lesson/[studentId] per-profile viewer, .env.local stub.
- Verified — npm run build ✅, npm run lint ✅ (fixed 5 erroall pages 200, unknown student 404, all three APIs returncorrect fallbacks with no key.
                                                                                                                                                    Left to do

1. Browser-level check of the client side — I was mid-way installing the chrome-devtools CLI to confirm the student page has no client-side console errors and eyeball the companion (curl can't see client crasterrupted.
2. Your Gemini key — put it in platform/.env.local (GEMINI_API_KEY=...); without it everything runs on the prepared fallback content.
3. Real-browser demo pass — mic recording, TTS, orb drawing are things only a human run-through confirms.
4. Optional polish from the plan's phase 6 (keyboard-only pa deploy.

Dev server is still running at http://localhost:3177 if you