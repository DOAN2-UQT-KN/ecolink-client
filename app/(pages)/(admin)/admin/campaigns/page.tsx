import { useTranslation } from "react-i18next";
import {
  Breadcrumbs,
  type BreadcrumbItemProps,
} from "@/components/client/shared/Breadcrumbs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUrlTab } from "@/hooks/useUrlTab";

import { CampaignProvider } from "./_context/CampaignContext";
import { FormFilter } from "./_components/FormFilter";
import { DataTable } from "./_components/DataTable";
import { SosTab } from "./sos/_components/SosTab";

const BREADCRUMBS: BreadcrumbItemProps[] = [
  { label: "Dashboard", path: "/admin", type: "link" },
  { label: "Campaigns", path: "/admin/campaigns", type: "page" },
];

const TABS = ["campaigns", "sos"] as const;

export default function AdminCampaignsPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useUrlTab(TABS, "campaigns");

  return (
    <div className="space-y-6">
      <Breadcrumbs breadcrumbs={BREADCRUMBS} isAdmin={true} />

      <Tabs value={tab} onValueChange={setTab} className="gap-4">
        <TabsList className="h-10 border border-border bg-card">
          <TabsTrigger value="campaigns">{t("Campaigns")}</TabsTrigger>
          <TabsTrigger value="sos">{t("SOS")}</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns">
          <CampaignProvider>
            <div className="space-y-4">
              <FormFilter />
              <DataTable />
            </div>
          </CampaignProvider>
        </TabsContent>

        <TabsContent value="sos">
          <SosTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
