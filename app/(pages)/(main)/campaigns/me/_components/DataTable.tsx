import { memo, useCallback, useMemo } from 'react';
import { useRouter } from '@/libs/router';
import { useTranslation } from 'react-i18next';
import { Building2 } from 'lucide-react';

import type { ICampaign } from '@/apis/campaign/models/campaign';
import { StatusTag } from '@/components/ui/StatusTag';
import Image from '@/components/ui/AppImage';
import { formattedDate } from '@/utils/formattedDate';
import { getDifficultyLevel } from '@/constants/difficulty';
import { cn } from '@/libs/utils';
import {
  DataTable as SharedDataTable,
  type ColumnType,
} from '@/components/client/shared/DataTable';
import useCampaignMeContext from '../_hooks/useCampaignMeContext';
import FormFilter from './FormFilter';
import { useLocalizedDisplay } from '@/hooks/useLocalizedDisplay';

const defaultPagination = { current: 1, pageSize: 10 };
const DEFAULT_BANNER = '/banner-default.jpg';

const COLUMN_KEYS = {
  NO: 'no',
  GENERAL_INFORMATION: 'general_information',
  CREATED_AT: 'created_at',
  ORGANIZATION: 'organization',
  STATUS: 'status',
  BAN_REASON: 'ban_reason',
  MEMBERS: 'members',
  GREEN_POINTS: 'green_points',
} as const;

const GeneralInformationCell = memo(function GeneralInformationCell({
  campaign,
  title,
}: {
  campaign: ICampaign;
  title: string;
}) {
  const { t } = useTranslation();
  const bannerUrl = campaign.banner?.trim() ? campaign.banner : DEFAULT_BANNER;
  const difficulty = getDifficultyLevel(campaign.difficulty);
  const duration = `${formattedDate(campaign.start_date ?? undefined)} - ${formattedDate(campaign.end_date ?? undefined)}`;

  return (
    <div className="flex items-start gap-3 min-w-[280px] max-w-[420px]">
      <Image
        src={bannerUrl}
        alt={title}
        width={72}
        height={48}
        className="h-12 w-[72px] shrink-0 rounded-md object-cover ring-1 ring-zinc-200"
      />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="font-medium line-clamp-2 text-zinc-900">{title}</span>
        <span className="text-xs text-zinc-600 tabular-nums">{duration}</span>
        <span
          className={cn(
            'font-display-1 text-xs font-medium',
            difficulty?.textClass ?? 'text-zinc-500',
          )}
        >
          {difficulty ? t(difficulty.label) : '—'}
        </span>
      </div>
    </div>
  );
});

export const DataTable = memo(function DataTable() {
  const router = useRouter();
  const { t } = useTranslation();
  const { title: localizedTitle, locale } = useLocalizedDisplay();
  const { campaigns, isLoading, pagination, setPagination, total } = useCampaignMeContext();

  const columns: ColumnType<ICampaign>[] = useMemo(
    () => [
      {
        key: COLUMN_KEYS.NO,
        title: t('No'),
        render: (_, __, index) => (
          <span className="tabular-nums">
            {(pagination.current - 1) * pagination.pageSize + index + 1}
          </span>
        ),
        width: 60,
      },
      {
        key: COLUMN_KEYS.GENERAL_INFORMATION,
        title: t('General information'),
        render: (_, record) => (
          <GeneralInformationCell campaign={record} title={localizedTitle(record)} />
        ),
        width: 360,
      },
      {
        key: COLUMN_KEYS.CREATED_AT,
        title: t('Created at'),
        render: (_, record) => (
          <span className="tabular-nums !font-display-1">{formattedDate(record.created_at)}</span>
        ),
        width: 140,
      },
      {
        key: COLUMN_KEYS.ORGANIZATION,
        title: t('Organization'),
        render: (_, record) => (
          <div className="flex items-center gap-2 min-w-[160px]">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full overflow-hidden ring-1 text-xs font-semibold ring-zinc-300 bg-zinc-200 text-zinc-600">
              {record.organization?.logo_url ? (
                <Image
                  src={record.organization.logo_url}
                  alt={record.organization.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Building2 className="h-4 w-4" />
              )}
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-medium text-zinc-900">
                {record.organization?.name || '—'}
              </span>
              <span className="text-xs text-zinc-500">
                {record.organization?.contact_email || '—'}
              </span>
            </div>
          </div>
        ),
        width: 220,
      },
      {
        key: COLUMN_KEYS.STATUS,
        title: t('Status'),
        render: (_, record) => (
          <StatusTag status={record.status} className="!mx-0 min-w-0 justify-center" />
        ),
        width: 120,
      },
      {
        key: COLUMN_KEYS.BAN_REASON,
        title: t('Ban Reason'),
        render: (_, record) =>
          record.reject_reason ? (
            <span
              className="line-clamp-2 text-xs"
              title={record.reject_reason}
            >
              {record.reject_reason}
            </span>
          ) : (
            <span className="text-xs text-zinc-400">—</span>
          ),
        width: 180,
      },
      {
        key: COLUMN_KEYS.MEMBERS,
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
      // {
      //   key: COLUMN_KEYS.GREEN_POINTS,
      //   title: t('Green pts'),
      //   render: (_, record) => (
      //     <span className="flex items-center gap-1 text-sm font-medium text-emerald-500">
      //       🌿 {record.green_points ?? 0}
      //     </span>
      //   ),
      //   width: 120,
      // },
    ],
    [pagination.current, pagination.pageSize, t, locale, localizedTitle],
  );

  const handleTableChange = useCallback(
    (page: { current: number; pageSize: number }) => {
      setPagination(page);
    },
    [setPagination],
  );

  const handleRowClick = useCallback(
    (record: ICampaign) => {
      router.push(`/campaigns/${record.id}`);
    },
    [router],
  );

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
      <SharedDataTable
        rowKey="id"
        columns={columns}
        dataSource={campaigns}
        loading={isLoading}
        pagination={{ ...(pagination ?? defaultPagination), total }}
        onChange={handleTableChange}
        onRowClick={handleRowClick}
        emptyText={t('No campaigns found')}
        filter={<FormFilter />}
      />
    </div>
  );
});

export default DataTable;
