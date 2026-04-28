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
import { HiPlusCircle } from "react-icons/hi2";

function GiftsContent() {
  const { t } = useTranslation();
  const [createOpen, setCreateOpen] = useState(false);
  const [editGift, setEditGift] = useState<IGift | null>(null);

  const breadcrumbs: BreadcrumbItemProps[] = useMemo(
    () => [
      { label: t("Dashboard"), path: "/admin", type: "link" },
      { label: t("Gifts"), path: "/admin/gifts", type: "page" },
    ],
    [t],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Breadcrumbs breadcrumbs={breadcrumbs} isAdmin={true} />
        <Button type="button" onClick={() => setCreateOpen(true)} className="px-4 !h-[45px] cursor-pointer">
          <div className="flex items-center gap-2">
            <HiPlusCircle className="size-5" />
            {t("Create gift")}
          </div>
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
