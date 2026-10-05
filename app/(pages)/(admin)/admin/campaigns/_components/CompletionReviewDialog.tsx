import { memo, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { TbAlertTriangle, TbClipboardCheck, TbExternalLink } from "react-icons/tb";

import {
  useCompletionReview,
  useReviewCampaignCompletion,
  type CompletionDecision,
  type ICompletionReview,
} from "@/apis/campaign/processCampaign";
import type { IResultPhotoCheck } from "@/apis/campaign/shiftResult";
import type { IMeetingPointView } from "@/apis/campaign/verification";
import {
  CHECK_LEVEL_LABEL,
  CHECK_LEVEL_TONE,
  checksByUrl,
  Layer1LevelBadge,
  Layer1Summary,
  meetingPointLabel,
  MeetingPointStatusPill,
  PhotoCheckBadge,
  TrashPointResultPill,
  WEIGHT_REASON_LABEL,
} from "@/app/(pages)/(main)/campaigns/[id]/_components/ResultVerificationBadges";
import { MeetingPointDecisionActions } from "@/app/(pages)/(main)/campaigns/[id]/_components/MeetingPointDecisionActions";
import { ReviewRow, ReviewSectionCard } from "@/components/admin/shared/ReviewSection";
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
import { Pill } from "@/components/ui/Pill";
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
      <div className="flex flex-wrap gap-2">
        {urls.map((url) => (
          <div key={url} className="relative">
            <a href={url} target="_blank" rel="noopener noreferrer">
              <img
                src={url}
                alt=""
                loading="lazy"
                className="size-20 rounded-md border object-cover"
              />
            </a>
            {checks && (
              <PhotoCheckBadge
                check={checks.get(url) ?? null}
                isDark={isDark}
                className="absolute bottom-1 left-1 shadow-sm"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/** One meeting point under result verification: status, score, Layer 1, its trash points, every vote; flagged → decide. */
function VerificationMeetingPoint({
  campaignId,
  point,
  index,
  canDecide,
  isDark,
}: {
  campaignId: string;
  point: IMeetingPointView;
  index: number;
  canDecide: boolean;
  isDark: boolean;
}) {
  const { t } = useTranslation();
  const muted = isDark ? "text-zinc-400" : "text-zinc-600";
  const votes = point.votes ?? [];
  const titleById = new Map(
    point.trash_points.map((tp) => [tp.report_id, tp.report?.title || t("Waste point")]),
  );
  const titlesOf = (ids: string[]) => ids.map((id) => titleById.get(id) ?? t("Waste point")).join(", ");
  const cleaned = point.trash_points.filter((tp) => tp.status === "cleaned");
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium">{meetingPointLabel(point.name, index, t)}</span>
        <span className="flex flex-wrap items-center gap-1.5 text-xs">
          {point.round > 1 && (
            <Pill tone="neutral" isDark={isDark}>
              {t("Round {{n}}", { n: point.round })}
            </Pill>
          )}
          <span className={cn("tabular-nums", muted)}>
            {t("Score")} {point.score ?? "—"} / 15 · {point.up_count}↑ {point.down_count}↓
          </span>
          <MeetingPointStatusPill status={point.status} isDark={isDark} />
        </span>
      </div>
      {point.detail_address && <span className={cn("text-xs", muted)}>{point.detail_address}</span>}
      <span className={cn("text-xs", muted)}>
        {point.status === "voting"
          ? t("Voting until {{date}}", { date: formattedDate(point.window_ends_at, true) })
          : point.status === "flagged" && point.flag_deadline
            ? t("Rejected automatically on {{date}} if not decided", {
                date: formattedDate(point.flag_deadline, true),
              })
            : point.decided_at
              ? t("Decided on {{date}}", { date: formattedDate(point.decided_at, true) })
              : null}
        {point.decision_reason ? ` · ${t("Reason")}: ${point.decision_reason}` : ""}
      </span>
      {point.status === "rejected" && point.failed_report_ids.length > 0 && (
        <span className={cn("text-xs", isDark ? "text-red-300" : "text-red-700")}>
          {t("Waste points that did not pass")}: {titlesOf(point.failed_report_ids)}
        </span>
      )}
      <Layer1LevelBadge level={point.layer1_level} isDark={isDark} />
      <ul className="flex flex-col gap-1">
        {point.trash_points.map((tp) => (
          <li key={tp.report_id} className="flex flex-wrap items-center gap-1.5 text-sm">
            <a
              href={`/incidents/${tp.report_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 underline-offset-2 hover:underline"
            >
              {titleById.get(tp.report_id)}
              <TbExternalLink className="size-3.5" aria-hidden />
            </a>
            <TrashPointResultPill status={tp.status} isDark={isDark} />
            {tp.layer1 && (
              <Pill tone={CHECK_LEVEL_TONE[tp.layer1.level]} isDark={isDark}>
                {t("Photo check")}: {t(CHECK_LEVEL_LABEL[tp.layer1.level])}
              </Pill>
            )}
          </li>
        ))}
      </ul>
      {votes.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold">{t("Votes ({{n}})", { n: votes.length })}</span>
          {votes.map((v) => (
            <div key={v.user_id} className="flex flex-wrap items-start gap-3 text-sm">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className="font-medium">{v.user?.name || t("User")}</span>
                  <Pill tone={v.value === "up" ? "green" : "red"} isDark={isDark}>
                    {v.value === "up" ? t("Clean") : t("Not clean")}
                  </Pill>
                  <Pill tone={v.weight > 0 ? "brand" : "neutral"} isDark={isDark}>
                    {t("weight {{w}}", { w: v.weight })}
                  </Pill>
                </span>
                <span className={cn("text-xs", muted)}>
                  {t(WEIGHT_REASON_LABEL[v.weight_reason] ?? v.weight_reason)}
                  {v.distance_m != null && ` · ${t("{{m}} m away", { m: Math.round(v.distance_m) })}`}
                  {" · "}
                  {formattedDate(v.updated_at, true)}
                </span>
                {v.flagged_report_ids.length > 0 && (
                  <span className={cn("text-xs", isDark ? "text-red-300" : "text-red-700")}>
                    {t("Not clean")}: {titlesOf(v.flagged_report_ids)}
                  </span>
                )}
                {v.note && <span className="whitespace-pre-wrap">{v.note}</span>}
              </div>
              {v.photo_url && (
                <a href={v.photo_url} target="_blank" rel="noopener noreferrer">
                  <img src={v.photo_url} alt="" loading="lazy" className="size-16 rounded-md border object-cover" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
      {canDecide && point.status === "flagged" && (
        <MeetingPointDecisionActions
          campaignId={campaignId}
          meetingPointId={point.meeting_point_id}
          trashPoints={cleaned.map((tp) => ({ id: tp.report_id, title: titleById.get(tp.report_id) ?? "" }))}
          isDark={isDark}
        />
      )}
    </div>
  );
}

function Stat({ label, value, isDark }: { label: string; value: string; isDark: boolean }) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-lg border px-3 py-2",
        isDark ? "border-zinc-700 bg-zinc-800/50" : "border-zinc-200 bg-white",
      )}
    >
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}

/**
 * The submission, the totals and result verification (each meeting point with its status, score,
 * Layer 1, trash points and votes): everything the admin decides on. `canDecide` adds Verify /
 * Reject on flagged meeting points.
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
              <span>
                {t("{{n}} flagged meeting point(s) wait for your decision.", { n: flagged })}
              </span>
            )}
          </span>
        </section>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat
          isDark={isDark}
          label={t("Shifts ended")}
          value={`${totals.ended_shifts} / ${totals.active_shifts}`}
        />
        <Stat
          isDark={isDark}
          label={t("Present / registered")}
          value={`${totals.present} / ${totals.registered}`}
        />
        <Stat isDark={isDark} label={t("Bags")} value={String(totals.waste_bags)} />
        <Stat isDark={isDark} label={t("Weight (kg)")} value={String(totals.waste_kg)} />
        <Stat isDark={isDark} label={t("Cleaned")} value={String(submission.counts.cleaned)} />
        <Stat isDark={isDark} label={t("Partly done")} value={String(submission.counts.partial)} />
        <Stat isDark={isDark} label={t("Not handled")} value={String(submission.counts.unhandled)} />
        <Stat isDark={isDark} label={t("Verified meeting points")} value={`${verified} / ${points.length}`} />
      </div>

      <ReviewSectionCard
        title={t("Result verification")}
        hint={t("{{n}} meeting points", { n: points.length })}
        defaultOpen
        isDark={isDark}
      >
        {points.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("No meeting point is being verified.")}</p>
        ) : (
          points.map((point, index) => (
            <div
              key={point.verification_id}
              className={cn(index > 0 && "border-t pt-3", isDark ? "border-zinc-700" : "border-zinc-200")}
            >
              <VerificationMeetingPoint
                campaignId={review.campaign_id}
                point={point}
                index={index}
                canDecide={canDecide}
                isDark={isDark}
              />
            </div>
          ))
        )}
      </ReviewSectionCard>

      <ReviewSectionCard
        title={t("Waste points")}
        hint={t("{{n}} waste points", { n: submission.reports.length })}
        defaultOpen
        isDark={isDark}
      >
        {submission.reports.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("No waste points")}</p>
        ) : (
          submission.reports.map((r, index) => (
            <div
              key={r.report_id}
              className={cn(
                "flex flex-col gap-2",
                index > 0 && "border-t pt-3",
                isDark ? "border-zinc-700" : "border-zinc-200",
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <a
                  href={`/incidents/${r.report_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium underline-offset-2 hover:underline"
                >
                  {r.report?.title || t("Waste point")}
                  <TbExternalLink className="size-3.5" aria-hidden />
                </a>
                <TrashPointResultPill status={r.status} isDark={isDark} />
              </div>
              {r.report?.detail_address && (
                <span className="text-xs text-muted-foreground">{r.report.detail_address}</span>
              )}
              {r.reason && <ReviewRow label={t("Why not handled")} value={r.reason} />}
              {r.layer1 && <Layer1Summary layer1={r.layer1} isDark={isDark} showIssues={false} />}
              <div className="flex flex-wrap gap-6">
                <Photos
                  label={t("Before")}
                  urls={r.before_urls}
                  checks={r.layer1 ? checksByUrl(r.layer1) : undefined}
                  isDark={isDark}
                />
                <Photos
                  label={t("After")}
                  urls={r.after_urls}
                  checks={r.layer1 ? checksByUrl(r.layer1) : undefined}
                  isDark={isDark}
                />
              </div>
            </div>
          ))
        )}
      </ReviewSectionCard>
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
              <div className={cn("flex flex-wrap gap-x-6 gap-y-1 text-sm", muted)}>
                <span>
                  {t("Submitted")}: {formattedDate(review.completion_submitted_at ?? undefined, true)}
                </span>
                <span>
                  {t("Rejected {{n}} of {{max}} times", {
                    n: review.rejection_count,
                    max: review.max_rejections,
                  })}
                </span>
              </div>

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
