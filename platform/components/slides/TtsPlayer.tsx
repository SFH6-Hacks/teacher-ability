"use client";

import { useCallback, useEffect, useState } from "react";
import { Pause, Play, Square } from "lucide-react";

/**
 * Shared TTS player (DESIGN.md): speaks the given text via speechSynthesis.
 * Callers are responsible for assembling text in the mandatory read order
 * (title → body → image alt).
 */
export default function TtsPlayer({ text }: { text: string }) {
  const [state, setState] = useState<"idle" | "speaking" | "paused">("idle");

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setState("idle");
  }, []);

  // Stop speech when the content this player reads changes or unmounts.
  useEffect(() => stop, [text, stop]);

  const play = () => {
    if (state === "paused") {
      window.speechSynthesis.resume();
      setState("speaking");
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95;
    u.onend = () => setState("idle");
    window.speechSynthesis.speak(u);
    setState("speaking");
  };

  const pause = () => {
    window.speechSynthesis.pause();
    setState("paused");
  };

  const btn =
    "inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-100 focus:outline-2 focus:outline-offset-2 focus:outline-blue-600";

  return (
    <div className="flex items-center gap-2" role="group" aria-label="Read aloud controls">
      {state !== "speaking" ? (
        <button type="button" onClick={play} className={btn} aria-label="Read aloud">
          <Play size={16} aria-hidden="true" />
          {state === "paused" ? "Resume" : "Read aloud"}
        </button>
      ) : (
        <button type="button" onClick={pause} className={btn} aria-label="Pause reading">
          <Pause size={16} aria-hidden="true" />
          Pause
        </button>
      )}
      {state !== "idle" && (
        <button type="button" onClick={stop} className={btn} aria-label="Stop reading">
          <Square size={16} aria-hidden="true" />
          Stop
        </button>
      )}
    </div>
  );
}
