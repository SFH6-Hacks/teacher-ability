"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function GlobalShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Must hold Ctrl + Shift
      if (!e.ctrlKey || !e.shiftKey) return;

      // Ignore if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      switch (e.key) {
        case "1":
        case "!": // e.key can be '!' when Shift + 1 is pressed on some keyboards
          e.preventDefault();
          router.push("/lesson/aisha");
          break;
        case "2":
        case "@":
          e.preventDefault();
          router.push("/lesson/leo");
          break;
        case "3":
        case "#":
          e.preventDefault();
          router.push("/lesson/sam");
          break;
        case "4":
        case "$":
          e.preventDefault();
          router.push("/lesson/tom");
          break;
        case "5":
        case "%":
        case "t":
        case "T":
          e.preventDefault();
          router.push("/teacher");
          break;
        case "0":
        case ")":
        case "h":
        case "H":
          e.preventDefault();
          router.push("/");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return null;
}
