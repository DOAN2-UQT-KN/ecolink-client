"use client";

import { memo, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { TbCheckbox } from "react-icons/tb";

import { useVerifyCampaign, useRejectCampaign } from "@/apis/campaign/processCampaign";
import { ConfirmPopover } from "@/components/admin/shared/ConfirmPopover";
import { queryClient } from "@/libs/queryClient";
import { cn } from "@/libs/utils";

type Props = {
  campaignId: string;
  campaignTitle: string;
  theme: "light" | "dark";
};

export const VerifyCampaignConfirm = memo(function VerifyCampaignConfirm({
  campaignId,
  campaignTitle,
  theme,
}: Props) {
  const { t } = useTranslation();
  const isDark = theme === "dark";

  const { mutate: verify, isPending: verifying } = useVerifyCampaign();
  const { mutate: reject, isPending: rejecting } = useRejectCampaign();

  const handleVerify = useCallback(() => {
    verify(campaignId, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      },
    });
  }, [campaignId, verify]);

  const handleReject = useCallback(() => {
    reject(campaignId, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      },
    });
  }, [campaignId, reject]);

  return (
    <ConfirmPopover
      theme={theme}
      title={t("Verify this campaign?")}
      description={t("You can verify «{{title}}» or reject it.", { title: campaignTitle })}
      confirmLabel={t("Verify")}
      rejectLabel={t("Reject")}
      onConfirm={handleVerify}
      onReject={handleReject}
      confirmPending={verifying}
      rejectPending={rejecting}
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

export default VerifyCampaignConfirm;
