import { useTranslation } from "react-i18next";
import { PILL_DOT } from "@/components/ui/Pill";
import type { VerificationOutcome } from "@/constants/reportVerification";
import { REPORT_OUTCOME_TONE } from "@/constants/statusTone";
import { cn } from "@/libs/utils";

const STEPS = ["Submitted", "System check", "Awaiting review", "Result"] as const;

/** 4-bar progress (specs/010 FR-010). Every step carries text, so colour is never the only signal. */
export default function VerificationStepper({
  step,
  outcome,
}: {
  step: 1 | 2 | 3 | 4;
  outcome: VerificationOutcome;
}) {
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
            className="flex min-w-0 flex-col gap-2"
          >
            <span
              aria-hidden
              className={cn(
                "h-1 rounded-full",
                state === "done" && "bg-button-accent",
                state === "current" && PILL_DOT[REPORT_OUTCOME_TONE[outcome]],
                state === "todo" && "bg-border",
              )}
            />
            <span
              className={cn(
                "text-sm leading-tight break-words",
                state === "current" && "font-semibold text-foreground-primary",
                state === "done" && "text-foreground-secondary",
                state === "todo" && "text-foreground-tertiary",
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
