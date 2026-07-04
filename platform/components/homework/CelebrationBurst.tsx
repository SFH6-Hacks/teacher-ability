"use client";

import { useMemo } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";

const COLORS = ["#F59E0B", "#EF4444", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899"];

/**
 * Hand-rolled confetti: ~20 particles bursting from the viewport centre.
 * Re-fires whenever the `fire` counter increments. Respects reduced motion.
 */
export default function CelebrationBurst({ fire }: { fire: number }) {
  const reduced = useReducedMotion();

  const particles = useMemo(() => {
    if (fire === 0) return [];
    return Array.from({ length: 20 }, (_, i) => {
      const angle = (i / 20) * Math.PI * 2 + Math.random() * 0.5;
      const dist = 110 + Math.random() * 150;
      return {
        id: `${fire}-${i}`,
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist - 40,
        rotate: Math.random() * 540 - 270,
        color: COLORS[i % COLORS.length],
        size: 8 + Math.random() * 8,
        round: Math.random() > 0.5,
        delay: Math.random() * 0.08,
      };
    });
  }, [fire]);

  if (reduced || fire === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
    >
      <AnimatePresence>
        {particles.map((p) => (
          <motion.span
            key={p.id}
            initial={{ x: 0, y: 0, scale: 0, rotate: 0, opacity: 1 }}
            animate={{
              x: p.x,
              y: p.y,
              scale: [0, 1.2, 1],
              rotate: p.rotate,
              opacity: [1, 1, 0],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, delay: p.delay, ease: "easeOut" }}
            className="absolute"
            style={{
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              borderRadius: p.round ? "9999px" : "2px",
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
