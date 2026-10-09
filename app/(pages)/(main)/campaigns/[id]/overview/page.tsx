import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { TbPencil } from "react-icons/tb";

import { useGetCampaignById } from "@/apis/campaign/campaignById";
import { BreadcrumbItemProps } from "@/components/client/shared/Breadcrumbs";
import { Button } from "@/components/client/shared/Button";
import { CampaignStatusTag } from "@/components/ui/CampaignStatusTag";
import { CAMPAIGN_STATUS, canEditCampaign } from "@/constants/campaignLifecycle";
import { useLocalizedDisplay } from "@/hooks/useLocalizedDisplay";
import { Link, useParams, useRouter } from "@/libs/router";
import {
  ApplicationDetailsSkeleton,
  ApplicationPageLayout,
} from "@/components/client/shared/ApplicationPageLayout";

import { CampaignSummary } from "../../create/_components/CampaignSummary";
import { CancelCampaignButton } from "../_components/CancelCampaignButton";
import { campaignToFormValues } from "../../create/_services/campaign.service";

/**
 * A campaign as its organization prepared it, laid out like the review step. Until approval
 * (draft, under review, needs revision) it can be reopened in the wizard, at a given step from
 * each section's "Edit".
 */
export default function CampaignOverviewPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id = "" } = useParams();
  const { title: localizedTitle } = useLocalizedDisplay();
  const { data, isLoading, isError } = useGetCampaignById(id, { enabled: Boolean(id) });
  const campaign = data?.data?.campaign;
  const values = useMemo(() => (campaign ? campaignToFormValues(campaign) : null), [campaign]);

  const title = campaign ? localizedTitle(campaign) : "";
  // `Breadcrumbs` runs every label through `t()` itself, so these stay raw.
  const breadcrumbs: BreadcrumbItemProps[] = [
    { label: "Home", path: "/", type: "link" },
    ...(campaign?.organization
      ? [
          {
            label: campaign.organization.name,
            path: `/organizations/${campaign.organization.slug ?? campaign.organization_id}`,
            type: "link" as const,
          },
        ]
      : []),
    { label: title || "Campaign", path: `/campaigns/${id}/overview`, type: "page" },
  ];

  if (isLoading) {
    return (
      <ApplicationPageLayout breadcrumbs={breadcrumbs}>
        <ApplicationDetailsSkeleton />
      </ApplicationPageLayout>
    );
  }

  if (isError || !campaign || !values) {
    return (
      <ApplicationPageLayout breadcrumbs={breadcrumbs}>
        <div className="flex flex-col items-start gap-2">
          <h2 className="font-display-6 font-semibold !text-button-accent">
            {t("Campaign not found")}
          </h2>
        </div>
      </ApplicationPageLayout>
    );
  }

  const canEdit = canEditCampaign(campaign);
  const editPath = `/campaigns/${campaign.id}/edit`;

  return (
    <ApplicationPageLayout breadcrumbs={breadcrumbs}>
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-display-6 font-semibold !text-button-accent">{title}</h2>
        <CampaignStatusTag status={campaign.status} />
      </div>

      {campaign.reject_reason && (
        <p className="rounded-md border border-amber-500/40 bg-amber-50 p-4 text-sm text-amber-800">
          <span className="font-semibold">{t("Admin reason")}:</span> {campaign.reject_reason}
        </p>
      )}

      <CampaignSummary
        values={values}
        organizationName={campaign.organization?.name}
        suggestedMinPerDay={campaign.suggested_min_volunteers ?? null}
        onEdit={canEdit ? (step) => router.push(`${editPath}?step=${step}`) : undefined}
      />

      {(canEdit || campaign.can_cancel_campaign) && (
        <div className="flex flex-wrap justify-end gap-3 border-t border-[rgba(136,122,71,0.3)] pt-6">
          <CancelCampaignButton campaign={campaign} />
          {canEdit && (
            <Link href={editPath}>
              <Button variant="brown" iconLeft={<TbPencil className="size-5" />}>
                {campaign.status === CAMPAIGN_STATUS.DRAFT
                  ? t("Continue editing")
                  : t("Edit campaign")}
              </Button>
            </Link>
          )}
        </div>
      )}
    </ApplicationPageLayout>
  );
}
