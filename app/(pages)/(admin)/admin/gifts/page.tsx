"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Breadcrumbs,
  type BreadcrumbItemProps,
} from "@/components/client/shared/Breadcrumbs";
import { Button } from "@/components/ui/button";

import type { IGift } from "@/apis/gift/models/gift";
import { GiftProvider } from "./_context/GiftContext";
import { FormFilter } from "./_components/FormFilter";
import { DataTable } from "./_components/DataTable";
import { GiftFormDialog } from "./_components/GiftFormDialog";

function GiftsContent() {
  const { t } = useTranslation();
  const [createOpen, setCreateOpen] = useState(false);
  const [editGift, setEditGift] = useState<IGift | null>(null);

  const breadcrumbs: BreadcrumbItemProps[] = useMemo(
    () => [
      { label: "Dashboard", path: "/admin", type: "link" },
      { label: t("Gifts"), path: "/admin/gifts", type: "page" },
    ],
    [t],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Breadcrumbs breadcrumbs={breadcrumbs} />
        <Button type="button" onClick={() => setCreateOpen(true)}>
          {t("Create gift")}
        </Button>
      </div>

      <FormFilter />
      <DataTable onEdit={(g) => setEditGift(g)} />

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
