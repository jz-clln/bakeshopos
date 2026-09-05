// File: app/src/components/auth/ProgressBar.tsx

interface ProgressBarProps {
  currentStep: number; // 1-indexed
  totalSteps: number;
}

export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const percent = (currentStep / totalSteps) * 100;

  return (
    <div>
      <p className="text-xs font-medium text-olive mb-2">
        Step {currentStep} of {totalSteps}
      </p>
      <div
        className="w-full h-2 rounded-full bg-platinum overflow-hidden"
        role="progressbar"
        aria-valuenow={currentStep}
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-label={`Step ${currentStep} of ${totalSteps}`}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent-dark to-accent transition-[width] duration-500 ease-out motion-reduce:transition-none"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}