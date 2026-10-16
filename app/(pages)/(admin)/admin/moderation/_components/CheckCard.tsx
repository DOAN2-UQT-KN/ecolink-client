import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { CheckName, ICheckResult } from "@/apis/incident/models/verification";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { Pill } from "@/components/ui/Pill";
import { Progress } from "@/components/ui/progress";
import { CHECK_NAMES, isAdminOnlyReason, reasonCopy } from "@/constants/reportVerification";
import { CHECK_STATUS_LABEL, CHECK_STATUS_TONE } from "@/constants/statusTone";
import { cn } from "@/libs/utils";

/** One check of the admin view: score or status label (never 0 for a check that did not run), signals, reasons. */
export function CheckCard({
  name,
  check,
  isDark,
  children,
}: {
  name: CheckName;
  check?: ICheckResult;
  isDark: boolean;
  children?: ReactNode;
}) {
  const { t } = useTranslation();
  const meta = CHECK_NAMES.find((c) => c.value === name);
  const muted = isDark ? "text-zinc-400" : "text-muted-foreground";

  return (
    <section
      className={cn(
        "flex flex-col gap-3 rounded-[10px] border p-4",
        isDark ? "border-zinc-700 bg-zinc-800" : "border-border bg-card",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className={cn("flex items-center gap-2 font-display-3 font-semibold", isDark ? "text-zinc-100" : "text-foreground")}>
          {t(meta?.label ?? name)}
          <InfoTooltip content={t("Weight {{weight}} in the total score", { weight: meta?.weight ?? 0 })} />
        </h3>
        {!check ? (
          <Pill isDark={isDark}>{t("Not run")}</Pill>
        ) : check.status === "COMPLETED" && check.risk != null ? (
          <span className="font-mono text-sm">{check.risk.toFixed(2)}</span>
        ) : (
          <Pill tone={CHECK_STATUS_TONE[check.status]} isDark={isDark}>
            {t(CHECK_STATUS_LABEL[check.status])}
          </Pill>
        )}
      </div>

      {check?.status === "COMPLETED" && check.risk != null && (
        <Progress value={Math.round(check.risk * 100)} aria-label={t("Risk score")} />
      )}
      {check?.error && <p className="text-xs text-red-500">{check.error}</p>}

      {!!check?.signals.length && (
        <p className={cn("text-xs", muted)}>
          {check.signals
            .map((s) =>
              `${s.name}: ${s.status === "COMPLETED" ? (s.raw ?? s.risk?.toFixed(2) ?? "—") : t(CHECK_STATUS_LABEL[s.status])}`,
            )
            .join(", ")}
        </p>
      )}

      {!!check?.reasons.length && (
        <ul className="flex flex-col gap-1">
          {check.reasons.map((code) => (
            <li key={code} className="flex flex-wrap items-center gap-2 text-sm">
              <span>{t(reasonCopy(code).title)}</span>
              {isAdminOnlyReason(code) && (
                <Pill isDark={isDark}>{t("Admin only")}</Pill>
              )}
              <span className={cn("text-xs", muted)}>{code}</span>
            </li>
          ))}
        </ul>
      )}

      {children}
    </section>
  );
}
