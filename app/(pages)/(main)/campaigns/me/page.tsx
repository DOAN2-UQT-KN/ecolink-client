import React from "react";
import { useRouter } from "@/libs/router";
import { useTranslation } from "react-i18next";

import { Breadcrumbs, BreadcrumbItemProps } from "@/components/client/shared/Breadcrumbs";
import { CreateCampaignButton } from "@/components/client/shared/CreateCampaignButton";
import useOrgContextStore from "@/stores/useOrgContextStore";
import { CampaignMeProvider } from "./_context/CampaignMeContext";
import DataTable from "./_components/DataTable";
import { useCampaignCreatorOrganizations } from "@/hooks/useCampaignCreatorOrganizations";

function MyCampaignsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { organizations: creatableOrganizations } = useCampaignCreatorOrganizations();
  const canCreateCampaign = creatableOrganizations.length > 0;
  const activeOrganizationId = useOrgContextStore((s) => s.activeOrganizationId);
  // Limits are per organization: check the active one, or the first one the viewer can use.
  const organizationId =
    creatableOrganizations.find((org) => org.id === activeOrganizationId)?.id ??
    creatableOrganizations[0]?.id;

  const breadcrumbs: BreadcrumbItemProps[] = React.useMemo(
    () => [
      { label: t("Home"), path: "/", type: "link" },
      { label: t("My campaigns"), path: "/campaigns/me", type: "page" },
    ],
    [t],
  );

  const handleCreateCampaign = React.useCallback(() => {
    router.push(
      organizationId
        ? `/campaigns/create?organizationId=${encodeURIComponent(organizationId)}`
        : "/campaigns/create",
    );
  }, [organizationId, router]);

  return (
    <CampaignMeProvider>
      <div>
        <Breadcrumbs breadcrumbs={breadcrumbs} />
        {canCreateCampaign ? (
          <div className="w-full flex items-center justify-end">
            <CreateCampaignButton
              organizationId={organizationId}
              label={t("Add Campaign")}
              onClick={handleCreateCampaign}
            />
          </div>
        ) : null}
        <div className="flex flex-col gap-8 items-start pt-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <DataTable />
        </div>
      </div>
    </CampaignMeProvider>
  );
}

export default MyCampaignsPage;
