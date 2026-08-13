import { useMemo, useState } from 'react';
import { Gift, PackageCheck, Truck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { GiftRedemptionStatus } from '@/apis/gift/models/gift';
import { useGetGiftRedemptions } from '@/apis/gift/getGiftRedemptions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/libs/utils';
import { formattedDate } from '@/utils/formattedDate';

const PAGE_SIZE = 10;

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

export default function ProfileOrdersPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const request = useMemo(
    () => ({ page, limit: PAGE_SIZE, sortBy: 'createdAt' as const, sortOrder: 'desc' as const }),
    [page],
  );
  const { data, isLoading } = useGetGiftRedemptions(request);
  const redemptions = data?.data?.redemptions ?? [];
  const totalPages = Math.max(1, data?.data?.totalPages ?? 1);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-[10px] border border-[rgba(136,122,71,0.35)] bg-white/70 p-4"
          >
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="mt-3 h-4 w-2/3" />
            <Skeleton className="mt-2 h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (redemptions.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Gift className="size-10" />
          </EmptyMedia>
          <EmptyTitle>{t('No orders yet')}</EmptyTitle>
          <EmptyDescription>{t('Redeemed gifts will appear here.')}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <PackageCheck className="size-5 text-button-accent" />
        <h1 className="font-serif text-2xl font-semibold text-foreground">{t('Orders')}</h1>
      </div>

      <div className="space-y-3">
        {redemptions.map((order) => (
          <article
            key={order.id}
            className="rounded-[10px] border border-[rgba(136,122,71,0.35)] bg-white/75 p-4 shadow-sm"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-1">
                <h2 className="truncate font-medium text-foreground">
                  {order.gift?.name ?? t('Gift')}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t('{{points}} SP', { points: order.greenPointsSpent })} ·{' '}
                  {formattedDate(order.createdAt, true)}
                </p>
              </div>
              <Badge className={cn('border', statusClassName(order.status))} variant="outline">
                {t(order.status)}
              </Badge>
            </div>

            <div className="mt-4 grid gap-2 text-sm text-foreground-secondary md:grid-cols-2">
              <p>
                <span className="font-medium text-foreground">{t('Phone')}:</span>{' '}
                {order.phoneNumber}
              </p>
              <p className="md:col-span-2">
                <span className="font-medium text-foreground">{t('Receiving address')}:</span>{' '}
                {order.pickupLocation}
              </p>
              <p className="inline-flex items-center gap-1">
                <Truck className="size-4" />
                {t('Last updated')}: {formattedDate(order.statusUpdatedAt, true)}
              </p>
            </div>
          </article>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            {t('Previous')}
          </Button>
          <span className="text-sm text-muted-foreground">
            {page}/{totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          >
            {t('Next')}
          </Button>
        </div>
      )}
    </section>
  );
}
