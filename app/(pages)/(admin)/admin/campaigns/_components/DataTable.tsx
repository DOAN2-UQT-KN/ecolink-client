import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2 } from 'lucide-react';
import { TbExternalLink } from 'react-icons/tb';

import type { ICampaign } from '@/apis/campaign/models/campaign';
import { useAdminLayout } from '@/app/(pages)/(admin)/_context/AdminLayoutContext';
import { StatusTag } from '@/components/ui/StatusTag';
import Image from '@/components/ui/AppImage';
import {
  DataTable as SharedDataTable,
  type DataTableColumn,
} from '@/components/admin/shared/DataTable';
import { cn } from '@/libs/utils';
import { useCampaignContext } from '../_context/CampaignContext';
import { VerifyCampaignConfirm } from './VerifyCampaignConfirm';
import { formattedDate } from '@/utils/formattedDate';
import { STATUS } from '@/constants/status';
import { getDifficultyLevel } from '@/constants/difficulty';
import { CompletionReviewCampaignConfirm } from './CompletionReviewCampaignConfirm';
import { useLocalizedDisplay } from '@/hooks/useLocalizedDisplay';

const DEFAULT_BANNER = '/banner-default.jpg';

const COLUMN_KEYS = {
  NO: 'no',
  GENERAL_INFORMATION: 'general_information',
  CREATED_AT: 'created_at',
  ORGANIZATION: 'organization',
  STATUS: 'status',
  REJECT_REASON: 'reject_reason',
  MEMBERS: 'members',
  ACTION: 'action',
} as const;

const GeneralInformationCell = memo(function GeneralInformationCell({
  campaign,
  title,
  isDark,
}: {
  campaign: ICampaign;
  title: string;
  isDark: boolean;
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
        className={cn(
          'h-12 w-[72px] shrink-0 rounded-md object-cover ring-1',
          isDark ? 'ring-zinc-700' : 'ring-zinc-200',
        )}
      />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span
          className={cn(
            'font-medium line-clamp-2',
            isDark ? 'text-zinc-100' : 'text-zinc-900',
          )}
        >
          {title}
        </span>
        <span
          className={cn(
            'text-xs tabular-nums',
            isDark ? 'text-zinc-400' : 'text-zinc-600',
          )}
        >
          {duration}
        </span>
        <span
          className={cn(
            'font-display-1 text-xs font-medium',
            difficulty?.textClass ?? (isDark ? 'text-zinc-500' : 'text-zinc-500'),
          )}
        >
          {difficulty ? t(difficulty.label) : '—'}
        </span>
      </div>
    </div>
  );
});

const OrgCell = memo(function OrgCell({
  org,
  isDark,
}: {
  org?: ICampaign['organization'];
  isDark: boolean;
}) {
  return (
    <div className="flex items-center gap-2 min-w-[160px]">
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full overflow-hidden ring-1 text-xs font-semibold',
          isDark
            ? 'ring-zinc-600 bg-zinc-800 text-zinc-300'
            : 'ring-zinc-300 bg-zinc-200 text-zinc-600',
        )}
      >
        {org?.logo_url ? (
          <Image src={org.logo_url} alt={org.name} className="h-full w-full object-cover" />
        ) : (
          <Building2 className="h-4 w-4" />
        )}
      </div>
      <div className="flex flex-col leading-tight">
        <span className={cn('text-sm font-medium', isDark ? 'text-zinc-100' : 'text-zinc-900')}>
          {org?.name || '—'}
        </span>
        <span className={cn('text-xs', isDark ? 'text-zinc-500' : 'text-zinc-500')}>
          {org?.contact_email || '—'}
        </span>
      </div>
    </div>
  );
});

