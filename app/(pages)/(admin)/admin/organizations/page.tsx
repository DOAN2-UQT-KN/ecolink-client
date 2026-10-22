import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Breadcrumbs,
  type BreadcrumbItemProps,
} from "@/components/client/shared/Breadcrumbs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUrlTab } from "@/hooks/useUrlTab";

import { OrganizationProvider } from "./_context/OrganizationContext";
import { FormFilter } from "./_components/FormFilter";
import { DataTable } from "./_components/DataTable";
import { ApplicationsTab } from "./applications/_components/ApplicationsTab";

const TABS = ["organizations", "applications"] as const;

export default function AdminOrganizationsPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useUrlTab(TABS, "organizations");
  const breadcrumbs: BreadcrumbItemProps[] = useMemo(
    () => [
      { label: "Dashboard", path: "/admin", type: "link" },
      { label: "Organizations", path: "/admin/organizations", type: "page" },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <Breadcrumbs breadcrumbs={breadcrumbs} isAdmin={true} />

      <Tabs value={tab} onValueChange={setTab} className="gap-4">
        <TabsList className="h-10 border border-border bg-card">
          <TabsTrigger value="organizations">{t("Organizations")}</TabsTrigger>
          <TabsTrigger value="applications">{t("Organization applications")}</TabsTrigger>
        </TabsList>

        <TabsContent value="organizations">
          <OrganizationProvider>
            <div className="space-y-4">
              <FormFilter />
              <DataTable />
            </div>
          </OrganizationProvider>
        </TabsContent>

        <TabsContent value="applications">
          <ApplicationsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
