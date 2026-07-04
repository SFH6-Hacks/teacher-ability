import { Check } from "lucide-react";

/**
 * Progress indicator. Default: slim bar. `variant="chunky"` (ADHD): big
 * per-card checkmark pips — progress you can feel.
 * `dark` adapts colors for the blind profile's high-contrast theme.
 */
export default function ProgressBar({
  current,
  total,
  variant = "slim",
  dark = false,
}: {
  current: number; // 1-based card number
  total: number;
  variant?: "slim" | "chunky";
  dark?: boolean;
}) {
  const pct = Math.round((current / total) * 100);

  if (variant === "chunky") {
    return (
      <div className="w-full">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-base font-bold text-neutral-800">
            Card {current} of {total}
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={1}
          aria-valuemax={total}
          aria-label={`Progress: card ${current} of ${total}`}
          className="flex items-center gap-1.5"
        >
          {Array.from({ length: total }, (_, i) => {
            const done = i + 1 < current;
            const active = i + 1 === current;
            return (
              <span
                key={i}
                aria-hidden="true"
                className={`flex h-4 flex-1 items-center justify-center rounded-full transition-colors motion-reduce:transition-none ${
                  done
                    ? "bg-green-600"
                    : active
                      ? "bg-amber-500 ring-2 ring-amber-300 ring-offset-1"
                      : "bg-neutral-300"
                }`}
              >
                {done && <Check size={11} className="text-white" strokeWidth={4} />}
              </span>
            );
          })}
        </div>
      </div>
    );
  }

  const muted = dark ? "text-neutral-400" : "text-neutral-600";
  return (
    <div className="w-full">
      <div className="mb-2 flex items-baseline justify-between">
        <span className={`font-mono text-sm ${muted}`}>
          Card {current} of {total}
        </span>
        <span className={`font-mono text-sm ${muted}`}>{pct}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`Progress: card ${current} of ${total}`}
        className={`h-2 w-full rounded-full ${dark ? "bg-neutral-800" : "bg-neutral-200"}`}
      >
        <div
          className={`h-2 rounded-full transition-[width] duration-150 motion-reduce:transition-none ${dark ? "bg-violet-400" : "bg-blue-600"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
