"use client";

import React from "react";
import DataTable from "./_components/DataTable";
import {
  Breadcrumbs,
  BreadcrumbItemProps,
} from "@/components/client/shared/Breadcrumbs";
import { useTranslation } from "react-i18next";
import { OrganizationMeProvider } from "./_context/OrganizationMeContext";
import { Button } from "@/components/client/shared/Button";
import { useRouter } from "next/navigation";
import { HiOutlinePlusCircle } from "react-icons/hi";

function MyOrganizationsPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const breadcrumbs: BreadcrumbItemProps[] = React.useMemo(
    () => [
      { label: t("Home"), path: "/", type: "link" },
      {
        label: t("My organizations"),
        path: "/organizations/me",
        type: "page",
      },
    ],
    [t],
  );

  const handleCreateOrganization = React.useCallback(() => {
    router.push("/organizations/create");
  }, [router]);

  return (
    <OrganizationMeProvider>
      <div className="">
        <Breadcrumbs breadcrumbs={breadcrumbs} />

        <div className="w-full flex items-center justify-end">
          <Button
            variant="brown"
            size="medium"
            className="h-[45px]"
            onClick={handleCreateOrganization}
          >
            <div className="flex items-center gap-2">
              <HiOutlinePlusCircle className="h-5 w-5" />
              {t("Add Organization")}
            </div>
          </Button>
        </div>
        <div className="flex flex-col gap-8 items-start pt-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <DataTable />
        </div>
      </div>
    </OrganizationMeProvider>
  );
}

export default MyOrganizationsPage;
