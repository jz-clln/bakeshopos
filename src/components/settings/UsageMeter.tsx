// File: app/src/components/settings/UsageMeter.tsx

interface UsageMeterProps {
  label: string;
  used: number;
  limit: number;
}

export function UsageMeter({ label, used, limit }: UsageMeterProps) {
  const safeLimit = Math.max(limit, 1);
  const percent = Math.min(100, (used / safeLimit) * 100);

  const isNearLimit = percent >= 80 && percent < 100;
  const isAtLimit = percent >= 100;

  const remaining = Math.max(limit - used, 0);

  const statusLabel = isAtLimit
    ? 'Limit reached'
    : isNearLimit
      ? 'Almost full'
      : 'Healthy';

  const statusClasses = isAtLimit
    ? 'bg-red-50 text-red-600 border-red-100'
    : isNearLimit
      ? 'bg-amber-50 text-amber-700 border-amber-100'
      : 'bg-[#F4ECE0] text-[#2A2320] border-[#2A2320]/[0.05]';

  const barClasses = isAtLimit
    ? 'bg-red-500'
    : isNearLimit
      ? 'bg-amber-500'
      : 'bg-[#2A2320]';

  return (
    <div
      className="
        rounded-[18px]
        border border-black/[0.04]
        bg-[#FAF8F5]
        px-4 py-4
      "
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <p className="text-[12px] font-medium text-olive mb-1">
            {label}
          </p>

          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-[24px] font-semibold tracking-[-0.02em] text-accent-dark tabular-nums">
              {used.toLocaleString()}
            </span>

            <span className="text-[12px] text-olive">
              of {limit.toLocaleString()} tokens
            </span>
          </div>
        </div>

        <span
          className={`
            shrink-0
            rounded-full
            border
            px-2.5 py-1
            text-[10px]
            font-semibold
            uppercase
            tracking-[0.08em]
            ${statusClasses}
          `}
        >
          {statusLabel}
        </span>
      </div>

      {/* Progress track */}
      <div
        className="
          relative
          w-full
          h-2.5
          rounded-full
          bg-black/[0.06]
          overflow-hidden
        "
        role="progressbar"
        aria-valuenow={Math.round(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${used.toLocaleString()} of ${limit.toLocaleString()} tokens used`}
      >
        <div
          className={`
            h-full
            rounded-full
            transition-[width]
            duration-500
            ease-out
            motion-reduce:transition-none
            ${barClasses}
          `}
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Footer metadata */}
      <div className="flex items-center justify-between mt-2.5 gap-3">
        <p className="text-[11px] text-olive/70 tabular-nums">
          {Math.round(percent)}% used
        </p>

        {!isAtLimit && (
          <p className="text-[11px] text-olive/70 tabular-nums text-right">
            {remaining.toLocaleString()} remaining
          </p>
        )}
      </div>

      {/* Warning states */}
      {isNearLimit && !isAtLimit && (
        <div
          className="
            mt-4
            rounded-[12px]
            border border-amber-100
            bg-amber-50
            px-3.5 py-3
          "
        >
          <p className="text-[12px] leading-relaxed text-amber-800">
            You're getting close to your monthly AI usage limit.
          </p>
        </div>
      )}

      {isAtLimit && (
        <div
          className="
            mt-4
            rounded-[12px]
            border border-red-100
            bg-red-50
            px-3.5 py-3
          "
        >
          <p className="text-[12px] font-medium text-red-700 mb-0.5">
            Monthly limit reached
          </p>

          <p className="text-[12px] leading-relaxed text-red-600">
            Your AI assistant will pause replying until next month.
            You can still take over conversations manually.
          </p>
        </div>
      )}
    </div>
  );
}