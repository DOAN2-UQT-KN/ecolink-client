import { memo, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { TbAlertTriangle, TbClipboardCheck, TbExternalLink } from "react-icons/tb";

import {
  useCompletionReview,
  useReviewCampaignCompletion,
  type CompletionDecision,
  type CompletionReportStatus,
  type ICompletionReview,
} from "@/apis/campaign/processCampaign";
import { ReviewRow, ReviewSectionCard } from "@/components/admin/shared/ReviewSection";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

const STATUS_TONE: Record<CompletionReportStatus, "green" | "amber" | "red"> = {
  cleaned: "green",
  partial: "amber",
  unhandled: "red",
};
/** English labels; translated with `t()`. */
const STATUS_LABEL: Record<CompletionReportStatus, string> = {
  cleaned: "Cleaned",
  partial: "Partly done",
  unhandled: "Not handled",
};

function Photos({ label, urls }: { label: string; urls: string[] }) {
  if (urls.length === 0) return null;
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex flex-wrap gap-2">
        {urls.map((url) => (
          <a key={url} href={url} target="_blank" rel="noopener noreferrer">
            <img
              src={url}
              alt=""
              loading="lazy"
              className="size-20 rounded-md border object-cover"
            />
          </a>
        ))}
      </div>
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

/** The submission, the totals and residents' answers: everything the admin decides on. */
export const CompletionEvidence = memo(function CompletionEvidence({
  review,
  isDark,
}: {
  review: ICompletionReview;
  isDark: boolean;
}) {
  const { t } = useTranslation();
  const { totals, submission, verification } = review;
  const answers = verification.clean_count + verification.not_clean_count;

  return (
    <div className="flex min-w-0 flex-col gap-3">
      {verification.flagged && (
        <section
          role="alert"
          className={cn(
            "flex items-start gap-2 rounded-lg border p-4 text-sm",
            isDark
              ? "border-red-400/40 bg-red-500/10 text-red-200"
              : "border-red-500/40 bg-red-50 text-red-800",
          )}
        >
          <TbAlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden />
          <span>
            <span className="font-semibold">{t("Residents report it is not clean")}</span>{" "}
            {t("{{bad}} of {{total}} answers say not clean (flag from {{ratio}}% of at least {{min}} answers).", {
              bad: verification.not_clean_count,
              total: answers,
              ratio: Math.round(verification.flag_ratio * 100),
              min: verification.flag_min_votes,
            })}
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
        <Stat
          isDark={isDark}
          label={t("Residents: clean / not clean")}
          value={`${verification.clean_count} / ${verification.not_clean_count}`}
        />
      </div>

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
                <Pill tone={STATUS_TONE[r.status]} isDark={isDark}>
                  {t(STATUS_LABEL[r.status])}
                </Pill>
              </div>
              {r.report?.detail_address && (
                <span className="text-xs text-muted-foreground">{r.report.detail_address}</span>
              )}
              {r.reason && <ReviewRow label={t("Why not handled")} value={r.reason} />}
              <div className="flex flex-wrap gap-6">
                <Photos label={t("Before")} urls={r.before_urls} />
                <Photos label={t("After")} urls={r.after_urls} />
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
 * Admin decision on a campaign marked done (spec 5.2), with the evidence: each waste point with its
 * state and photos (or the manager's reason), the totals, residents' answers and the red flag.
 * Approve (settling the difficulty), reject (reason + shifts to complete again; locked after 3
 * rejections) or cancel (reason). No partial approval.
 */
export const CompletionReviewDialog = memo(function CompletionReviewDialog({
  campaignId,
  campaignTitle,
  theme,
}: Props) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const [open, setOpen] = useState(false);
  const [decision, setDecision] = useState<CompletionDecision>("approve");
  const [difficulty, setDifficulty] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [shiftIds, setShiftIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");

  const { data, isLoading } = useCompletionReview(campaignId, { enabled: open });
  const review = data?.data;
  const { mutateAsync, isPending } = useReviewCampaignCompletion();

  const reset = useCallback(() => {
    setDecision("approve");
    setDifficulty(null);
    setReason("");
    setShiftIds(new Set());
    setError("");
  }, []);

  const levels = useMemo(() => {
    const range = review?.difficulty_range ?? { min: 1, max: 4 };
    return Array.from({ length: range.max - range.min + 1 }, (_, i) => range.min + i);
  }, [review?.difficulty_range]);
  const shifts = (review?.shifts ?? []).filter((s) => s.has_result);
  const chosenDifficulty = difficulty ?? review?.difficulty ?? null;

  const onConfirm = async () => {
    if (!review) return;
    const text = reason.trim();
    if (decision !== "approve" && !text) {
      setError(t("A reason is required"));
      return;
    }
    if (decision === "reject" && shiftIds.size === 0) {
      setError(t("Pick at least one shift to complete again"));
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
      ...(decision === "reject" ? { shift_ids: [...shiftIds] } : {}),
    });
    await queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    showMessage({
      type: MessageType.Toast,
      level: MessageLevel.Success,
      title:
        decision === "approve"
          ? t("Campaign marked as done successfully")
          : decision === "reject"
            ? t("Completion request rejected; campaign returned to active")
            : t("Campaign cancelled"),
    });
    reset();
    setOpen(false);
  };

  const muted = isDark ? "text-zinc-400" : "text-zinc-600";
  const inputDark = isDark && "border-zinc-700 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500";
  const decisions: { value: CompletionDecision; label: string; disabled?: boolean }[] = [
    { value: "approve", label: t("Approve") },
    { value: "reject", label: t("Reject"), disabled: review ? !review.can_reject : false },
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

              <CompletionEvidence review={review} isDark={isDark} />

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
                    setDecision(value as CompletionDecision);
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
                        d.disabled && "cursor-not-allowed opacity-50",
                      )}
                    >
                      <RadioGroupItem
                        value={d.value}
                        id={`completion-${d.value}-${campaignId}`}
                        disabled={d.disabled}
                      />
                      {d.label}
                    </label>
                  ))}
                </RadioGroup>
                {!review.can_reject && (
                  <p className={cn("text-xs", muted)}>
                    {t("Already rejected {{max}} times: approve or cancel the campaign.", {
                      max: review.max_rejections,
                    })}
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

                {decision === "reject" && (
                  <div className="flex flex-col gap-2">
                    <p className={cn("text-sm", muted)}>
                      {t(
                        "The campaign returns to running; the shifts you pick go back to awaiting result until their result is saved again. Owners and managers are told.",
                      )}
                    </p>
                    <Label className={cn(isDark ? "text-zinc-200" : "text-zinc-800")}>
                      {t("Shifts to complete again")} <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex flex-col gap-1.5">
                      {shifts.map((s) => (
                        <label key={s.shift_id} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={shiftIds.has(s.shift_id)}
                            disabled={isPending}
                            onCheckedChange={(v) =>
                              setShiftIds((prev) => {
                                const next = new Set(prev);
                                if (v) next.add(s.shift_id);
                                else next.delete(s.shift_id);
                                return next;
                              })
                            }
                          />
                          {s.meeting_point_name} · {format(new Date(s.start_at), "dd/MM HH:mm")}–
                          {format(new Date(s.end_at), "HH:mm")}
                        </label>
                      ))}
                    </div>
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
              {decision === "approve"
                ? t("Approve")
                : decision === "reject"
                  ? t("Reject")
                  : t("Cancel campaign")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});

export default CompletionReviewDialog;
