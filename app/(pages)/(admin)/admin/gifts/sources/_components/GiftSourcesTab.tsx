import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useGetGiftSources } from '@/apis/gift-source/getGiftSources';
import type { IGiftSource } from '@/apis/gift-source/models/giftSource';
import { useGiftSourceFilters } from '../_hooks/useGiftSourceFilters';
import { CreateButton } from '../../_components/CreateButton';
import { GiftSourceFilter } from './GiftSourceFilter';
import { GiftSourceFormDialog } from './GiftSourceFormDialog';
import { GiftSourceTable } from './GiftSourceTable';

type Props = { createOpen: boolean; onCreateOpenChange: (open: boolean) => void };

/** "Sources" tab of /admin/gifts: list, filter, create, edit and stop gift sources. */
export function GiftSourcesTab({ createOpen, onCreateOpenChange }: Props) {
  const { t } = useTranslation();
  const { request, setFilter, setPage, setPageSize } = useGiftSourceFilters();
  const { data, isLoading, isError, refetch } = useGetGiftSources(request);
  const [editing, setEditing] = useState<IGiftSource | null>(null);

  return (
    <div className="space-y-4">
      <GiftSourceFilter request={request} onChange={setFilter} />
      <CreateButton label={t('Create gift source')} onClick={() => onCreateOpenChange(true)} />
      <GiftSourceTable
        sources={data?.data?.sources ?? []}
        loading={isLoading}
        error={isError}
        onRetry={() => refetch()}
        page={request.page ?? 1}
        pageSize={request.limit ?? 10}
        total={data?.data?.total ?? 0}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onEdit={setEditing}
      />

      <GiftSourceFormDialog open={createOpen} onOpenChange={onCreateOpenChange} />
      <GiftSourceFormDialog
        source={editing}
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      />
    </div>
  );
}
