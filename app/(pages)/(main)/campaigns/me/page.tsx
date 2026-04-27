"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { HiOutlinePlusCircle } from "react-icons/hi";

import { Breadcrumbs, BreadcrumbItemProps } from "@/components/client/shared/Breadcrumbs";
import { Button } from "@/components/client/shared/Button";
import { CampaignMeProvider } from "./_context/CampaignMeContext";
import DataTable from "./_components/DataTable";

function MyCampaignsPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const breadcrumbs: BreadcrumbItemProps[] = React.useMemo(
    () => [
      { label: t("Home"), path: "/", type: "link" },
      { label: t("My campaigns"), path: "/campaigns/me", type: "page" },
    ],
    [t],
  );

  const handleCreateCampaign = React.useCallback(() => {
    router.push("/campaigns/create");
  }, [router]);

  return (
    <CampaignMeProvider>
      <div>
        <Breadcrumbs breadcrumbs={breadcrumbs} />
        <div className="w-full flex items-center justify-end">
          <Button
            variant="brown"
            size="medium"
            className="h-[45px]"
            onClick={handleCreateCampaign}
          >
            <div className="flex items-center gap-2">
              <HiOutlinePlusCircle className="h-5 w-5" />
              {t("Add Campaign")}
            </div>
          </Button>
        </div>
        <div className="flex flex-col gap-8 items-start pt-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <DataTable />
        </div>
      </div>
    </CampaignMeProvider>
  );
}

export default MyCampaignsPage;
