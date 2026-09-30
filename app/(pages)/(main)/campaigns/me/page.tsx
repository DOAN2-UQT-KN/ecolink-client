import React from "react";
import { useTranslation } from "react-i18next";

import { Breadcrumbs, BreadcrumbItemProps } from "@/components/client/shared/Breadcrumbs";
import { CampaignMeProvider } from "./_context/CampaignMeContext";
import DataTable from "./_components/DataTable";

/** Campaigns the viewer runs or joined. New campaigns start from the organization's page. */
function MyCampaignsPage() {
  const { t } = useTranslation();

  const breadcrumbs: BreadcrumbItemProps[] = React.useMemo(
    () => [
      { label: t("Home"), path: "/", type: "link" },
      { label: t("My campaigns"), path: "/campaigns/me", type: "page" },
    ],
    [t],
  );

  return (
    <CampaignMeProvider>
      <div>
        <Breadcrumbs breadcrumbs={breadcrumbs} />
        <div className="flex flex-col gap-8 items-start pt-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <DataTable />
        </div>
      </div>
    </CampaignMeProvider>
  );
}

export default MyCampaignsPage;
