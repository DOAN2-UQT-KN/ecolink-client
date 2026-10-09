import { memo, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { TbBan, TbCheckbox } from "react-icons/tb";

import { useReviewCampaign } from "@/apis/campaign/reviewCampaign";
import type { CampaignReviewDecision } from "@/apis/campaign/models/lifecycle";
import { ConfirmPopover } from "@/components/ui/ConfirmPopover";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/libs/utils";
import showMessage, { MessageLevel, MessageType } from "@/utils/showMessage";

type Mode = "review" | "ban";

type Props = {
  campaignId: string;
  campaignTitle: string;
  theme: "light" | "dark";
  /** "review": a campaign waiting for review; "ban": a running campaign. */
  mode?: Mode;
};

const SUCCESS: Record<CampaignReviewDecision, string> = {
  approve: "Campaign approved",
  request_revision: "Changes requested",
  block: "Campaign rejected",
};

export const ReviewCampaignConfirm = memo(function ReviewCampaignConfirm({
  campaignId,
  campaignTitle,
  theme,
  mode = "review",
}: Props) {
  const { t } = useTranslation();
  const isBanMode = mode === "ban";
  const [decision, setDecision] = useState<CampaignReviewDecision>(
    isBanMode ? "block" : "approve",
  );
  const [reason, setReason] = useState("");

  const { mutateAsync: reviewAsync, isPending } = useReviewCampaign();

  const resetForm = useCallback(() => {
    setDecision(isBanMode ? "block" : "approve");
    setReason("");
  }, [isBanMode]);

  const needsReason = decision !== "approve";
  const confirmDisabled = needsReason ? !reason.trim() : false;

  const handleConfirm = useCallback(async () => {
    try {
      await reviewAsync({
        id: campaignId,
        decision,
        reason: needsReason ? reason.trim() : null,
      });
      showMessage({
        type: MessageType.Toast,
        level: MessageLevel.Success,
        title: t(isBanMode ? "Campaign banned successfully" : SUCCESS[decision]),
      });
      resetForm();
    } catch {
      // usePost surfaces API errors.
      return false;
    }
  }, [campaignId, decision, isBanMode, needsReason, reason, resetForm, reviewAsync, t]);

  const isDark = theme === "dark";

  return (
    <ConfirmPopover
      theme={theme}
      title={isBanMode ? t("Ban this campaign?") : t("Review campaign")}
      description={
        isBanMode
          ? t("This will ban {{name}}.", { name: campaignTitle })
          : t("Approve {{name}}, ask for changes, or reject it.", { name: campaignTitle })
      }
      confirmLabel={t("Confirm")}
      cancelLabel={t("Cancel")}
      onConfirm={handleConfirm}
      confirmPending={isPending}
      confirmDisabled={confirmDisabled}
      onOpenChange={(next) => {
        if (!next) resetForm();
      }}
      extraContent={
        <div className="space-y-4">

          {!isBanMode && (
            <RadioGroup
              value={decision}
              onValueChange={(value) => setDecision(value as CampaignReviewDecision)}
              disabled={isPending}
              className="flex flex-wrap items-center gap-6"
            >
              {(
                [
                  ["approve", t("Approve")],
                  ["request_revision", t("Request changes")],
                  ["block", t("Reject")],
                ] as const
              ).map(([value, label]) => (
                <label
                  key={value}
                  htmlFor={`campaign-review-${value}-${campaignId}`}
                  className="flex cursor-pointer items-center gap-2 text-sm"
                >
                  <RadioGroupItem value={value} id={`campaign-review-${value}-${campaignId}`} />
                  {label}
                  {value === "block" && (
                    <InfoTooltip
                      content={t(
                        "Rejecting is permanent and only for violations. Use Request changes for fixable problems.",
                      )}
                    />
                  )}
                </label>
              ))}
            </RadioGroup>
          )}

          {needsReason && (
            <div className="space-y-2">
              <Label
                htmlFor={`review-reason-${campaignId}`}
                className={cn(isDark ? "text-zinc-200" : "text-zinc-800")}
              >
                {t("Reason")} <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id={`review-reason-${campaignId}`}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder={
                  decision === "request_revision"
                    ? t("What should the organization change?")
                    : isBanMode
                      ? t("Enter ban reason")
                      : t("Enter rejection reason")
                }
                maxLength={5000}
                aria-required
                disabled={isPending}
                className={cn(
                  "min-h-24",
                  isDark && "border-zinc-700 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500",
                )}
              />
            </div>
          )}
        </div>
      }
      trigger={
        <button
          type="button"
          title={isBanMode ? t("Banned") : t("Review campaign")}
          className={cn(
            "rounded-md border px-1.5 py-1.5 text-xs font-medium transition-colors cursor-pointer duration-200",
            isDark
              ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              : "border-zinc-300 text-zinc-700 hover:bg-zinc-100",
            isBanMode
              ? isDark
                ? "hover:text-red-300"
                : "hover:text-red-700"
              : isDark
                ? "hover:text-green-200"
                : "hover:text-green-700",
          )}
        >
          {isBanMode ? <TbBan className="size-5" /> : <TbCheckbox className="size-5" />}
        </button>
      }
    />
  );
});

export default ReviewCampaignConfirm;
