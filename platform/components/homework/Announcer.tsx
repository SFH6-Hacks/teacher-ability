"use client";

import { useEffect, useState } from "react";

const EVENT = "announcer:say";

/** Fire a message at the screen-reader live region (blind profile). */
export function announce(text: string) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { text } }));
}

/**
 * Visually-hidden assertive live region. Mount once per page; call
 * `announce("...")` from anywhere to have screen readers speak it.
 */
export default function Announcer() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    const onSay = (e: Event) => {
      const text = (e as CustomEvent<{ text: string }>).detail?.text ?? "";
      // Clear first so repeating the same text is re-announced.
      setMessage("");
      requestAnimationFrame(() => setMessage(text));
    };
    window.addEventListener(EVENT, onSay);
    return () => window.removeEventListener(EVENT, onSay);
  }, []);

  return (
    <div aria-live="assertive" aria-atomic="true" role="status" className="sr-only">
      {message}
    </div>
  );
}
