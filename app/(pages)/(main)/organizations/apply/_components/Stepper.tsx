import { memo } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/libs/utils";
import { APPLICATION_STEPS } from "../_context/ApplicationContext";
import { useApplication } from "../_hooks/useApplication";

const STEP_LABELS: Record<(typeof APPLICATION_STEPS)[number], string> = {
  email: "Verify email",
  profile: "Organization profile",
  contact: "Contact",
  owners: "Owners",
  documents: "Legal documents",
  review: "Review & submit",
};

export const Stepper = memo(function Stepper() {
  const { t } = useTranslation();
  const { stepIndex, steps } = useApplication();

  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-3">
      {steps.map((step, index) => {
        const isDone = index < stepIndex;
        const isCurrent = index === stepIndex;

        return (
          <li key={step} className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
                isDone && "border-transparent bg-button-accent text-white",
                isCurrent &&
                  "border-button-accent text-button-accent bg-button-accent/10",
                !isDone &&
                  !isCurrent &&
                  "border-[rgba(136,122,71,0.4)] text-foreground-tertiary",
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
              )}
            >
              {t(STEP_LABELS[step])}
            </span>
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
