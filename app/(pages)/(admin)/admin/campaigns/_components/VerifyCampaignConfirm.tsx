import { memo, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useVerifyCampaign } from "@/apis/campaign/processCampaign";
import { ConfirmPopover } from "@/components/admin/shared/ConfirmPopover";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/libs/utils";
import { TbBan, TbCheckbox } from "react-icons/tb";
import { STATUS } from "@/constants/status";
import { queryClient } from "@/libs/queryClient";
import showMessage, { MessageLevel, MessageType } from "@/utils/showMessage";

type Decision = "approve" | "ban";
type Mode = "verify" | "ban";

type Props = {
  campaignId: string;
  campaignTitle: string;
  theme: "light" | "dark";
  mode?: Mode;
};

export const VerifyCampaignConfirm = memo(function VerifyCampaignConfirm({
  campaignId,
  campaignTitle,
  theme,
  mode = "verify",
}: Props) {
  const { t } = useTranslation();
  const isBanMode = mode === "ban";
  const [decision, setDecision] = useState<Decision>(isBanMode ? "ban" : "approve");
  const [banReason, setBanReason] = useState("");
  const [banReasonError, setBanReasonError] = useState("");
  const [pending, setPending] = useState(false);

  const { mutateAsync: verifyAsync } = useVerifyCampaign({
    queryKey: ["campaigns"],
    messageSuccess: { type: MessageType.Toast },
  });

  const resetForm = useCallback(() => {
    setDecision(isBanMode ? "ban" : "approve");
    setBanReason("");
    setBanReasonError("");
  }, [isBanMode]);

  const handleDecisionChange = useCallback((value: string) => {
    if (value !== "approve" && value !== "ban") return;
    setDecision(value);
    if (value === "approve") {
      setBanReason("");
      setBanReasonError("");
    }
  }, []);

  const handleConfirm = useCallback(async () => {
    const shouldBan = isBanMode || decision === "ban";
    if (shouldBan) {
      const reason = banReason.trim();
      if (!reason) {
        setBanReasonError(t("Ban reason is required"));
        return false;
      }

      setPending(true);
      try {
        await verifyAsync({
          id: campaignId,
          status: STATUS.INACTIVE,
          reject_reason: reason,
        });
        await queryClient.invalidateQueries({ queryKey: ["campaigns"] });
        showMessage({
          type: MessageType.Toast,
          level: MessageLevel.Success,
          title: t("Campaign banned successfully"),
        });
        resetForm();
      } finally {
        setPending(false);
      }
      return;
    }

    setPending(true);
    try {
      await verifyAsync({
        id: campaignId,
        status: STATUS.ACTIVE,
      });
      await queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      showMessage({
        type: MessageType.Toast,
        level: MessageLevel.Success,
        title: t("Campaign verified successfully"),
      });
      resetForm();
    } finally {
      setPending(false);
    }
  }, [banReason, campaignId, decision, isBanMode, resetForm, t, verifyAsync]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) resetForm();
    },
    [resetForm],
  );

  const isDark = theme === "dark";
  const showBanReason = isBanMode || decision === "ban";
  const confirmDisabled = showBanReason && !banReason.trim();

  return (
    <ConfirmPopover
      theme={theme}
      title={isBanMode ? t("Ban this campaign?") : t("Verify Campaign")}
      description={
        isBanMode
          ? t("This will ban {{name}}.", { name: campaignTitle })
          : t("You can verify {{name}} or ban it.", { name: campaignTitle })
      }
      confirmLabel={t("Confirm")}
      cancelLabel={t("Cancel")}
      onConfirm={handleConfirm}
      confirmPending={pending}
      confirmDisabled={confirmDisabled}
      onOpenChange={handleOpenChange}
      extraContent={
        <div className="space-y-4">
          {!isBanMode ? (
            <RadioGroup
              value={decision}
              onValueChange={handleDecisionChange}
              disabled={pending}
              className="flex flex-row items-center gap-10"
            >
              <label
                htmlFor={`campaign-decision-approve-${campaignId}`}
                className="flex cursor-pointer items-center gap-2 text-sm"
              >
                <RadioGroupItem
                  value="approve"
                  id={`campaign-decision-approve-${campaignId}`}
                />
                {t("Verify")}
              </label>
              <label
                htmlFor={`campaign-decision-ban-${campaignId}`}
                className="flex cursor-pointer items-center gap-2 text-sm"
              >
                <RadioGroupItem
                  value="ban"
                  id={`campaign-decision-ban-${campaignId}`}
                />
                {t("Ban")}
              </label>
            </RadioGroup>
          ) : null}

          {showBanReason ? (
            <div className="space-y-2">
              <Label
                htmlFor={`ban-reason-${campaignId}`}
                className={cn(isDark ? "text-zinc-200" : "text-zinc-800")}
              >
                {t("Ban Reason")} <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id={`ban-reason-${campaignId}`}
                value={banReason}
                onChange={(event) => {
                  setBanReason(event.target.value);
                  if (banReasonError) setBanReasonError("");
                }}
                placeholder={t("Enter ban reason")}
                maxLength={5000}
                aria-required
                aria-invalid={Boolean(banReasonError)}
                disabled={pending}
                className={cn(
                  "min-h-24",
                  isDark &&
                    "border-zinc-700 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500",
                )}
              />
              {banReasonError ? (
                <p className="text-sm text-destructive">{banReasonError}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      }
      trigger={
        <button
          type="button"
          title={isBanMode ? t("Banned") : t("Verify")}
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

export default VerifyCampaignConfirm;
