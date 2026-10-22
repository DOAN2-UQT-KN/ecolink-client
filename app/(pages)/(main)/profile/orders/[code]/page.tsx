import { useTranslation } from 'react-i18next';
import { ArrowLeft, PackageSearch } from 'lucide-react';

import { useGetMyRedemption } from '@/apis/gift/getMyRedemption';
import { Button } from '@/components/client/shared/Button';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { Link, useParams } from '@/libs/router';
import { GiftOrderDetail } from '@/modules/GiftOrderDetail/GiftOrderDetail';
import { CancelOrderDialog } from '../_components/CancelOrderDialog';
import { ConfirmDeliveryButton } from '../_components/ConfirmDeliveryButton';

export default function ProfileOrderDetailPage() {
  const { t } = useTranslation();
  const { code = '' } = useParams() as { code?: string };
  const { data, isLoading, isError, error, refetch } = useGetMyRedemption(code, {
    retry: (count, err) => err.status !== 404 && count < 1,
  });
  const order = data?.data?.redemption;

  return (
    <section className="space-y-4 rounded-xl border border-[rgba(136,122,71,0.35)] bg-white p-5 sm:p-6">
      <Link
        href="/profile/orders"
        className="inline-flex items-center gap-1 text-sm text-foreground-secondary hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t('Back to my orders')}
      </Link>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : isError && error?.status !== 404 ? (
        <div className="rounded-lg border border-[rgba(136,122,71,0.35)] p-6 text-sm">
          <p>{t('Could not load this order.')}</p>
          <Button variant="outlined-brown" size="medium" className="mt-3" onClick={() => void refetch()}>
            {t('Try again')}
          </Button>
        </div>
      ) : !order ? (
        <Empty className="rounded-xl border border-[rgba(136,122,71,0.35)] p-8">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <PackageSearch className="size-5 text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle>{t('Order not found')}</EmptyTitle>
            <EmptyDescription>{t('Check the order code, or find it in your order list.')}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <GiftOrderDetail
          order={order}
          audience="user"
          actions={
            <>
              {order.allowedTransitions.includes('CANCELLED') ? <CancelOrderDialog code={order.code} /> : null}
              {order.allowedTransitions.includes('DELIVERED') ? <ConfirmDeliveryButton code={order.code} /> : null}
            </>
          }
        />
      )}
    </section>
  );
}
