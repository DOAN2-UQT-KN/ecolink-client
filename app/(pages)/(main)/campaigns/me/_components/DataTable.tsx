import { memo, useCallback, useMemo } from 'react';
import { useRouter } from '@/libs/router';
import { useTranslation } from 'react-i18next';
import { Building2 } from 'lucide-react';

import type { ICampaign } from '@/apis/campaign/models/campaign';
import { CampaignStatusTag } from '@/components/ui/CampaignStatusTag';
import { Button } from '@/components/client/shared/Button';
import { ConfirmPopover } from '@/components/admin/shared/ConfirmPopover';
import { useSubmitCampaign } from '@/apis/campaign/submitCampaign';
import { useDeleteCampaign } from '@/apis/campaign/deleteCampaign';
import {
  CAMPAIGN_DELETABLE_STATUSES,
  CAMPAIGN_EDITABLE_STATUSES,
  CAMPAIGN_STATUS,
  CAMPAIGN_SUBMITTABLE_STATUSES,
} from '@/constants/campaignLifecycle';
import Image from '@/components/ui/AppImage';
import { formattedDate } from '@/utils/formattedDate';
import {
  DataTable as SharedDataTable,
  type ColumnType,
} from '@/components/client/shared/DataTable';
import { CampaignGeneralInfoCell } from '@/components/client/shared/CampaignGeneralInfoCell';
import useCampaignMeContext from '../_hooks/useCampaignMeContext';
import FormFilter from './FormFilter';
import { useLocalizedDisplay } from '@/hooks/useLocalizedDisplay';

const defaultPagination = { current: 1, pageSize: 10 };

const COLUMN_KEYS = {
  NO: 'no',
  GENERAL_INFORMATION: 'general_information',
  CREATED_AT: 'created_at',
  ORGANIZATION: 'organization',
  STATUS: 'status',
  BAN_REASON: 'ban_reason',
  GREEN_POINTS: 'green_points',
  ACTIONS: 'actions',
} as const;

/** Edit / send for review / delete, depending on the campaign's status and the viewer's rights. */
const CampaignRowActions = memo(function CampaignRowActions({ campaign }: { campaign: ICampaign }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { mutate: submit, isPending: isSubmitting } = useSubmitCampaign();
  const { mutate: remove, isPending: isDeleting } = useDeleteCampaign();
  const status = campaign.status ?? -1;
  const canManage = Boolean(campaign.can_manage_campaign);
  const canEdit = canManage && CAMPAIGN_EDITABLE_STATUSES.includes(status);
  const canSubmit = canManage && CAMPAIGN_SUBMITTABLE_STATUSES.includes(status);
  const canDelete = Boolean(campaign.can_delete_campaign) && CAMPAIGN_DELETABLE_STATUSES.includes(status);

  if (!canEdit && !canSubmit && !canDelete) {
    return <span className="text-xs text-zinc-400">—</span>;
  }

  return (
    <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
      {canEdit && (
        <Button
          size="small"
          variant="outlined-brown"
          onClick={() => router.push(`/campaigns/${campaign.id}/edit`)}
        >
          {t('Edit')}
        </Button>
      )}
      {canSubmit && (
        <Button
          size="small"
          variant="brown"
          disabled={isSubmitting}
          onClick={() => submit(campaign.id, { onError: () => router.push(`/campaigns/${campaign.id}/edit`) })}
        >
          {status === CAMPAIGN_STATUS.NEEDS_REVISION ? t('Resubmit for review') : t('Send for review')}
        </Button>
      )}
      {canDelete && (
        <ConfirmPopover
          title={t('Delete campaign')}
          description={t('The campaign is removed and its waste points become available again.')}
          confirmLabel={t('Yes')}
          cancelLabel={t('No')}
          theme="light"
          confirmPending={isDeleting}
          onConfirm={() => remove(campaign.id)}
          trigger={
            <Button size="small" variant="outlined-brown" className="text-red-600">
              {t('Delete')}
            </Button>
          }
        />
      )}
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
          <CampaignGeneralInfoCell campaign={record} title={localizedTitle(record)} />
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
          <CampaignStatusTag status={record.status} />
        ),
        width: 120,
      },
      {
        key: COLUMN_KEYS.BAN_REASON,
        title: t('Admin reason'),
        render: (_, record) =>
          record.reject_reason &&
          (record.status === CAMPAIGN_STATUS.NEEDS_REVISION ||
            record.status === CAMPAIGN_STATUS.BLOCKED ||
            record.status === CAMPAIGN_STATUS.CANCELLED ||
            record.status === CAMPAIGN_STATUS.UPCOMING ||
            record.status === CAMPAIGN_STATUS.ACTIVE) ? (
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
        key: COLUMN_KEYS.ACTIONS,
        title: t('Actions'),
        render: (_, record) => <CampaignRowActions campaign={record} />,
        width: 220,
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
