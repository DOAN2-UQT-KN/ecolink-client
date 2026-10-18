import { useTranslation } from "react-i18next";
import type { IAdminVerification } from "@/apis/incident/models/verification";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { PILL_DOT, Pill } from "@/components/ui/Pill";
import { Progress } from "@/components/ui/progress";
import { CHECK_NAMES, RISK_THRESHOLDS, riskBreakdown } from "@/constants/reportVerification";
import { CHECK_STATUS_LABEL, CHECK_STATUS_TONE, RISK_FLAG_TONE, riskTone } from "@/constants/statusTone";
import { cn } from "@/libs/utils";

/** Bands of the 0–1 scale under the total score, by engine threshold. */
const BANDS = [
  { from: 0, to: RISK_THRESHOLDS.review, tone: "green" },
  { from: RISK_THRESHOLDS.review, to: RISK_THRESHOLDS.reject, tone: "amber" },
  { from: RISK_THRESHOLDS.reject, to: 1, tone: "red" },
] as const;

/** Total risk with its scale, one bar per check, and the engine formula in a tooltip (mockup "Risk tổng"). */
export function RiskSummary({
  verification,
  isDark,
}: {
  verification: IAdminVerification;
  isDark: boolean;
}) {
  const { t } = useTranslation();
  const score = verification.risk_score;
  const { terms, score: computed } = riskBreakdown(verification.checks);
  // The band the score falls in is shown at full strength, the other two stay faint.
  const activeTone = score != null ? riskTone(score) : null;
  const muted = isDark ? "text-zinc-400" : "text-muted-foreground";

  const formula = (
    <div className="flex max-w-xs flex-col gap-1 text-xs">
      <span>{t("Total = Σ(weight × risk) / Σ weight of the completed checks")}</span>
      {terms.length > 0 && computed != null && (
        <span className="font-mono">
          ({terms.map((term) => `${term.weight}×${term.risk.toFixed(2)}`).join(" + ")}) /{" "}
          {terms.reduce((sum, term) => sum + term.weight, 0).toFixed(1)} = {computed.toFixed(2)}
        </span>
      )}
      <span>
        {t("Weights: Duplicate {{d}}, Trust {{t}}, Context {{c}}", {
          d: CHECK_NAMES[0].weight,
          t: CHECK_NAMES[1].weight,
          c: CHECK_NAMES[2].weight,
        })}
      </span>
      <span>
        {t("Below {{review}} accept · {{review}}–{{reject}} review · from {{reject}} reject", {
          review: RISK_THRESHOLDS.review.toFixed(2),
          reject: RISK_THRESHOLDS.reject.toFixed(2),
        })}
      </span>
      <span>{t("A failed duplicate check is never accepted automatically (at least review)")}</span>
      {verification.versions.engine && <span className="font-mono">{verification.versions.engine}</span>}
    </div>
  );

  return (
    <section
      aria-label={t("Total risk")}
      className={cn(
        "grid gap-5 rounded-[10px] border p-4 sm:grid-cols-[minmax(0,180px)_minmax(0,1fr)]",
        isDark ? "border-zinc-700 bg-zinc-800" : "border-border bg-card",
      )}
    >
      <div className="flex flex-col gap-2">
        <span className={cn("flex items-center gap-1.5 text-sm", muted)}>
          {t("Total risk")}
          <InfoTooltip content={formula} label={t("How the total risk is calculated")} />
        </span>
        <div className="flex items-end gap-2">
          <span className={cn("font-display-9 font-bold leading-none", isDark ? "text-zinc-100" : "text-foreground")}>
            {score != null ? score.toFixed(2) : "—"}
          </span>
          {verification.flag && (
            <Pill tone={RISK_FLAG_TONE[verification.flag]} isDark={isDark} className="mb-1">
              {verification.flag}
            </Pill>
          )}
        </div>
        {/* Scale with a marker at the score; the number above already reads it out. */}
        <div className="relative mt-1 flex h-1.5 overflow-hidden rounded-sm" aria-hidden>
          {BANDS.map((band) => (
            <span
              key={band.tone}
              className={cn("h-full", band.tone === activeTone ? "opacity-100" : "opacity-30", PILL_DOT[band.tone])}
              style={{ width: `${(band.to - band.from) * 100}%` }}
            />
          ))}
          {score != null && (
            <span
              className={cn("absolute top-0 h-full w-0.5 ring-1", isDark ? "bg-zinc-100 ring-zinc-900" : "bg-foreground ring-white")}
              style={{ left: `calc(${Math.min(1, Math.max(0, score)) * 100}% - 1px)` }}
            />
          )}
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-2.5">
        {CHECK_NAMES.map(({ value, label }) => {
          const check = verification.checks[value];
          const scored = check?.status === "COMPLETED" && check.risk != null;
          return (
            <div key={value} className="grid grid-cols-[minmax(0,90px)_minmax(0,1fr)_auto] items-center gap-3">
              <span className={cn("truncate text-sm", isDark ? "text-zinc-200" : "text-foreground")}>{t(label)}</span>
              {scored ? (
                <Progress
                  value={Math.round((check.risk as number) * 100)}
                  indicatorClassName={PILL_DOT[riskTone(check.risk)]}
                  className={isDark ? "bg-zinc-700" : undefined}
                  aria-label={t("{{check}} risk", { check: t(label) })}
                />
              ) : (
                <span />
              )}
              {scored ? (
                <span className="w-10 text-right font-mono text-sm font-semibold">{(check.risk as number).toFixed(2)}</span>
              ) : check ? (
                <Pill tone={CHECK_STATUS_TONE[check.status]} isDark={isDark}>
                  {t(CHECK_STATUS_LABEL[check.status])}
                </Pill>
              ) : (
                <Pill isDark={isDark}>{t("Not run")}</Pill>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
