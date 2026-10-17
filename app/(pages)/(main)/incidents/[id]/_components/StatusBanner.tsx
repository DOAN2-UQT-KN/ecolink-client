import type { IconType } from "react-icons";
import { TbCircleCheck, TbCircleX, TbClock, TbLoader } from "react-icons/tb";
import { PILL_TONE } from "@/components/ui/Pill";
import type { VerificationOutcome } from "@/constants/reportVerification";
import { REPORT_OUTCOME_TONE } from "@/constants/statusTone";
import { cn } from "@/libs/utils";

const ICON: Record<VerificationOutcome, IconType> = {
  checking: TbLoader,
  review: TbClock,
  accepted: TbCircleCheck,
  rejected: TbCircleX,
};

/** Where the report stands, in one coloured block (specs/010 FR-009). */
export default function StatusBanner({
  outcome,
  title,
  message,
}: {
  outcome: VerificationOutcome;
  title: string;
  message: string;
}) {
  const Icon = ICON[outcome];
  return (
    <div role="status" className={cn("flex gap-3 rounded-[10px] border p-4", PILL_TONE[REPORT_OUTCOME_TONE[outcome]].light)}>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/70">
        <Icon aria-hidden className={cn("size-5", outcome === "checking" && "animate-spin")} />
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <h2 id="verification-title" className="font-display-4 font-semibold">
          {title}
        </h2>
        <p className="text-sm">{message}</p>
      </div>
    </div>
  );
}
