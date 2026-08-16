import { memo, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useVerifyOrganization,
} from "@/apis/organization/organizationById";
import { ConfirmPopover } from "@/components/admin/shared/ConfirmPopover";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/libs/utils";
import { TbCheckbox } from "react-icons/tb";
import { STATUS } from "@/constants/status";
import { queryClient } from "@/libs/queryClient";

type Decision = "approve" | "reject";

type Props = {
  organizationId: string;
  organizationName: string;
  theme: "light" | "dark";
};

export const ApproveOrganizationConfirm = memo(function ApproveOrganizationConfirm({
  organizationId,
  organizationName,
  theme,
}: Props) {
  const { t } = useTranslation();
  const [decision, setDecision] = useState<Decision>("approve");
  const [rejectReason, setRejectReason] = useState("");
  const [rejectReasonError, setRejectReasonError] = useState("");
  const [pending, setPending] = useState(false);

  const { mutateAsync: verifyAsync } = useVerifyOrganization({
    queryKey: ["organizations"],
  });

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
        await verifyAsync({
          id: organizationId,
          status: STATUS.INACTIVE,
          reject_reason: reason,
        });
        await queryClient.invalidateQueries({ queryKey: ["organizations"] });
        resetForm();
      } finally {
        setPending(false);
      }
      return;
    }

    setPending(true);
    try {
      await verifyAsync({
        id: organizationId,
        status: STATUS.ACTIVE,
      });
      await queryClient.invalidateQueries({ queryKey: ["organizations"] });
      resetForm();
    } finally {
      setPending(false);
    }
  }, [decision, organizationId, rejectReason, resetForm, t, verifyAsync]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) resetForm();
    },
    [resetForm],
  );

  const isDark = theme === "dark";
  const confirmDisabled = decision === "reject" && !rejectReason.trim();

  return (
    <ConfirmPopover
      theme={theme}
      title={t("Verify Organization")}
      description={t("You can approve {{name}} or reject it.", {
        name: organizationName,
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
              htmlFor={`org-decision-approve-${organizationId}`}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <RadioGroupItem
                value="approve"
                id={`org-decision-approve-${organizationId}`}
              />
              {t("Approve")}
            </label>
            <label
              htmlFor={`org-decision-reject-${organizationId}`}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <RadioGroupItem
                value="reject"
                id={`org-decision-reject-${organizationId}`}
              />
              {t("Reject")}
            </label>
          </RadioGroup>

          {decision === "reject" ? (
            <div className="space-y-2">
              <Label
                htmlFor={`reject-reason-${organizationId}`}
                className={cn(isDark ? "text-zinc-200" : "text-zinc-800")}
              >
                {t("Reject Reason")} <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id={`reject-reason-${organizationId}`}
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
          className={cn(
            "rounded-md border px-1.5 py-1.5 text-xs font-medium transition-colors cursor-pointer duration-200",
            isDark
              ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-green-200"
              : "border-zinc-300 text-zinc-700 hover:bg-zinc-100 hover:text-green-700",
          )}
        >
          <TbCheckbox className="size-5" />
        </button>
      }
    />
  );
});

export default ApproveOrganizationConfirm;
