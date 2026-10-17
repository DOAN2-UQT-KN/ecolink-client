import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { IconType } from "react-icons";
import { TbCopy, TbMapPin, TbPhoto } from "react-icons/tb";
import type { CheckName, ICheckResult } from "@/apis/incident/models/verification";
import { Pill, PILL_TONE } from "@/components/ui/Pill";
import { CHECK_NAMES, isAdminOnlyReason, reasonCopy } from "@/constants/reportVerification";
import { CHECK_STATUS_LABEL, CHECK_STATUS_TONE, signalTone } from "@/constants/statusTone";
import { cn } from "@/libs/utils";

const CHECK_ICON: Record<CheckName, IconType> = {
  duplicate: TbCopy,
  trust: TbPhoto,
  context: TbMapPin,
};

export interface EvidenceRow {
  label: string;
  value: ReactNode;
}

/**
 * One check of the admin view (mockup card): main reason as the title, a one-line summary,
 * evidence as label/value rows, and a chip per signal so the moderator sees where the check stopped.
 */
export function CheckCard({
  name,
  check,
  isDark,
  rows = [],
  children,
}: {
  name: CheckName;
  check?: ICheckResult;
  isDark: boolean;
  rows?: EvidenceRow[];
  children?: ReactNode;
}) {
  const { t } = useTranslation();
  const label = t(CHECK_NAMES.find((c) => c.value === name)?.label ?? name);
  const Icon = CHECK_ICON[name];
  const scored = check?.status === "COMPLETED" && check.risk != null;
  const reasons = check?.reasons ?? [];
  const muted = isDark ? "text-zinc-400" : "text-muted-foreground";

  return (
    <section
      className={cn(
        // From lg the card spans the parent's 3 rows (header / body / conclusion) through subgrid,
        // so the three cards line their conclusions up whatever the content height.
        "flex flex-col gap-4 rounded-[10px] border p-4 lg:row-span-3 lg:grid lg:grid-rows-subgrid",
        isDark ? "border-zinc-700 bg-zinc-800" : "border-border bg-card",
      )}
    >
      <header className="flex items-start gap-3">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-md border",
            isDark ? PILL_TONE.neutral.dark : PILL_TONE.neutral.light,
          )}
        >
          <Icon className="size-5" aria-hidden />
          <span className="sr-only">{label}</span>
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className={cn("font-display-3 font-semibold", isDark ? "text-zinc-100" : "text-foreground")}>{label}</h3>
            {scored ? (
              <span className="font-mono text-sm font-semibold">
                {t("risk {{risk}}", { risk: (check.risk as number).toFixed(2) })}
              </span>
            ) : (
              <Pill tone={check ? CHECK_STATUS_TONE[check.status] : "neutral"} isDark={isDark}>
                {t(check ? CHECK_STATUS_LABEL[check.status] : "Not run")}
              </Pill>
            )}
          </div>
        </div>
      </header>

      <div className="flex min-w-0 flex-col gap-4">
        {children}

        {rows.length > 0 && (
          <dl className="grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] gap-x-6 gap-y-1.5 text-sm">
            {rows.map((row) => (
              <div key={row.label} className="contents">
                <dt className={muted}>{row.label}</dt>
                <dd className={cn("font-semibold", isDark ? "text-zinc-100" : "text-foreground")}>{row.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {!!check?.signals.length && (
          <ul className="flex flex-wrap gap-2" aria-label={t("Signals")}>
            {check.signals.map((signal) => (
              <li key={signal.name}>
                <Pill tone={signalTone(signal)} isDark={isDark} className="rounded-md font-mono">
                  {signal.name}: {signal.status === "COMPLETED" ? (signal.raw ?? signal.risk ?? "—") : signal.status}
                </Pill>
              </li>
            ))}
          </ul>
        )}
        {check?.error && (
          <p className="font-mono text-xs text-red-500">
            {check.error.code}: {check.error.message}
          </p>
        )}
      </div>

      <div className={cn("flex flex-col gap-1.5 border-t pt-3", isDark ? "border-zinc-700" : "border-border")}>
        <span className={cn("text-xs font-medium uppercase tracking-wide", muted)}>{t("Conclusion")}</span>
        {check?.status !== "COMPLETED" ? (
          <p className={cn("text-sm", muted)}>—</p>
        ) : reasons.length === 0 ? (
          <p className="text-sm">{t("No issue found")}</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {reasons.map((code) => (
              <li key={code} className="flex flex-wrap items-center gap-2 text-sm">
                <span className={cn("font-medium", isDark ? "text-zinc-100" : "text-foreground")}>
                  {t(reasonCopy(code).title)}
                </span>
                {isAdminOnlyReason(code) && <Pill isDark={isDark}>{t("Admin only")}</Pill>}
                <span className={cn("font-mono text-xs", muted)}>{code}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
