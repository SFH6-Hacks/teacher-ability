"use client";

import { useState } from "react";

export default function Scratchpad() {
  const [value, setValue] = useState("");
  return (
    <div className="flex h-full flex-col gap-2">
      <label
        htmlFor="scratchpad"
        className="text-sm font-semibold text-neutral-700"
      >
        Scratchpad
      </label>
      <textarea
        id="scratchpad"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Work things out here — nothing is saved or marked."
        className="min-h-40 flex-1 resize-y rounded-lg border border-neutral-300 bg-white p-4 text-base leading-relaxed text-neutral-900 focus:outline-2 focus:outline-offset-2 focus:outline-blue-600"
      />
    </div>
  );
}