export const DataTable = memo(function DataTable() {
  const { t } = useTranslation();
  const { title: localizedTitle, locale } = useLocalizedDisplay();
  const { campaigns, loading, pagination, total, onPageChange, onPageSizeChange } =
    useCampaignContext();
  const { theme } = useAdminLayout();
  const isDark = theme === 'dark';

  const columns: DataTableColumn<ICampaign>[] = useMemo(
    () => [
      {
        key: COLUMN_KEYS.NO,
        title: t('No'),
        className: 'w-[60px]',
        render: (_, __, index) => (
          <span className="tabular-nums">
            {(pagination.current - 1) * pagination.pageSize + index + 1}
          </span>
        ),
      },
      {
        key: COLUMN_KEYS.GENERAL_INFORMATION,
        title: t('General information'),
        className: 'min-w-[280px] max-w-[420px]',
        sticky: 'left',
        render: (_, record) => (
          <GeneralInformationCell
            campaign={record}
            title={localizedTitle(record)}
            isDark={isDark}
          />
        ),
      },
      {
        key: COLUMN_KEYS.CREATED_AT,
        title: t('Created at'),
        className: 'min-w-[120px]',
        render: (_, record) => (
          <span
            className={cn(
              'tabular-nums !font-display-1',
              isDark ? 'text-zinc-300' : 'text-zinc-700',
            )}
          >
            {formattedDate(record.created_at)}
          </span>
        ),
      },
      {
        key: COLUMN_KEYS.ORGANIZATION,
        title: t('Organization'),
        className: 'min-w-[180px]',
        render: (_, record) => <OrgCell org={record.organization} isDark={isDark} />,
      },
      {
        key: COLUMN_KEYS.STATUS,
        title: t('Status'),
        className: 'min-w-[120px]',
        render: (_, record) => (
          <StatusTag status={record.status} className="!mx-0 min-w-0 justify-center" />
        ),
      },
      {
        key: COLUMN_KEYS.REJECT_REASON,
        title: t('Reject Reason'),
        className: 'min-w-[160px] max-w-[260px]',
        render: (_, record) =>
          record.reject_reason ? (
            <span
              className={cn(
                'line-clamp-2 text-xs',
                isDark ? 'text-zinc-300' : 'text-zinc-700',
              )}
              title={record.reject_reason}
            >
              {record.reject_reason}
            </span>
          ) : (
            <span className={cn('text-xs', isDark ? 'text-zinc-600' : 'text-zinc-400')}>—</span>
          ),
      },
      {
        key: COLUMN_KEYS.MEMBERS,
        title: t('Members'),
        className: 'min-w-[110px]',
        render: (_, record) => (
          <span
            className={cn(
              'tabular-nums font-display-1',
              isDark ? 'text-zinc-300' : 'text-zinc-700',
            )}
          >
            <span className="font-semibold text-emerald-400">{record.current_members ?? 0}</span>
            <span className={isDark ? 'text-zinc-500' : 'text-zinc-400'}> / </span>
            <span>{record.max_members ?? '∞'}</span>
          </span>
        ),
      },
      {
        key: COLUMN_KEYS.ACTION,
        title: t('Action'),
        sticky: 'right',
        render: (_, record) => (
          <div className="flex items-center gap-2">
            <a
              href={`/campaigns/${record.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'rounded-md border px-1.5 py-1.5 text-xs font-medium transition-colors duration-200',
                isDark
                  ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-blue-300'
                  : 'border-zinc-300 text-zinc-700 hover:bg-zinc-100 hover:text-blue-700',
              )}
              title={t('Preview campaign')}
            >
              <TbExternalLink className="size-5" />
            </a>

            {record.status === STATUS.ACTIVE ? (
              <VerifyCampaignConfirm
                mode="ban"
                campaignId={record.id}
                campaignTitle={localizedTitle(record)}
                theme={isDark ? 'dark' : 'light'}
              />
            ) : record.status !== STATUS.INACTIVE &&
              record.status !== STATUS.WAITING_CONFIRMED ? (
              <VerifyCampaignConfirm
                campaignId={record.id}
                campaignTitle={localizedTitle(record)}
                theme={isDark ? 'dark' : 'light'}
              />
            ) : null}

            {record.status === STATUS.WAITING_CONFIRMED ? (
              <CompletionReviewCampaignConfirm
                campaignId={record.id}
                campaignTitle={localizedTitle(record)}
                theme={isDark ? 'dark' : 'light'}
              />
            ) : null}
          </div>
        ),
      },
    ],
    [isDark, pagination.current, pagination.pageSize, t, locale, localizedTitle],
  );

  return (
    <SharedDataTable
      columns={columns}
      data={campaigns}
      loading={loading}
      rowKey="id"
      emptyTitle={t('No campaigns found')}
      emptyDescription={t('No campaigns available for the current filters.')}
      pagination={{
        page: pagination.current,
        pageSize: pagination.pageSize,
        total,
        onPageChange,
        onPageSizeChange,
      }}
    />
  );
});

export default DataTable;
