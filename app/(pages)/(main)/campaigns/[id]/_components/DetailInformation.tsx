"use client";

import { memo } from "react";
import { useTranslation } from "react-i18next";
import { TbArrowRight } from "react-icons/tb";

import { Button } from "@/components/client/shared/Button";
import { Progress } from "@/components/ui/progress";
import { RichTextContent } from "@/components/ui/RichTextContent";

import { useCampaignDetail } from "../_hooks/useCampaignDetail";

export const DetailInformation = memo(function DetailInformation() {
  const { t } = useTranslation("common");
  const {
    campaign,
    currentMembers,
    maxMembers,
    memberProgress,
    handleJoinCampaign,
  } = useCampaignDetail();

  if (!campaign) {
    return null;
  }

  return (
    <div className="space-y-6 rounded-xl border border-[rgba(136,122,71,0.4)] bg-white/60 p-5 sm:p-6 shadow-sm">
      <div>
        <h2 className="font-display-6 font-semibold text-button-accent mb-3">
          {t("Description")}
        </h2>
        <RichTextContent
          value={campaign.description}
          className="!font-display-1 text-foreground-secondary"
          maxLines={8}
          showMoreLabel={t("See more")}
          showLessLabel={t("See less")}
          emptyFallback={
            <span className="font-display-1 text-foreground-secondary">
              {t("No description available.")}
            </span>
          }
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between font-display-1 text-button-accent">
          <span>{t("Member enrollment")}</span>
          <span>
            {currentMembers} / {maxMembers > 0 ? maxMembers : "—"}
          </span>
        </div>
        <Progress
          value={memberProgress}
          className="h-2.5 bg-button-accent/10 [&>[data-slot=progress-indicator]]:bg-button-accent"
        />
      </div>

      <div>
        <Button
          type="button"
          variant="brown"
          size="medium"
          className="min-w-[200px]"
          iconRight={<TbArrowRight className="size-4" aria-hidden />}
          onClick={handleJoinCampaign}
        >
          {t("Join campaign")}
        </Button>
      </div>
    </div>
  );
});
