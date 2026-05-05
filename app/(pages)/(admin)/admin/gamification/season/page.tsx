'use client';

import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HiPlusCircle } from 'react-icons/hi2';

import type { ISeason } from '@/apis/gamification/season/models';
import { Breadcrumbs, type BreadcrumbItemProps } from '@/components/client/shared/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { CreateUpdateSeason } from './_components/CreateUpdateSeason';
import { DataTable } from './_components/DataTable';
import { FormFilter } from './_components/FormFilter';
import { SeasonProvider } from './_context/useSeasonContext';
import { useSeasonContext } from './_hooks/useSeasonContext';

function SeasonAdminContent() {
  const { t } = useTranslation();
  const { onRetry } = useSeasonContext();
  const [createOpen, setCreateOpen] = useState(false);
  const [editSeason, setEditSeason] = useState<ISeason | null>(null);

  const breadcrumbs: BreadcrumbItemProps[] = useMemo(
    () => [
      { label: t('Admin dashboard'), path: '/admin', type: 'link' },
      { label: t('Season'), path: '/admin/gamification/season', type: 'page' },
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
            {t('Create season')}
          </div>
        </Button>
      </div>

      <FormFilter />
      <DataTable onEdit={(s) => setEditSeason(s)} />

      <CreateUpdateSeason
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        season={null}
        onSuccess={refreshList}
      />
      <CreateUpdateSeason
        open={Boolean(editSeason)}
        onClose={() => setEditSeason(null)}
        season={editSeason}
        onSuccess={refreshList}
      />
    </div>
  );
}

export default function AdminGamificationSeasonPage() {
  return (
    <SeasonProvider>
      <SeasonAdminContent />
    </SeasonProvider>
  );
}
