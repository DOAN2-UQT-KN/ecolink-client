import { useState } from "react";
import { useTranslation } from "react-i18next";
import { TbChevronDown } from "react-icons/tb";
import { useGetReportVerifications } from "@/apis/incident/getReportVerifications";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Pill } from "@/components/ui/Pill";
import { Skeleton } from "@/components/ui/skeleton";
import { RISK_FLAG_TONE } from "@/constants/statusTone";
import { formattedDate } from "@/utils/formattedDate";
import { cn } from "@/libs/utils";

/** Every verification attempt of a report, newest first; fetched only when opened. */
export function VerificationHistory({ reportId, isDark }: { reportId: string; isDark: boolean }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useGetReportVerifications(reportId, { enabled: open });
  const attempts = data?.data?.verifications ?? [];

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className={cn("rounded-[10px] border p-5", isDark ? "border-zinc-700 bg-zinc-900" : "border-border bg-card")}
    >
      <h3 className={cn("font-display-3 font-semibold", isDark ? "text-zinc-100" : "text-foreground")}>
        <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 text-left">
          {t("Verification history")}
          <TbChevronDown className={cn("size-5 transition-transform", open && "rotate-180")} aria-hidden />
        </CollapsibleTrigger>
      </h3>
      <CollapsibleContent className="pt-3">
        {isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : attempts.length === 0 ? (
          <p className={cn("text-sm", isDark ? "text-zinc-400" : "text-muted-foreground")}>{t("No attempts yet")}</p>
        ) : (
          <ol className="flex flex-col gap-2">
            {attempts.map((a) => (
              <li key={a.verification_id} className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium">{t("Attempt {{n}}", { n: a.attempt })}</span>
                <span className={cn(isDark ? "text-zinc-400" : "text-muted-foreground")}>
                  {formattedDate(a.started_at ?? undefined, true)}
                </span>
                {a.flag ? (
                  <Pill tone={RISK_FLAG_TONE[a.flag]} isDark={isDark}>{a.flag}</Pill>
                ) : (
                  <Pill isDark={isDark}>{a.status}</Pill>
                )}
                {a.risk_score != null && <span className="font-mono">{a.risk_score.toFixed(2)}</span>}
              </li>
            ))}
          </ol>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
