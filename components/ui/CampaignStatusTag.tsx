import { useTranslation } from "react-i18next";

import { CAMPAIGN_STATUS_LABEL } from "@/constants/campaignLifecycle";
import { StatusTag, type StatusTagProps } from "./StatusTag";

/** Status tag with campaign wording (Draft, Pending review, Needs revision, Blocked, Expired). */
export function CampaignStatusTag({ status, ...rest }: Omit<StatusTagProps, "label">) {
  const { t } = useTranslation();
  const label = status != null ? CAMPAIGN_STATUS_LABEL[status] : undefined;
  return <StatusTag status={status} label={label ? t(label) : undefined} {...rest} />;
}

export default CampaignStatusTag;
