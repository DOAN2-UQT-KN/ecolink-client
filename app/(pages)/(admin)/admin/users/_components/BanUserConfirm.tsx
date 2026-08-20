import { memo, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useBanUser } from "@/apis/user/banUser";
import { ConfirmPopover } from "@/components/admin/shared/ConfirmPopover";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/libs/utils";
import { TbBan } from "react-icons/tb";
import { queryClient } from "@/libs/queryClient";
import showMessage, { MessageLevel, MessageType } from "@/utils/showMessage";

type Props = {
  userId: string;
  userName: string;
  theme: "light" | "dark";
};

export const BanUserConfirm = memo(function BanUserConfirm({
  userId,
  userName,
  theme,
}: Props) {
  const { t } = useTranslation();
  const [banReason, setBanReason] = useState("");
  const [banReasonError, setBanReasonError] = useState("");
  const [pending, setPending] = useState(false);

  const { mutateAsync: banAsync } = useBanUser({
    queryKey: ["users"],
    messageSuccess: { type: MessageType.Toast },
  });

  const resetForm = useCallback(() => {
    setBanReason("");
    setBanReasonError("");
  }, []);

  const handleConfirm = useCallback(async () => {
    const reason = banReason.trim();
    if (!reason) {
      setBanReasonError(t("Ban reason is required"));
      return false;
    }

    setPending(true);
    try {
      await banAsync({
        id: userId,
        reject_reason: reason,
      });
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      showMessage({
        type: MessageType.Toast,
        level: MessageLevel.Success,
        title: t("User banned successfully"),
      });
      resetForm();
    } finally {
      setPending(false);
    }
  }, [banAsync, banReason, resetForm, t, userId]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) resetForm();
    },
    [resetForm],
  );

  const isDark = theme === "dark";
  const confirmDisabled = !banReason.trim();

  return (
    <ConfirmPopover
      theme={theme}
      title={t("Ban this user?")}
      description={t("This will ban {{name}}.", { name: userName })}
      confirmLabel={t("Confirm")}
      cancelLabel={t("Cancel")}
      onConfirm={handleConfirm}
      confirmPending={pending}
      confirmDisabled={confirmDisabled}
      onOpenChange={handleOpenChange}
      extraContent={
        <div className="space-y-2">
          <Label
            htmlFor={`ban-reason-${userId}`}
            className={cn(isDark ? "text-zinc-200" : "text-zinc-800")}
          >
            {t("Reject Reason")} <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id={`ban-reason-${userId}`}
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
      }
      trigger={
        <button
          type="button"
          title={t("Ban")}
          className={cn(
            "rounded-md border px-1.5 py-1.5 text-xs font-medium transition-colors cursor-pointer duration-200",
            isDark
              ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-red-300"
              : "border-zinc-300 text-zinc-700 hover:bg-zinc-100 hover:text-red-700",
          )}
        >
          <TbBan className="size-5" />
        </button>
      }
    />
  );
});

export default BanUserConfirm;
