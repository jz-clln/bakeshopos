// File: app/src/components/settings/UsageMeter.tsx
//
// Purpose-built for a continuous percentage-toward-a-limit display —
// distinct from components/auth/ProgressBar.tsx, which is a discrete
// step-tracker (Step 2 of 4) with different ARIA semantics. Forcing
// a token percentage into that component's "step" model would be
// inaccurate for anyone using a screen reader.

interface UsageMeterProps {
  label: string;
  used: number;
  limit: number;
}

export function UsageMeter({ label, used, limit }: UsageMeterProps) {
  const percent = Math.min(100, (used / limit) * 100);
  const isNearLimit = percent >= 80 && percent < 100;
  const isAtLimit = percent >= 100;

  const barColor = isAtLimit
    ? 'bg-red-500'
    : isNearLimit
    ? 'bg-amber-500'
    : 'bg-gradient-to-r from-accent-dark to-accent';

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <p className="text-[13px] font-medium text-accent-dark">{label}</p>
        <p className="text-[12px] text-olive tabular-nums">
          {used.toLocaleString()} / {limit.toLocaleString()} tokens
        </p>
      </div>
      <div
        className="w-full h-2 rounded-full bg-platinum overflow-hidden"
        role="progressbar"
        aria-valuenow={Math.round(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${used.toLocaleString()} of ${limit.toLocaleString()} tokens used`}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {isAtLimit && (
        <p className="text-[12px] text-red-600 mt-1.5">
          Monthly limit reached — your AI assistant will pause replying until next month, or you can take over conversations manually.
        </p>
      )}
    </div>
  );
}