import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useCompletionReview,
  useReviewCampaignCompletion,
  type CompletionDecision,
} from "@/apis/campaign/processCampaign";
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
import showMessage, { MessageLevel, MessageType } from "@/utils/showMessage";
import { CompletionEvidence } from "./completion/CompletionEvidence";

const REASON_MAX = 5000;

type Props = {
  campaignId: string;
  campaignTitle: string;
  theme: "light" | "dark";
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * The decision form, loaded on first open by `CompletionReviewButton`. Each open mounts a fresh
 * instance (new `key`), so the choice, difficulty and reason start empty every time.
 */
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
  open,
  onOpenChange,
}: Props) {
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const [chosen, setChosen] = useState<CompletionDecision | null>(null);
  const [difficulty, setDifficulty] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const { data, isLoading } = useCompletionReview(campaignId, { enabled: open });
  const review = data?.data;
  const { mutateAsync, isPending } = useReviewCampaignCompletion();
  // Approve only while verification hands the campaign to the admin; otherwise only cancel.
  const decision: CompletionDecision = review?.can_approve ? (chosen ?? "approve") : "cancel";

  const range = review?.difficulty_range ?? { min: 1, max: 4 };
  const levels = Array.from({ length: range.max - range.min + 1 }, (_, i) => range.min + i);
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
    onOpenChange(false);
  };

  const muted = isDark ? "text-zinc-400" : "text-zinc-600";
  const inputDark = isDark && "border-zinc-700 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500";
  const decisions: { value: CompletionDecision; label: string }[] = [
    ...(review?.can_approve ? [{ value: "approve" as const, label: t("Approve") }] : []),
    { value: "cancel", label: t("Cancel campaign") },
  ];

  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
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
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
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
  );
});

export default CompletionReviewDialog;
