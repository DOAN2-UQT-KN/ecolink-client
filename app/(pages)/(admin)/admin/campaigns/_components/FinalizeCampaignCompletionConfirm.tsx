import { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { TbCircleCheck } from "react-icons/tb";

import { useFinalizeCampaignCompletion } from "@/apis/campaign/processCampaign";
import { ConfirmPopover } from "@/components/admin/shared/ConfirmPopover";
import { queryClient } from "@/libs/queryClient";
import { cn } from "@/libs/utils";

type Props = {
  campaignId: string;
  campaignTitle: string;
  theme: "light" | "dark";
};

export const FinalizeCampaignCompletionConfirm = memo(
  function FinalizeCampaignCompletionConfirm({ campaignId, campaignTitle, theme }: Props) {
    const { t } = useTranslation();
    const isDark = theme === "dark";

    const { mutate: finalize, isPending } = useFinalizeCampaignCompletion();

    const handleConfirm = useCallback(() => {
      return new Promise<void>((resolve, reject) => {
        finalize(campaignId, {
          onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["campaigns"] });
            resolve();
          },
          onError: () => reject(),
        });
      });
    }, [campaignId, finalize]);

    return (
      <ConfirmPopover
        theme={theme}
        title={t("Approve campaign completion?")}
        description={
          <>
            <span className="font-medium">«{campaignTitle}»</span>
            <span className="mt-2 block">
              {t(
                "This will mark the campaign as completed, grant rewards, and notify volunteers.",
              )}
            </span>
          </>
        }
        confirmLabel={t("Finalize completion (admin)")}
        onConfirm={handleConfirm}
        confirmPending={isPending}
        trigger={
          <button
            type="button"
            title={t("Finalize completion (admin)")}
            className={cn(
              "rounded-md border px-1.5 py-1.5 text-xs font-medium transition-colors cursor-pointer duration-200",
              isDark
                ? "border-emerald-800 text-emerald-300 hover:bg-emerald-950/80"
                : "border-emerald-300 text-emerald-800 hover:bg-emerald-50",
            )}
          >
            <TbCircleCheck className="size-5" />
          </button>
        }
      />
    );
  },
);
