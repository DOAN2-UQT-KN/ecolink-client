import { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { TbCircleX } from "react-icons/tb";

import { useRejectCampaign } from "@/apis/campaign/processCampaign";
import { ConfirmPopover } from "@/components/admin/shared/ConfirmPopover";
import { queryClient } from "@/libs/queryClient";
import { cn } from "@/libs/utils";
import { MessageType } from "@/utils/showMessage";

type Props = {
  campaignId: string;
  campaignTitle: string;
  theme: "light" | "dark";
};

export const RejectCampaignCompletionConfirm = memo(
  function RejectCampaignCompletionConfirm({ campaignId, campaignTitle, theme }: Props) {
    const { t } = useTranslation();
    const isDark = theme === "dark";

    const { mutate: reject, isPending } = useRejectCampaign({
      messageSuccess: {
        content: t("Completion request rejected; campaign returned to in review"),
        type: MessageType.Toast,
      },
    });

    const handleConfirm = useCallback(() => {
      return new Promise<void>((resolve, reject_) => {
        reject(campaignId, {
          onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["campaigns"] });
            resolve();
          },
          onError: () => reject_(),
        });
      });
    }, [campaignId, reject]);

    return (
      <ConfirmPopover
        theme={theme}
        title={t("Reject completion request?")}
        description={
          <>
            <span className="font-medium">«{campaignTitle}»</span>
            <span className="mt-2 block">
              {t(
                "The campaign will return to in review. Managers will be notified.",
              )}
            </span>
          </>
        }
        confirmLabel={t("Reject")}
        onConfirm={handleConfirm}
        confirmPending={isPending}
        trigger={
          <button
            type="button"
            title={t("Reject completion request")}
            className={cn(
              "rounded-md border px-1.5 py-1.5 text-xs font-medium transition-colors cursor-pointer duration-200",
              isDark
                ? "border-rose-900 text-rose-300 hover:bg-rose-950/60"
                : "border-rose-300 text-rose-800 hover:bg-rose-50",
            )}
          >
            <TbCircleX className="size-5" />
          </button>
        }
      />
    );
  },
);
