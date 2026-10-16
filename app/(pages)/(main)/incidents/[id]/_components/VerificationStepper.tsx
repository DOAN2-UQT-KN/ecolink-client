import { useTranslation } from "react-i18next";
import { cn } from "@/libs/utils";

const STEPS = ["Submitted", "System check", "Awaiting review", "Result"] as const;

/** 4-step progress (specs/007 FR-009). Every step carries text, so colour is never the only signal. */
export default function VerificationStepper({ step }: { step: 1 | 2 | 3 | 4 }) {
  const { t } = useTranslation();

  return (
    <ol className="grid grid-cols-4 gap-2" aria-label={t("Verification progress")}>
      {STEPS.map((label, index) => {
        const n = index + 1;
        const state = n < step ? "done" : n === step ? "current" : "todo";
        return (
          <li
            key={label}
            aria-current={state === "current" ? "step" : undefined}
            className="flex min-w-0 flex-col items-center gap-1 text-center"
          >
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-full border text-xs font-semibold",
                state === "current" && "border-button-accent bg-button-accent text-white",
                state === "done" && "border-button-accent text-button-accent",
                state === "todo" && "border-border text-foreground-tertiary",
              )}
            >
              {n}
            </span>
            <span
              className={cn(
                "text-xs leading-tight break-words",
                state === "todo" ? "text-foreground-tertiary" : "text-button-accent font-medium",
              )}
            >
              {t(label)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
