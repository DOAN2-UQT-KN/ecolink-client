import { useTranslation } from "react-i18next";

import { useParams, useSearchParams } from "@/libs/router";
import { useGetCampaignById } from "@/apis/campaign/campaignById";
import { Skeleton } from "@/components/ui/skeleton";
import { CAMPAIGN_EDITABLE_STATUSES } from "@/constants/campaignLifecycle";

import CampaignForm from "../../create/_components/CampaignForm";
import { CampaignProvider } from "../../create/_context/CampaignContext";
import {
  CAMPAIGN_STEPS,
  type CampaignStep,
} from "../../create/_services/campaignSteps.service";

/**
 * Edit a campaign until it starts: before approval (draft, under review, needs revision) or once
 * approved and upcoming (spec 3.5, edited in place by id).
 */
export default function EditCampaignPage() {
  const { t } = useTranslation();
  const { id = "" } = useParams();
  const step = useSearchParams().get("step");
  const initialStep = CAMPAIGN_STEPS.includes(step as CampaignStep)
    ? (step as CampaignStep)
    : undefined;
  const { data, isLoading, isError } = useGetCampaignById(id, { enabled: Boolean(id) });
  const campaign = data?.data?.campaign;

  if (isLoading) {
    return <Skeleton className="h-[480px] w-full rounded-[10px]" />;
  }
  if (isError || !campaign) {
    return <p className="py-10 text-center">{t("Campaign not found")}</p>;
  }
  if (!campaign.can_manage_campaign || !CAMPAIGN_EDITABLE_STATUSES.includes(campaign.status ?? -1)) {
    return (
      <p className="py-10 text-center">
        {t("This campaign can no longer be edited here")}
      </p>
    );
  }

  return (
    <CampaignProvider key={campaign.id} campaign={campaign} initialStep={initialStep}>
      <CampaignForm />
    </CampaignProvider>
  );
}
