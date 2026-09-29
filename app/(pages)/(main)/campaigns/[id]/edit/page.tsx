import { useTranslation } from "react-i18next";

import { useParams } from "@/libs/router";
import { useGetCampaignById } from "@/apis/campaign/campaignById";
import { Skeleton } from "@/components/ui/skeleton";
import { CAMPAIGN_EDITABLE_STATUSES } from "@/constants/campaignLifecycle";

import CampaignForm from "../../create/_components/CampaignForm";
import { CampaignProvider } from "../../create/_context/CampaignContext";

/** Edit a campaign before approval: draft, under review, or waiting for changes. */
export default function EditCampaignPage() {
  const { t } = useTranslation();
  const { id = "" } = useParams();
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
    <CampaignProvider key={campaign.id} campaign={campaign}>
      <CampaignForm />
    </CampaignProvider>
  );
}
