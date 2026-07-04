"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, Square, Loader2 } from "lucide-react";

/**
 * Shared TTS player (DESIGN.md): speaks the given text via Google Cloud TTS.
 * Callers are responsible for assembling text in the mandatory read order
 * (title → body → image alt).
 */
export default function TtsPlayer({ text }: { text: string }) {
  const [state, setState] = useState<"idle" | "loading" | "speaking" | "paused">("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setState("idle");
  }, []);

  // Stop speech when the content this player reads changes or unmounts.
  useEffect(() => stop, [text, stop]);

  const play = async () => {
    if (state === "paused" && audioRef.current) {
      audioRef.current.play();
      setState("speaking");
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    try {
      setState("loading");
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          voiceConfig: { name: "en-US-Journey-F", languageCode: "en-US" },
        }),
      });

      if (!res.ok) throw new Error("TTS failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        setState("idle");
        URL.revokeObjectURL(url);
      };
      
      audio.play();
      setState("speaking");
    } catch (err) {
      console.error(err);
      setState("idle");
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setState("paused");
    }
  };

  const btn =
    "inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-100 focus:outline-2 focus:outline-offset-2 focus:outline-blue-600";

  return (
    <div className="flex items-center gap-2" role="group" aria-label="Read aloud controls">
      {state === "idle" || state === "paused" ? (
        <button type="button" onClick={play} className={btn} aria-label="Read aloud">
          <Play size={16} aria-hidden="true" />
          {state === "paused" ? "Resume" : "Read aloud"}
        </button>
      ) : state === "loading" ? (
        <button type="button" disabled className={btn} aria-label="Loading audio">
          <Loader2 size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
          Loading...
        </button>
      ) : (
        <button type="button" onClick={pause} className={btn} aria-label="Pause reading">
          <Pause size={16} aria-hidden="true" />
          Pause
        </button>
      )}
      {(state === "speaking" || state === "paused") && (
        <button type="button" onClick={stop} className={btn} aria-label="Stop reading">
          <Square size={16} aria-hidden="true" />
          Stop
        </button>
      )}
    </div>
  );
}
