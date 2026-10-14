export interface Step {
  id: string;
  label: string;
}

export interface StepIndicatorProps {
  steps: Step[];
  currentStepId: string;
}

/**
 * Accessible step progress. Always shows "Step X of Y: label" as text.
 * The orbit styling is decorative; the progress meaning is in the DOM.
 */
export function StepIndicator({ steps, currentStepId }: StepIndicatorProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStepId);
  const total = steps.length;

  return (
    <nav aria-label="Enrollment steps">
      <ol className="flex items-center gap-2">
        {steps.map((step, index) => {
          const status =
            index < currentIndex
              ? "completed"
              : index === currentIndex
                ? "current"
                : "upcoming";
          const statusLabel =
            status === "completed"
              ? "completed"
              : status === "current"
                ? `Step ${index + 1} of ${total}: ${step.label}`
                : "upcoming";

          return (
            <li key={step.id} className="flex items-center gap-2">
              <span
                className={`inline-flex items-center justify-center rounded-full w-7 h-7 text-xs font-semibold border ${
                  status === "current"
                    ? "border-blue-600 text-blue-700 bg-blue-50"
                    : status === "completed"
                      ? "border-green-600 text-green-700 bg-green-50"
                      : "border-gray-300 text-gray-500 bg-white"
                }`}
                aria-current={status === "current" ? "step" : undefined}
                aria-label={statusLabel}
              >
                {status === "completed" ? "✓" : index + 1}
              </span>
              <span className="text-sm text-gray-700">{step.label}</span>
              {index < total - 1 && (
                <span className="text-gray-300" aria-hidden="true">
                  →
                </span>
              )}
            </li>
          );
        })}
      </ol>
      <p className="sr-only" aria-live="polite">
        Step {currentIndex + 1} of {total}: {steps[currentIndex]?.label}
      </p>
    </nav>
  );
}
