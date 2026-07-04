export default function ProgressBar({
  current,
  total,
}: {
  current: number; // 1-based card number
  total: number;
}) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="w-full">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="font-mono text-sm text-neutral-600">
          Card {current} of {total}
        </span>
        <span className="font-mono text-sm text-neutral-600">{pct}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`Progress: card ${current} of ${total}`}
        className="h-2 w-full rounded-full bg-neutral-200"
      >
        <div
          className="h-2 rounded-full bg-blue-600 transition-[width] duration-150 motion-reduce:transition-none"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
