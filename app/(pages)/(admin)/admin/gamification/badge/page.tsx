"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { HiPlusCircle } from "react-icons/hi2";

import {
  Breadcrumbs,
  type BreadcrumbItemProps,
} from "@/components/client/shared/Breadcrumbs";
import { Button } from "@/components/ui/button";
import type { IAdminBadgeDefinition } from "@/apis/gamification/models/gamificationBadge";

import { BadgeAdminProvider, useBadgeAdminContext } from "./_context/BadgeAdminContext";
import { FormFilter } from "./_components/FormFilter";
import { DataTable } from "./_components/DataTable";
import { CreateUpdateBadge } from "./_components/CreateUpdateBadge";

function BadgeAdminContent() {
  const { t } = useTranslation();
  const { onRetry } = useBadgeAdminContext();
  const [createOpen, setCreateOpen] = useState(false);
  const [editBadge, setEditBadge] = useState<IAdminBadgeDefinition | null>(null);

  const breadcrumbs: BreadcrumbItemProps[] = useMemo(
    () => [
      { label: t("Admin dashboard"), path: "/admin", type: "link" },
      { label: t("Badge"), path: "/admin/gamification/badge", type: "page" },
    ],
    [t],
  );

  const refreshList = useCallback(() => {
    void onRetry();
  }, [onRetry]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Breadcrumbs breadcrumbs={breadcrumbs} isAdmin={true} />
        <Button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="!h-[45px] cursor-pointer px-4"
        >
          <div className="flex items-center gap-2">
            <HiPlusCircle className="size-5" />
            {t("Create badge")}
          </div>
        </Button>
      </div>

      <FormFilter />
      <DataTable onEdit={(b) => setEditBadge(b)} />

      <CreateUpdateBadge
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        badge={null}
        onSuccess={refreshList}
      />
      <CreateUpdateBadge
        open={Boolean(editBadge)}
        onClose={() => setEditBadge(null)}
        badge={editBadge}
        onSuccess={refreshList}
      />
    </div>
  );
}

export default function AdminGamificationBadgePage() {
  return (
    <BadgeAdminProvider>
      <BadgeAdminContent />
    </BadgeAdminProvider>
  );
}
