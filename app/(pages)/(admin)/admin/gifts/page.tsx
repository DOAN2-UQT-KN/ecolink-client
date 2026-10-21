import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Breadcrumbs,
  type BreadcrumbItemProps,
} from "@/components/client/shared/Breadcrumbs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { IGift } from "@/apis/gift/models/gift";
import { GiftProvider } from "./_context/GiftContext";
import { FormFilter } from "./_components/FormFilter";
import { DataTable } from "./_components/DataTable";
import { GiftFormDialog } from "./_components/GiftFormDialog";
import { RedeemsTable } from "./_components/RedeemsTable";
import { CreateButton } from "./_components/CreateButton";
import { GiftSourcesTab } from "./sources/_components/GiftSourcesTab";
import { useUrlTab } from "@/hooks/useUrlTab";

const TABS = ["catalog", "sources", "redeems"] as const;

function GiftsContent() {
  const { t } = useTranslation();
  const [createOpen, setCreateOpen] = useState(false);
  const [createSourceOpen, setCreateSourceOpen] = useState(false);
  const [editGift, setEditGift] = useState<IGift | null>(null);
  const [tab, setTab] = useUrlTab(TABS, "catalog");

  const breadcrumbs: BreadcrumbItemProps[] = useMemo(
    () => [
      { label: t("Dashboard"), path: "/admin", type: "link" },
      { label: t("Gifts"), path: "/admin/gifts", type: "page" },
    ],
    [t],
  );

  return (
    <div className="space-y-6">
      <Breadcrumbs breadcrumbs={breadcrumbs} isAdmin={true} />

      <Tabs value={tab} onValueChange={setTab} className="gap-4">
        <TabsList className="h-10 border border-border bg-card">
          <TabsTrigger value="catalog">{t("Catalog")}</TabsTrigger>
          <TabsTrigger value="sources">{t("Suppliers")}</TabsTrigger>
          <TabsTrigger value="redeems">{t("Redeems")}</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="space-y-4">
          <FormFilter />
          <CreateButton label={t("Create gift")} onClick={() => setCreateOpen(true)} />
          <DataTable onEdit={(g) => setEditGift(g)} />
        </TabsContent>

        <TabsContent value="sources">
          <GiftSourcesTab createOpen={createSourceOpen} onCreateOpenChange={setCreateSourceOpen} />
        </TabsContent>

        <TabsContent value="redeems">
          <RedeemsTable />
        </TabsContent>
      </Tabs>

      <GiftFormDialog mode="create" open={createOpen} onOpenChange={setCreateOpen} />
      <GiftFormDialog
        mode="edit"
        gift={editGift}
        open={Boolean(editGift)}
        onOpenChange={(open) => {
          if (!open) setEditGift(null);
        }}
      />
    </div>
  );
}

export default function AdminGiftsPage() {
  return (
    <GiftProvider>
      <GiftsContent />
    </GiftProvider>
  );
}
