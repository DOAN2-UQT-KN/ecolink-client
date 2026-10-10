import { memo } from "react";
import { useTranslation } from "react-i18next";
import { TbAlertTriangle } from "react-icons/tb";
import type { ICompletionReview } from "@/apis/campaign/models/processCampaign";
import { ReviewSectionCard } from "@/components/ui/ReviewSection";
import { cn } from "@/libs/utils";
import { formattedDate } from "@/utils/formattedDate";
import { TrashPointEvidence, VerificationMeetingPoint } from "./VerificationMeetingPoint";

/** One "label value" of the summary line. */
function Fact({ label, value }: { label: string; value: string }) {
  return (
    <span>
      <span className="text-muted-foreground">{label}</span> <span className="font-semibold tabular-nums">{value}</span>
    </span>
  );
}

/**
 * What the admin decides on, each fact once: what needs a decision, a one-line summary, then each
 * meeting point under result verification (score, photo check, votes, its trash points with their
 * photos), and the trash points outside voting. `canDecide` adds Verify / Reject on flagged ones.
 */
export const CompletionEvidence = memo(function CompletionEvidence({
  review,
  isDark,
  canDecide = false,
}: {
  review: ICompletionReview;
  isDark: boolean;
  canDecide?: boolean;
}) {
  const { t } = useTranslation();
  const { totals, submission, verification } = review;
  const points = verification?.meeting_points ?? [];
  const flagged = points.filter((p) => p.status === "flagged").length;
  const verified = points.filter((p) => p.status === "verified").length;
  const reportsById = new Map(submission.reports.map((r) => [r.report_id, r]));
  const voted = new Set(points.flatMap((p) => p.trash_points.map((tp) => tp.report_id)));
  const outside = submission.reports.filter((r) => !voted.has(r.report_id));
  const rate = totals.present_rate == null ? "" : ` (${Math.round(totals.present_rate * 100)}%)`;

  return (
    <div className="flex min-w-0 flex-col gap-3">
      {(review.awaiting_admin || flagged > 0) && (
        <section
          role="alert"
          className={cn(
            "flex items-start gap-2 rounded-lg border p-4 text-sm",
            isDark
              ? "border-amber-400/40 bg-amber-500/10 text-amber-200"
              : "border-amber-500/40 bg-amber-50 text-amber-900",
          )}
        >
          <TbAlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden />
          <span className="flex flex-col gap-1">
            {review.awaiting_admin && (
              <span className="font-semibold">
                {review.awaiting_admin_reason === "no_cleaned_points"
                  ? t("No waste point was declared cleaned: approve or cancel the campaign.")
                  : t("Already rejected {{max}} times: approve or cancel the campaign.", {
                      max: review.max_rejections,
                    })}
              </span>
            )}
            {flagged > 0 && (
              <span>{t("{{n}} flagged meeting point(s) wait for your decision.", { n: flagged })}</span>
            )}
          </span>
        </section>
      )}

      <div
        className={cn(
          "flex flex-col gap-1.5 rounded-lg border px-4 py-3 text-sm",
          isDark ? "border-zinc-700 bg-zinc-800/50" : "border-zinc-200 bg-white",
        )}
      >
        {review.completion_submitted_at && (
          <span className="text-xs text-muted-foreground">
            {t("Submitted on {{date}}", { date: formattedDate(review.completion_submitted_at, true) })}
            {review.rejection_count > 0 &&
              ` · ${t("Rejected {{n}} of {{max}} times", { n: review.rejection_count, max: review.max_rejections })}`}
          </span>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <Fact label={t("Shifts ended")} value={`${totals.ended_shifts}/${totals.active_shifts}`} />
          <Fact label={t("Present / registered")} value={`${totals.present}/${totals.registered}${rate}`} />
          <Fact label={t("Bags")} value={String(totals.waste_bags)} />
          <Fact label={t("Weight (kg)")} value={String(totals.waste_kg)} />
          <Fact
            label={t("Waste points cleaned / partly / not handled")}
            value={`${submission.counts.cleaned}/${submission.counts.partial}/${submission.counts.unhandled}`}
          />
          <Fact label={t("Verified meeting points")} value={`${verified}/${points.length}`} />
        </div>
      </div>

      {points.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("No meeting point is being verified.")}</p>
      ) : (
        points.map((point, index) => (
          <VerificationMeetingPoint
            key={point.verification_id}
            campaignId={review.campaign_id}
            point={point}
            index={index}
            reportsById={reportsById}
            canDecide={canDecide}
            isDark={isDark}
          />
        ))
      )}

      {outside.length > 0 && (
        <ReviewSectionCard title={t("Waste points outside voting ({{n}})", { n: outside.length })} isDark={isDark}>
          <ul className="flex flex-col gap-3">
            {outside.map((r) => (
              <TrashPointEvidence key={r.report_id} report={r} isDark={isDark} />
            ))}
          </ul>
        </ReviewSectionCard>
      )}
    </div>
  );
});
