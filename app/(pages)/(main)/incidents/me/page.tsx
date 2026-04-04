"use client";
import DataTable from "./_components/DataTable";
import InforCards from "./_components/InforCards";
import {
  Breadcrumbs,
  BreadcrumbItemProps,
} from "@/components/shared/Breadcrumbs";
import { useTranslation } from "react-i18next";
import { IncidentMeProvider } from "./_context/IncidentMeContext";

function MyIncidentsPage() {
  const { t } = useTranslation();

  const breadcrumbs: BreadcrumbItemProps[] = [
    { label: t("Home"), path: "/", type: "link" },
    { label: t("My incidents"), path: "/incidents/me", type: "page" },
  ];

  return (
    <IncidentMeProvider>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <Breadcrumbs breadcrumbs={breadcrumbs} />

        <div className="flex flex-col gap-8 items-start pt-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <InforCards />
          <DataTable />
        </div>
      </div>
    </IncidentMeProvider>
  );
}

export default MyIncidentsPage;
