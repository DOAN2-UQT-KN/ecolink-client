import { memo, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { TbAlertTriangle, TbClipboardCheck, TbExternalLink, TbThumbDown, TbThumbUp } from "react-icons/tb";

import {
  useCompletionReview,
  useReviewCampaignCompletion,
  type CompletionDecision,
  type ICompletionReview,
  type ICompletionReviewReport,
} from "@/apis/campaign/processCampaign";
import type { IResultPhotoCheck } from "@/apis/campaign/shiftResult";
import type { IMeetingPointView } from "@/apis/campaign/verification";
import {
  CHECK_LEVEL_LABEL,
  checksByUrl,
  meetingPointLabel,
  MeetingPointStatusPill,
  PhotoCheckBadge,
  TRASH_POINT_RESULT_LABEL,
} from "@/app/(pages)/(main)/campaigns/[id]/_components/ResultVerificationBadges";
import { MeetingPointDecisionActions } from "@/app/(pages)/(main)/campaigns/[id]/_components/MeetingPointDecisionActions";
import { MeetingPointVotesList } from "@/app/(pages)/(main)/campaigns/[id]/_components/MeetingPointVotesPopover";
import { ReviewSectionCard } from "@/components/admin/shared/ReviewSection";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { DIFFICULTY_LEVEL, isDifficultyLevel } from "@/constants/difficulty";
import { queryClient } from "@/libs/queryClient";
import { cn } from "@/libs/utils";
import { formattedDate } from "@/utils/formattedDate";
import showMessage, { MessageLevel, MessageType } from "@/utils/showMessage";

const REASON_MAX = 5000;

/** Before or after photos; only a photo with a warning, a failure or no check carries a badge (hover: why). */
function Photos({
  label,
  urls,
  checks,
  isDark,
}: {
  label: string;
  urls: string[];
  /** Layer 1 checks by URL; badges show only when given. */
  checks?: Map<string, IResultPhotoCheck | null>;
  isDark?: boolean;
}) {
  if (urls.length === 0) return null;
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {urls.map((url) => {
          const check = checks ? (checks.get(url) ?? null) : undefined;
          return (
            <div key={url} className="relative">
              <a href={url} target="_blank" rel="noopener noreferrer">
                <img src={url} alt="" loading="lazy" className="size-16 rounded-md border object-cover" />
              </a>
              {check !== undefined && check?.level !== "pass" && (
                <PhotoCheckBadge check={check} isDark={isDark} className="absolute bottom-1 left-1 shadow-sm" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** How many voted clean / not clean; each opens a dialog with those votes in detail. */
function MeetingPointVotesButtons({
  votes,
  titleById,
  title,
  isDark,
}: {
  votes: IMeetingPointView["votes"];
  titleById: Map<string, string>;
  title: string;
  isDark: boolean;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState<"up" | "down" | null>(null);
  const count = (side: "up" | "down") => votes.filter((v) => v.value === side).length;
  return (
    <>
      <div className="flex flex-wrap items-center gap-4 text-sm">
        {(["up", "down"] as const).map((side) => (
          <button
            key={side}
            type="button"
            onClick={() => setOpen(side)}
            className={cn(
              "inline-flex items-center gap-1 underline-offset-2 hover:underline",
              side === "up"
                ? isDark ? "text-emerald-300" : "text-emerald-700"
                : isDark ? "text-red-300" : "text-red-700",
            )}
          >
            {side === "up" ? <TbThumbUp className="size-4" aria-hidden /> : <TbThumbDown className="size-4" aria-hidden />}
            {count(side)} {side === "up" ? t("Clean") : t("Not clean")}
          </button>
        ))}
      </div>
      <Dialog open={open != null} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent
          className={cn("max-h-[80vh] max-w-lg overflow-y-auto", isDark ? "bg-zinc-900 text-zinc-100" : "bg-zinc-50 text-zinc-900")}
        >
          <DialogHeader>
            <DialogTitle className={cn(isDark ? "text-zinc-100" : "text-zinc-900")}>
              {t("Votes")} · {title}
            </DialogTitle>
            <DialogDescription className="sr-only">{t("Votes")}</DialogDescription>
          </DialogHeader>
          {open && (
            <MeetingPointVotesList votes={votes} titleById={titleById} isDark={isDark} defaultTab={open} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

/** The verification score against its 15-point threshold: green once verified, red when downvoted to ≤ 3. */
function ScoreBar({ score, downvoted, isDark }: { score: number | null; downvoted: boolean; isDark: boolean }) {
  const { t } = useTranslation();
  if (score == null) return null;
  const pct = Math.min(100, (Math.max(0, score) / 15) * 100);
  const tone = score >= 15 ? "bg-emerald-500" : downvoted && score <= 3 ? "bg-red-500" : "bg-amber-500";
  return (
    <span className="flex min-w-40 flex-1 items-center gap-2 text-xs">
      <span className={cn("shrink-0 tabular-nums", isDark ? "text-zinc-300" : "text-zinc-700")}>
        {t("Score")} {score} / 15
      </span>
      <span className={cn("h-1.5 flex-1 overflow-hidden rounded-full", isDark ? "bg-zinc-700" : "bg-zinc-200")}>
        <span className={cn("block h-full rounded-full transition-all", tone)} style={{ width: `${pct}%` }} />
      </span>
    </span>
  );
}

/** One meeting point under result verification: status, score, Layer 1, its trash points, every vote; flagged → decide. */
const RESULT_DOT: Record<string, string> = { cleaned: "bg-emerald-500", partial: "bg-amber-500", unhandled: "bg-red-500" };
const LEVEL_TEXT: Record<string, { light: string; dark: string }> = {
  pass: { light: "text-emerald-700", dark: "text-emerald-300" },
  warn: { light: "text-amber-700", dark: "text-amber-300" },
  fail: { light: "text-red-700", dark: "text-red-300" },
};

/** One trash point of the submission: what was declared (dot + word), why not handled, its photos. */
function TrashPointEvidence({
  report,
  failed = false,
  isDark,
}: {
  report: ICompletionReviewReport;
  /** The meeting point was rejected and this trash point did not pass. */
  failed?: boolean;
  isDark: boolean;
}) {
  const { t } = useTranslation();
  const checks = report.layer1 ? checksByUrl(report.layer1) : undefined;
  return (
    <li className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <a
          href={`/incidents/${report.report_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium underline-offset-2 hover:underline"
        >
          {report.report?.title || t("Waste point")}
          <TbExternalLink className="size-3.5" aria-hidden />
        </a>
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className={cn("size-2 rounded-full", RESULT_DOT[report.status])} aria-hidden />
          {t(TRASH_POINT_RESULT_LABEL[report.status])}
        </span>
        {failed && (
          <span className={cn("text-xs font-semibold", isDark ? "text-red-300" : "text-red-700")}>
            {t("Did not pass")}
          </span>
        )}
      </div>
      {report.reason && (
        <span className="text-xs text-muted-foreground">
          {t("Why not handled")}: <span className={isDark ? "text-zinc-200" : "text-zinc-800"}>{report.reason}</span>
        </span>
      )}
      {(report.before_urls.length > 0 || report.after_urls.length > 0) && (
        <div className="flex flex-wrap gap-4">
          <Photos label={t("Before")} urls={report.before_urls} checks={checks} isDark={isDark} />
          <Photos label={t("After")} urls={report.after_urls} checks={checks} isDark={isDark} />
        </div>
      )}
    </li>
  );
}

/** One meeting point under result verification: score, photo check, timing, votes, its trash points; flagged → decide. */
function VerificationMeetingPoint({
  campaignId,
  point,
  index,
  reportsById,
  canDecide,
  isDark,
}: {
  campaignId: string;
  point: IMeetingPointView;
  index: number;
  reportsById: Map<string, ICompletionReviewReport>;
  canDecide: boolean;
  isDark: boolean;
}) {
  const { t } = useTranslation();
  const name = meetingPointLabel(point.name, index, t);
  const titleById = new Map(
    point.trash_points.map((tp) => [tp.report_id, tp.report?.title || t("Waste point")]),
  );
  const cleaned = point.trash_points.filter((tp) => tp.status === "cleaned");
  const timing =
    point.status === "voting"
      ? t("Voting until {{date}}", { date: formattedDate(point.window_ends_at, true) })
      : point.status === "flagged" && point.flag_deadline
        ? t("Rejected automatically on {{date}} if not decided", { date: formattedDate(point.flag_deadline, true) })
        : point.decided_at
          ? t("Decided on {{date}}", { date: formattedDate(point.decided_at, true) })
          : null;
  const failed = point.status === "rejected" ? new Set(point.failed_report_ids) : new Set<string>();

  return (
    <ReviewSectionCard
      title={name}
      hint={point.round > 1 ? t("Round {{n}}", { n: point.round }) : undefined}
      aside={<MeetingPointStatusPill status={point.status} isDark={isDark} />}
      defaultOpen={point.status === "flagged"}
      isDark={isDark}
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          <ScoreBar score={point.score} downvoted={point.down_count > 0} isDark={isDark} />
          <span>
            {t("Photos")}:{" "}
            <span className={cn("font-medium", LEVEL_TEXT[point.layer1_level]?.[isDark ? "dark" : "light"])}>
              {t(CHECK_LEVEL_LABEL[point.layer1_level])}
            </span>
          </span>
          {timing && <span>{timing}</span>}
        </div>
        {point.decision_reason && (
          <span className="text-xs text-muted-foreground">
            {t("Reason")}: <span className={isDark ? "text-zinc-200" : "text-zinc-800"}>{point.decision_reason}</span>
          </span>
        )}
        <MeetingPointVotesButtons votes={point.votes} titleById={titleById} title={name} isDark={isDark} />
        <ul className={cn("flex flex-col gap-3 border-t pt-3", isDark ? "border-zinc-700" : "border-zinc-200")}>
          {point.trash_points.map((tp) => {
            const report = reportsById.get(tp.report_id);
            if (!report) return null;
            return <TrashPointEvidence key={tp.report_id} report={report} failed={failed.has(tp.report_id)} isDark={isDark} />;
          })}
        </ul>
        {canDecide && point.status === "flagged" && (
          <MeetingPointDecisionActions
            campaignId={campaignId}
            meetingPointId={point.meeting_point_id}
            trashPoints={cleaned.map((tp) => ({ id: tp.report_id, title: titleById.get(tp.report_id) ?? "" }))}
            isDark={isDark}
          />
        )}
      </div>
    </ReviewSectionCard>
  );
}

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

type Props = {
  campaignId: string;
  campaignTitle: string;
  theme: "light" | "dark";
};

/**
 * Admin on a campaign marked done, with the evidence: result verification of each meeting point
 * (flagged ones are verified or rejected here, one by one), the submission and the totals. The
 * campaign itself is decided by verification; the admin may cancel it (reason) at any time, and
 * approve it (settling the difficulty) only when verification hands it over (`can_approve`).
 */
export const CompletionReviewDialog = memo(function CompletionReviewDialog({
  campaignId,
  campaignTitle,
  theme,
}: Props) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const [open, setOpen] = useState(false);
  const [chosen, setChosen] = useState<CompletionDecision | null>(null);
  const [difficulty, setDifficulty] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const { data, isLoading } = useCompletionReview(campaignId, { enabled: open });
  const review = data?.data;
  const { mutateAsync, isPending } = useReviewCampaignCompletion();
  // Approve only while verification hands the campaign to the admin; otherwise only cancel.
  const decision: CompletionDecision = review?.can_approve ? (chosen ?? "approve") : "cancel";

  const reset = useCallback(() => {
    setChosen(null);
    setDifficulty(null);
    setReason("");
    setError("");
  }, []);

  const levels = useMemo(() => {
    const range = review?.difficulty_range ?? { min: 1, max: 4 };
    return Array.from({ length: range.max - range.min + 1 }, (_, i) => range.min + i);
  }, [review?.difficulty_range]);
  const chosenDifficulty = difficulty ?? review?.difficulty ?? null;

  const onConfirm = async () => {
    if (!review) return;
    const text = reason.trim();
    if (decision !== "approve" && !text) {
      setError(t("A reason is required"));
      return;
    }
    setError("");
    await mutateAsync({
      id: campaignId,
      decision,
      ...(decision === "approve"
        ? chosenDifficulty != null
          ? { difficulty: chosenDifficulty }
          : {}
        : { reject_reason: text }),
    });
    await queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    showMessage({
      type: MessageType.Toast,
      level: MessageLevel.Success,
      title:
        decision === "approve" ? t("Campaign marked as done successfully") : t("Campaign cancelled"),
    });
    reset();
    setOpen(false);
  };

  const muted = isDark ? "text-zinc-400" : "text-zinc-600";
  const inputDark = isDark && "border-zinc-700 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500";
  const decisions: { value: CompletionDecision; label: string }[] = [
    ...(review?.can_approve ? [{ value: "approve" as const, label: t("Approve") }] : []),
    { value: "cancel", label: t("Cancel campaign") },
  ];

  return (
    <>
      <button
        type="button"
        title={t("Review campaign completion")}
        onClick={() => {
          reset();
          setOpen(true);
        }}
        className={cn(
          "rounded-md border px-1.5 py-1.5 text-xs font-medium transition-colors cursor-pointer duration-200",
          isDark
            ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-blue-300"
            : "border-zinc-300 text-zinc-700 hover:bg-zinc-100 hover:text-blue-700",
        )}
      >
        <TbClipboardCheck className="size-5" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className={cn(
            "max-h-[90vh] max-w-4xl overflow-y-auto",
            isDark ? "bg-zinc-900 text-zinc-100" : "bg-zinc-50 text-zinc-900",
          )}
        >
          <DialogHeader>
            <DialogTitle className={cn(isDark ? "text-zinc-100" : "text-zinc-900")}>
              {t("Review campaign completion")}
            </DialogTitle>
            <DialogDescription className={muted}>{campaignTitle}</DialogDescription>
          </DialogHeader>

          {isLoading || !review ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : (
            <div className="flex min-w-0 flex-col gap-4">
              <CompletionEvidence review={review} isDark={isDark} canDecide />

              <section
                className={cn(
                  "flex flex-col gap-4 rounded-lg border p-4",
                  isDark ? "border-zinc-700 bg-zinc-800/50" : "border-zinc-200 bg-white",
                )}
              >
                <span className="font-semibold">{t("Decision")}</span>
                <RadioGroup
                  value={decision}
                  onValueChange={(value) => {
                    setChosen(value as CompletionDecision);
                    setError("");
                  }}
                  disabled={isPending}
                  className="flex flex-row flex-wrap items-center gap-8"
                >
                  {decisions.map((d) => (
                    <label
                      key={d.value}
                      htmlFor={`completion-${d.value}-${campaignId}`}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 text-sm",
                      )}
                    >
                      <RadioGroupItem
                        value={d.value}
                        id={`completion-${d.value}-${campaignId}`}
                      />
                      {d.label}
                    </label>
                  ))}
                </RadioGroup>
                {!review.can_approve && (
                  <p className={cn("text-xs", muted)}>
                    {t(
                      "Result verification decides this campaign: it is completed once every meeting point is verified. You can only cancel it here.",
                    )}
                  </p>
                )}

                {decision === "approve" && (
                  <div className="flex flex-col gap-2">
                    <p className={cn("text-sm", muted)}>
                      {t(
                        "Handled waste points are completed, the others go back to the waiting list. Volunteers get points at the difficulty below.",
                      )}
                    </p>
                    <Label className={cn(isDark ? "text-zinc-200" : "text-zinc-800")}>
                      {t("Final difficulty")}
                    </Label>
                    <Select
                      value={chosenDifficulty != null ? String(chosenDifficulty) : undefined}
                      onValueChange={(v) => setDifficulty(Number(v))}
                      disabled={isPending}
                    >
                      <SelectTrigger className={cn("w-56", inputDark)}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {levels.map((level) => (
                          <SelectItem key={level} value={String(level)}>
                            {isDifficultyLevel(level) ? t(DIFFICULTY_LEVEL[level].label) : level}
                            {level === review.difficulty ? ` (${t("current")})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {decision === "cancel" && (
                  <p className={cn("text-sm", muted)}>
                    {t(
                      "The campaign is cancelled: nobody gets points, its waste points go back to the waiting list, volunteers and the team are told.",
                    )}
                  </p>
                )}

                {decision !== "approve" && (
                  <div className="flex flex-col gap-2">
                    <Label
                      htmlFor={`completion-reason-${campaignId}`}
                      className={cn(isDark ? "text-zinc-200" : "text-zinc-800")}
                    >
                      {t("Reason")} <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id={`completion-reason-${campaignId}`}
                      value={reason}
                      onChange={(e) => {
                        setReason(e.target.value);
                        if (error) setError("");
                      }}
                      maxLength={REASON_MAX}
                      disabled={isPending}
                      placeholder={t("The team sees this reason")}
                      className={cn("min-h-24", inputDark)}
                    />
                  </div>
                )}
                {error && <p className="text-sm text-destructive">{error}</p>}
              </section>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              {t("Close")}
            </Button>
            <Button
              variant={decision === "approve" ? "default" : "destructive"}
              onClick={() => void onConfirm().catch(() => undefined)}
              disabled={isPending || !review}
            >
              {decision === "approve" ? t("Approve") : t("Cancel campaign")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});

export default CompletionReviewDialog;
