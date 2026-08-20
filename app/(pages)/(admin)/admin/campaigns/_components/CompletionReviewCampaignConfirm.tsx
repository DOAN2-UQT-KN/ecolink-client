import { memo, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useReviewCampaignCompletion } from "@/apis/campaign/processCampaign";
import { ConfirmPopover } from "@/components/admin/shared/ConfirmPopover";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/libs/utils";
import { TbClipboardCheck } from "react-icons/tb";
import { queryClient } from "@/libs/queryClient";
import showMessage, { MessageLevel, MessageType } from "@/utils/showMessage";

type Decision = "approve" | "reject";

type Props = {
  campaignId: string;
  campaignTitle: string;
  theme: "light" | "dark";
};

export const CompletionReviewCampaignConfirm = memo(
  function CompletionReviewCampaignConfirm({
    campaignId,
    campaignTitle,
    theme,
  }: Props) {
    const { t } = useTranslation();
    const isDark = theme === "dark";
    const [decision, setDecision] = useState<Decision>("approve");
    const [rejectReason, setRejectReason] = useState("");
    const [rejectReasonError, setRejectReasonError] = useState("");
    const [pending, setPending] = useState(false);

    const { mutateAsync: reviewAsync } = useReviewCampaignCompletion();

    const resetForm = useCallback(() => {
      setDecision("approve");
      setRejectReason("");
      setRejectReasonError("");
    }, []);

    const handleDecisionChange = useCallback((value: string) => {
      if (value !== "approve" && value !== "reject") return;
      setDecision(value);
      if (value === "approve") {
        setRejectReason("");
        setRejectReasonError("");
      }
    }, []);

    const handleConfirm = useCallback(async () => {
      if (decision === "reject") {
        const reason = rejectReason.trim();
        if (!reason) {
          setRejectReasonError(t("Reject reason is required"));
          return false;
        }

        setPending(true);
        try {
          await reviewAsync({
            id: campaignId,
            decision: "reject",
            reject_reason: reason,
          });
          await queryClient.invalidateQueries({ queryKey: ["campaigns"] });
          showMessage({
            type: MessageType.Toast,
            level: MessageLevel.Success,
            title: t(
              "Completion request rejected; campaign returned to active",
            ),
          });
          resetForm();
        } finally {
          setPending(false);
        }
        return;
      }

      setPending(true);
      try {
        await reviewAsync({
          id: campaignId,
          decision: "approve",
        });
        await queryClient.invalidateQueries({ queryKey: ["campaigns"] });
        showMessage({
          type: MessageType.Toast,
          level: MessageLevel.Success,
          title: t("Campaign marked as done successfully"),
        });
        resetForm();
      } finally {
        setPending(false);
      }
    }, [campaignId, decision, rejectReason, resetForm, reviewAsync, t]);

    const handleOpenChange = useCallback(
      (open: boolean) => {
        if (!open) resetForm();
      },
      [resetForm],
    );

    const showRejectReason = decision === "reject";
    const confirmDisabled = showRejectReason && !rejectReason.trim();

    return (
      <ConfirmPopover
        theme={theme}
        title={t("Review campaign completion?")}
        description={t("You can approve or reject completion for {{name}}.", {
          name: campaignTitle,
        })}
        confirmLabel={t("Confirm")}
        cancelLabel={t("Cancel")}
        onConfirm={handleConfirm}
        confirmPending={pending}
        confirmDisabled={confirmDisabled}
        onOpenChange={handleOpenChange}
        extraContent={
          <div className="space-y-4">
            <RadioGroup
              value={decision}
              onValueChange={handleDecisionChange}
              disabled={pending}
              className="flex flex-row items-center gap-10"
            >
              <label
                htmlFor={`completion-decision-approve-${campaignId}`}
                className="flex cursor-pointer items-center gap-2 text-sm"
              >
                <RadioGroupItem
                  value="approve"
                  id={`completion-decision-approve-${campaignId}`}
                />
                {t("Approve")}
              </label>
              <label
                htmlFor={`completion-decision-reject-${campaignId}`}
                className="flex cursor-pointer items-center gap-2 text-sm"
              >
                <RadioGroupItem
                  value="reject"
                  id={`completion-decision-reject-${campaignId}`}
                />
                {t("Reject")}
              </label>
            </RadioGroup>

            {decision === "approve" ? (
              <p
                className={cn(
                  "text-sm",
                  isDark ? "text-zinc-400" : "text-zinc-600",
                )}
              >
                {t(
                  "This will mark the campaign as completed, grant rewards, and notify volunteers.",
                )}
              </p>
            ) : (
              <p
                className={cn(
                  "text-sm",
                  isDark ? "text-zinc-400" : "text-zinc-600",
                )}
              >
                {t(
                  "The campaign will return to active. The organization owner will be notified.",
                )}
              </p>
            )}

            {showRejectReason ? (
              <div className="space-y-2">
                <Label
                  htmlFor={`reject-reason-${campaignId}`}
                  className={cn(isDark ? "text-zinc-200" : "text-zinc-800")}
                >
                  {t("Reject Reason")}{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id={`reject-reason-${campaignId}`}
                  value={rejectReason}
                  onChange={(event) => {
                    setRejectReason(event.target.value);
                    if (rejectReasonError) setRejectReasonError("");
                  }}
                  placeholder={t("Enter reject reason")}
                  maxLength={5000}
                  aria-required
                  aria-invalid={Boolean(rejectReasonError)}
                  disabled={pending}
                  className={cn(
                    "min-h-24",
                    isDark &&
                      "border-zinc-700 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500",
                  )}
                />
                {rejectReasonError ? (
                  <p className="text-sm text-destructive">{rejectReasonError}</p>
                ) : null}
              </div>
            ) : null}
          </div>
        }
        trigger={
          <button
            type="button"
            title={t("Review campaign completion")}
            className={cn(
              "rounded-md border px-1.5 py-1.5 text-xs font-medium transition-colors cursor-pointer duration-200",
              isDark
                  ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-blue-300'
                  : 'border-zinc-300 text-zinc-700 hover:bg-zinc-100 hover:text-blue-700',
            )}
          >
            <TbClipboardCheck className="size-5" />
          </button>
        }
      />
    );
  },
);

export default CompletionReviewCampaignConfirm;
