"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface ConfusionTrigger {
  reason: "mouse-shake" | "idle" | "wrong-answers" | "flip-flopping";
}

const SHAKE_WINDOW_MS = 700;
const SHAKE_REVERSALS = 5;
const SHAKE_DISTANCE = 300;
const IDLE_MS = 45_000;
const FLIP_WINDOW_MS = 20_000;
const FLIP_COUNT = 4;

/**
 * Watches for signs the student is stuck: frantic mouse shaking, long idles,
 * repeated wrong MCQ answers ("hw:answer" CustomEvent) and rapid card
 * flip-flopping. Fires at most one trigger per cardKey; paused via `enabled`.
 */
export function useConfusionDetector({
  cardKey,
  enabled,
}: {
  cardKey: string;
  enabled: boolean;
}): { trigger: ConfusionTrigger | null; clear: () => void } {
  const [trigger, setTrigger] = useState<ConfusionTrigger | null>(null);

  const enabledRef = useRef(enabled);
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);
  const cardKeyRef = useRef(cardKey);
  const firedRef = useRef<Set<string>>(new Set());
  const pointsRef = useRef<{ x: number; y: number; t: number }[]>([]);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrongCountsRef = useRef<Record<string, number>>({});
  const flipTimesRef = useRef<number[]>([]);

  const fire = useCallback((reason: ConfusionTrigger["reason"]) => {
    const key = cardKeyRef.current;
    if (!enabledRef.current || firedRef.current.has(key)) return;
    firedRef.current.add(key);
    setTrigger({ reason });
  }, []);

  // Idle timer helper (restarted by any activity and on card change).
  const armIdle = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => fire("idle"), IDLE_MS);
  }, [fire]);

  // Card changes: reset per-card signals + track flip-flopping.
  useEffect(() => {
    if (cardKeyRef.current !== cardKey) {
      cardKeyRef.current = cardKey;
      pointsRef.current = [];
      armIdle();
      const now = Date.now();
      flipTimesRef.current = flipTimesRef.current
        .filter((t) => now - t < FLIP_WINDOW_MS)
        .concat(now);
      if (flipTimesRef.current.length >= FLIP_COUNT) {
        flipTimesRef.current = [];
        fire("flip-flopping");
      }
    }
  }, [cardKey, armIdle, fire]);

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      armIdle();
      const now = performance.now();
      const pts = pointsRef.current;
      pts.push({ x: e.clientX, y: e.clientY, t: now });
      while (pts.length && now - pts[0].t > SHAKE_WINDOW_MS) pts.shift();
      if (pts.length < 6) return;
      let reversals = 0;
      let dist = 0;
      let lastDir = 0;
      for (let i = 1; i < pts.length; i++) {
        const dx = pts[i].x - pts[i - 1].x;
        const dy = pts[i].y - pts[i - 1].y;
        dist += Math.hypot(dx, dy);
        if (Math.abs(dx) > 3) {
          const dir = Math.sign(dx);
          if (lastDir !== 0 && dir !== lastDir) reversals++;
          lastDir = dir;
        }
      }
      if (reversals >= SHAKE_REVERSALS && dist > SHAKE_DISTANCE) {
        pointsRef.current = [];
        fire("mouse-shake");
      }
    };
    const onActivity = () => armIdle();
    const onAnswer = (e: Event) => {
      const detail = (e as CustomEvent<{ correct?: boolean }>).detail;
      if (detail?.correct) return;
      const key = cardKeyRef.current;
      const n = (wrongCountsRef.current[key] ?? 0) + 1;
      wrongCountsRef.current[key] = n;
      if (n >= 2) fire("wrong-answers");
    };

    armIdle();
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("keydown", onActivity);
    window.addEventListener("scroll", onActivity, true);
    window.addEventListener("hw:answer", onAnswer);
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("scroll", onActivity, true);
      window.removeEventListener("hw:answer", onAnswer);
    };
  }, [armIdle, fire]);

  const clear = useCallback(() => setTrigger(null), []);

  return { trigger, clear };
}
