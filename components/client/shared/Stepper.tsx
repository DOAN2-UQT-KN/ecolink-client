import { memo } from "react";
import { cn } from "@/libs/utils";

export interface StepperStep {
  id: string;
  /** Already translated. */
  label: string;
}

/**
 * Numbered wizard steps: done, current, upcoming and (optionally) error. A step becomes a
 * button when `onStepClick` is given and `isClickable(index)` allows it.
 */
export const Stepper = memo(function Stepper({
  steps,
  currentIndex,
  onStepClick,
  isClickable,
  errorIds,
}: {
  steps: StepperStep[];
  currentIndex: number;
  onStepClick?: (index: number) => void;
  isClickable?: (index: number) => boolean;
  errorIds?: Set<string>;
}) {
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-3">
      {steps.map((step, index) => {
        const isDone = index < currentIndex;
        const isCurrent = index === currentIndex;
        const hasError = errorIds?.has(step.id) ?? false;
        const clickable = Boolean(onStepClick) && !isCurrent && (isClickable?.(index) ?? true);

        const content = (
          <>
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
                isDone && "border-transparent bg-button-accent text-white",
                isCurrent &&
                  "border-button-accent text-button-accent bg-button-accent/10",
                !isDone &&
                  !isCurrent &&
                  "border-[rgba(136,122,71,0.4)] text-foreground-tertiary",
                hasError && "border-destructive bg-destructive/10 text-destructive",
              )}
            >
              {index + 1}
            </span>
            <span
              className={cn(
                "text-sm",
                isCurrent
                  ? "font-semibold text-button-accent"
                  : "text-foreground-tertiary",
                hasError && "text-destructive",
              )}
            >
              {step.label}
            </span>
          </>
        );

        return (
          <li
            key={step.id}
            className="flex items-center gap-2"
            aria-current={isCurrent ? "step" : undefined}
          >
            {clickable ? (
              <button
                type="button"
                className="flex items-center gap-2 rounded-md hover:opacity-80"
                onClick={() => onStepClick?.(index)}
              >
                {content}
              </button>
            ) : (
              content
            )}
            {index < steps.length - 1 && (
              <span
                aria-hidden
                className="mx-1 hidden h-px w-8 bg-[rgba(136,122,71,0.4)] sm:block"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
});

export default Stepper;
