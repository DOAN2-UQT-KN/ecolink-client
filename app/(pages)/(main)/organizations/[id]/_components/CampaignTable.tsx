import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { ICampaign } from '@/apis/campaign/models/campaign';
import { CampaignGeneralInfoCell } from '@/components/client/shared/CampaignGeneralInfoCell';
import {
  DataTable,
  type ColumnType,
  type PaginationProps,
} from '@/components/client/shared/DataTable';
import { CampaignStatusTag } from '@/components/ui/CampaignStatusTag';
import { useLocalizedDisplay } from '@/hooks/useLocalizedDisplay';
import { useRouter } from '@/libs/router';
import { formattedDate } from '@/utils/formattedDate';

/** "List" view of the organization's campaigns; read-only, actions live in My campaigns. */
export const CampaignTable = memo(function CampaignTable({
  campaigns,
  loading,
  pagination,
  onPageChange,
}: {
  campaigns: ICampaign[];
  loading: boolean;
  pagination: PaginationProps;
  onPageChange: (page: number) => void;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const { title: localizedTitle } = useLocalizedDisplay();

  const columns: ColumnType<ICampaign>[] = useMemo(
    () => [
      {
        key: 'no',
        title: t('No'),
        render: (_, __, index) => (
          <span className="tabular-nums">
            {(pagination.current - 1) * pagination.pageSize + index + 1}
          </span>
        ),
        width: 60,
      },
      {
        key: 'general_information',
        title: t('General information'),
        render: (_, record) => (
          <CampaignGeneralInfoCell campaign={record} title={localizedTitle(record)} />
        ),
        width: 360,
      },
      {
        key: 'status',
        title: t('Status'),
        render: (_, record) => <CampaignStatusTag status={record.status} />,
        width: 140,
      },
      {
        key: 'members',
        title: t('Members'),
        render: (_, record) => (
          <span className="tabular-nums font-display-1">
            <span className="font-semibold text-emerald-500">{record.current_members ?? 0}</span>
            <span className="text-zinc-400"> / </span>
            <span>{record.max_members ?? '∞'}</span>
          </span>
        ),
        width: 120,
      },
      {
        key: 'green_points',
        title: t('Reward'),
        render: (_, record) => (
          <span className="tabular-nums font-medium text-emerald-600">
            {record.green_points ?? 0}
          </span>
        ),
        width: 100,
      },
      {
        key: 'created_at',
        title: t('Created at'),
        render: (_, record) => (
          <span className="tabular-nums !font-display-1">{formattedDate(record.created_at)}</span>
        ),
        width: 140,
      },
    ],
    [pagination.current, pagination.pageSize, t, localizedTitle],
  );

  return (
    <DataTable
      rowKey="id"
      columns={columns}
      dataSource={campaigns}
      loading={loading}
      pagination={pagination}
      onChange={(next) => onPageChange(next.current)}
      onRowClick={(record) => router.push(`/campaigns/${record.id}`)}
      emptyText={t('There are no campaigns for this group yet.')}
    />
  );
});

export default CampaignTable;
