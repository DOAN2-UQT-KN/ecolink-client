import { memo } from "react";
import { useTranslation } from "react-i18next";
import { HiOutlinePlusCircle } from "react-icons/hi";

import { Button } from "@/components/client/shared/Button";
import { useGetCreateEligibility } from "@/apis/campaign/getCreateEligibility";
import { CAMPAIGN_CREATE_BLOCK_REASON_LABEL } from "@/constants/campaignLifecycle";

/**
 * "Create campaign" for one organization (spec 1.1): hidden for org admins and plain members,
 * disabled with the reason when the organization is locked or over a limit.
 */
export const CreateCampaignButton = memo(function CreateCampaignButton({
  organizationId,
  label,
  onClick,
}: {
  organizationId: string | undefined;
  label: string;
  onClick: () => void;
}) {
  const { t } = useTranslation();
  const { data, isLoading } = useGetCreateEligibility(organizationId);
  const eligibility = data?.data?.eligibility;

  if (!organizationId || isLoading || !eligibility || eligibility.hidden) return null;

  const reasons = eligibility.reasons
    .filter((r) => r !== "NO_PERMISSION")
    .map((r) => t(CAMPAIGN_CREATE_BLOCK_REASON_LABEL[r] ?? r));

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="brown"
        size="medium"
        className="h-[45px]"
        iconLeft={<HiOutlinePlusCircle className="size-5" />}
        isDisabled={!eligibility.can_create}
        onClick={onClick}
      >
        {label}
      </Button>
      {!eligibility.is_verified && (
        <span className="text-xs font-medium text-amber-700">{t("Unverified organization")}</span>
      )}
      {!eligibility.can_create && (
        <span className="max-w-[360px] text-right text-xs text-foreground-tertiary">
          {reasons.join(" · ")}
        </span>
      )}
    </div>
  );
});

export default CreateCampaignButton;
