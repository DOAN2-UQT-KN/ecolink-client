'use client';

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  useGetAdminGiftRedemptions,
  useUpdateGiftRedemptionStatus,
} from '@/apis/gift/adminGiftRedemptions';
import type {
  GiftRedemptionStatus,
  IAdminGiftRedemptionListItem,
} from '@/apis/gift/models/gift';
import {
  DataTable as SharedDataTable,
  type DataTableColumn,
} from '@/components/admin/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/libs/utils';
import { formattedDate } from '@/utils/formattedDate';

const PAGE_SIZE = 10;
const STATUSES: GiftRedemptionStatus[] = ['PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

function statusClassName(status: GiftRedemptionStatus) {
  switch (status) {
    case 'PROCESSING':
      return 'border-amber-300 bg-amber-50 text-amber-700';
    case 'SHIPPED':
      return 'border-blue-300 bg-blue-50 text-blue-700';
    case 'DELIVERED':
      return 'border-emerald-300 bg-emerald-50 text-emerald-700';
    case 'CANCELLED':
      return 'border-red-300 bg-red-50 text-red-700';
    default:
      return '';
  }
}

function nextStatuses(status: GiftRedemptionStatus): GiftRedemptionStatus[] {
  if (status === 'PROCESSING') return ['SHIPPED', 'CANCELLED'];
  if (status === 'SHIPPED') return ['DELIVERED', 'CANCELLED'];
  return [];
}

export function RedeemsTable() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<GiftRedemptionStatus | undefined>(undefined);
  const request = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      status,
      sortBy: 'createdAt' as const,
      sortOrder: 'desc' as const,
    }),
    [page, status],
  );
  const { data, isLoading } = useGetAdminGiftRedemptions(request);
  const { mutateAsync, isPending } = useUpdateGiftRedemptionStatus();
  const redemptions = data?.data?.redemptions ?? [];
  const total = data?.data?.total ?? 0;

  const columns: DataTableColumn<IAdminGiftRedemptionListItem>[] = useMemo(
    () => [
      {
        key: 'no',
        title: t('No'),
        className: 'w-[72px]',
        render: (_, __, index) => (page - 1) * PAGE_SIZE + index + 1,
      },
      {
        key: 'user',
        title: t('User'),
        className: 'min-w-[170px]',
        render: (_, row) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.user?.name || t('Unknown user')}</span>
            <span className="max-w-[180px] truncate text-xs text-muted-foreground">{row.userId}</span>
          </div>
        ),
      },
      {
        key: 'gift',
        title: t('Gift'),
        className: 'min-w-[180px]',
        render: (_, row) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.gift?.name ?? t('Gift')}</span>
            <span className="text-xs text-muted-foreground">
              {t('{{points}} SP', { points: row.greenPointsSpent })}
            </span>
          </div>
        ),
      },
      {
        key: 'phone',
        title: t('Phone'),
        className: 'min-w-[130px]',
        render: (_, row) => row.phoneNumber,
      },
      {
        key: 'location',
        title: t('Receiving address'),
        className: 'min-w-[240px]',
        render: (_, row) => <span className="line-clamp-2">{row.pickupLocation}</span>,
      },
      {
        key: 'status',
        title: t('Status'),
        className: 'w-[130px]',
        render: (_, row) => (
          <Badge className={cn('border', statusClassName(row.status))} variant="outline">
            {t(row.status)}
          </Badge>
        ),
      },
      {
        key: 'createdAt',
        title: t('Created at'),
        className: 'min-w-[150px]',
        render: (_, row) => formattedDate(row.createdAt, true),
      },
      {
        key: 'action',
        title: t('Action'),
        className: 'min-w-[220px]',
        render: (_, row) => {
          const next = nextStatuses(row.status);
          if (next.length === 0) {
            return <span className="text-xs text-muted-foreground">{t('No actions')}</span>;
          }
          return (
            <div className="flex flex-wrap gap-2">
              {next.map((nextStatus) => (
                <Button
                  key={nextStatus}
                  type="button"
                  size="sm"
                  variant={nextStatus === 'CANCELLED' ? 'outline' : 'default'}
                  disabled={isPending}
                  onClick={() => mutateAsync({ id: row.id, status: nextStatus })}
                >
                  {t(nextStatus)}
                </Button>
              ))}
            </div>
          );
        },
      },
    ],
    [isPending, mutateAsync, page, t],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t('Redeem orders')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('Manage gift redemption records and delivery status.')}
          </p>
        </div>
        <Select
          value={status ?? 'ALL'}
          onValueChange={(value) => {
            setStatus(value === 'ALL' ? undefined : (value as GiftRedemptionStatus));
            setPage(1);
          }}
        >
          <SelectTrigger className="!h-10 w-full !border-zinc-300 sm:w-[210px]">
            <SelectValue placeholder={t('Status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t('All statuses')}</SelectItem>
            {STATUSES.map((item) => (
              <SelectItem key={item} value={item}>
                {t(item)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <SharedDataTable
        columns={columns}
        data={redemptions}
        loading={isLoading}
        rowKey="id"
        emptyTitle={t('No redeem orders found')}
        emptyDescription={t('Redeem orders will appear here.')}
        pagination={{
          page,
          pageSize: PAGE_SIZE,
          total,
          onPageChange: setPage,
        }}
      />
    </div>
  );
}
