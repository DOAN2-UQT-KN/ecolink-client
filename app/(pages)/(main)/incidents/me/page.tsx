"use client";
import React from "react";
import DataTable from "./_components/DataTable";
import StatsCards from "./_components/StatsCards";
import {
  Breadcrumbs,
  BreadcrumbItemProps,
} from "@/components/client/shared/Breadcrumbs";
import { useTranslation } from "react-i18next";
import { IncidentMeProvider } from "./_context/IncidentMeContext";
import { Button } from "@/components/client/shared/Button";
import { useRouter } from "next/navigation";
import { HiOutlinePlusCircle } from "react-icons/hi";

function MyIncidentsPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const breadcrumbs: BreadcrumbItemProps[] = React.useMemo(
    () => [
      { label: t("Home"), path: "/", type: "link" },
      { label: t("My incidents"), path: "/incidents/me", type: "page" },
    ],
    [t],
  );

  const handleCreateReport = React.useCallback(() => {
    router.push("/incidents/create");
  }, [router]);

  return (
    <IncidentMeProvider>
      <div className="">
        <Breadcrumbs breadcrumbs={breadcrumbs} />

        <div className="w-full flex items-center justify-end">
          <Button
            variant="brown"
            size="medium"
            className="h-[45px]"
            onClick={handleCreateReport}
          >
            <div className="flex items-center gap-2">
              <HiOutlinePlusCircle className="h-5 w-5" />
              {t("Add Report")}
            </div>
          </Button>
        </div>
        <div className="flex flex-col gap-8 items-start pt-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <StatsCards />
          <DataTable />
        </div>
      </div>
    </IncidentMeProvider>
  );
}

export default MyIncidentsPage;
