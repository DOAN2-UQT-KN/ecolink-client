import { useTranslation } from "react-i18next";
import { Pill } from "@/components/ui/Pill";
import { reasonCopy, shortReportCode } from "@/constants/reportVerification";
import type { IVerificationIssue } from "@/apis/incident/models/verification";

/** One problem found by verification, in plain words; never names the other report's sender (FR-014). */
export default function IssueCard({ issue }: { issue: IVerificationIssue }) {
  const { t } = useTranslation();
  const copy = reasonCopy(issue.code);
  const { similar_report_id, distance_m, time_delta_hours, nearest } = issue.evidence ?? {};

  const facts: string[] = [];
  if (issue.code.startsWith("DUP_") && similar_report_id) {
    facts.push(t("Similar report {{code}}", { code: shortReportCode(similar_report_id) }));
    if (distance_m != null) facts.push(t("{{distance}} m away", { distance: Math.round(distance_m) }));
    if (time_delta_hours != null) {
      facts.push(
        time_delta_hours < 24
          ? t("sent {{count}} h apart", { count: Math.round(time_delta_hours) })
          : t("sent {{count}} days apart", { count: Math.round(time_delta_hours / 24) }),
      );
    }
  }
  if (issue.code.startsWith("CTX_") && nearest?.name) {
    facts.push(
      nearest.distance_m != null
        ? t("Nearest place: {{name}}, {{distance}} m", { name: nearest.name, distance: Math.round(nearest.distance_m) })
        : t("Nearest place: {{name}}", { name: nearest.name }),
    );
  }

  return (
    <article className="flex flex-col gap-2 rounded-[10px] border border-button-accent-hover/40 bg-white/80 p-4">
      <div className="flex flex-wrap items-center gap-2">
        {issue.primary && <Pill tone="red">{t("Main reason")}</Pill>}
        <h3 className="font-display-3 font-semibold text-foreground-primary">{t(copy.title)}</h3>
      </div>
      <p className="text-sm text-foreground-secondary">{t(copy.description)}</p>
      {facts.length > 0 && <p className="text-sm text-foreground-secondary">{facts.join(" · ")}</p>}
      {copy.fix && (
        <p className="text-sm text-foreground-primary">
          <span className="font-medium">{t("How to fix")}: </span>
          {t(copy.fix)}
        </p>
      )}
      <span className="text-xs text-foreground-tertiary">{issue.code}</span>
    </article>
  );
}
