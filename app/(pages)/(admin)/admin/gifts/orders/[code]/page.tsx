import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TbCircleCheck, TbEdit, TbTruckDelivery, TbX } from 'react-icons/tb';

import { useUpdateGiftRedemptionStatus } from '@/apis/gift/adminGiftRedemptions';
import { useGetAdminRedemption } from '@/apis/gift/getAdminRedemption';
import { useAdminLayout } from '@/app/(pages)/(admin)/_context/AdminLayoutContext';
import { Breadcrumbs, type BreadcrumbItemProps } from '@/components/client/shared/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { ConfirmPopover } from '@/components/ui/ConfirmPopover';
import { Skeleton } from '@/components/ui/skeleton';
import { useParams } from '@/libs/router';
import { GiftOrderDetail } from '@/modules/GiftOrderDetail/GiftOrderDetail';
import { CancelRedemptionDialog } from '../../_components/CancelRedemptionDialog';
import { ShipOrderDialog } from '../../_components/ShipOrderDialog';
import { SourceAvatar } from '../../_components/SourceAvatar';

export default function AdminGiftOrderDetailPage() {
  const { t } = useTranslation();
  const { code = '' } = useParams() as { code?: string };
  const { theme } = useAdminLayout();
  const isDark = theme === 'dark';
  const { data, isLoading, isError, error, refetch } = useGetAdminRedemption(code, {
    retry: (count, err) => err.status !== 404 && count < 1,
  });
  const order = data?.data?.redemption;
  const deliver = useUpdateGiftRedemptionStatus();
  const [shipMode, setShipMode] = useState<'ship' | 'edit' | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const breadcrumbs: BreadcrumbItemProps[] = useMemo(
    () => [
      { label: t('Dashboard'), path: '/admin', type: 'link' },
      { label: t('Redeems'), path: '/admin/gifts?tab=redeems', type: 'link' },
      { label: code, path: `/admin/gifts/orders/${code}`, type: 'page' },
    ],
    [code, t],
  );

  const next = order?.allowedTransitions ?? [];
  const actions = order ? (
    <>
      {next.includes('SHIPPED') ? (
        <Button type="button" onClick={() => setShipMode('ship')} className="cursor-pointer">
          <TbTruckDelivery className="size-4" aria-hidden />
          {t('Mark as shipped')}
        </Button>
      ) : null}
      {order.status === 'SHIPPED' ? (
        <Button type="button" variant="outline" onClick={() => setShipMode('edit')} className="cursor-pointer">
          <TbEdit className="size-4" aria-hidden />
          {t('Edit tracking')}
        </Button>
      ) : null}
      {next.includes('DELIVERED') ? (
        <ConfirmPopover
          theme={theme}
          title={t('Mark this order as delivered?')}
          confirmLabel={t('Mark as delivered')}
          cancelLabel={t('Cancel')}
          confirmPending={deliver.isPending}
          onConfirm={async () => {
            await deliver.mutateAsync({ id: order.id, status: 'DELIVERED' }).catch(() => undefined);
          }}
          trigger={
            <Button type="button" variant="outline" className="cursor-pointer" disabled={deliver.isPending}>
              <TbCircleCheck className="size-4" aria-hidden />
              {t('Mark as delivered')}
            </Button>
          }
        />
      ) : null}
      {next.includes('CANCELLED') ? (
        <Button type="button" variant="outline" onClick={() => setCancelling(true)} className="cursor-pointer text-red-600">
          <TbX className="size-4" aria-hidden />
          {t('Cancel order')}
        </Button>
      ) : null}
    </>
  ) : null;

  return (
    <div className="space-y-6">
      <Breadcrumbs breadcrumbs={breadcrumbs} isAdmin={true} />

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : isError && error?.status !== 404 ? (
        <div className="rounded-[10px] border border-border bg-card p-6 text-sm">
          <p>{t('Could not load this order.')}</p>
          <Button type="button" variant="outline" onClick={() => refetch()} className="mt-3 cursor-pointer">
            {t('Retry')}
          </Button>
        </div>
      ) : !order ? (
        <div className="rounded-[10px] border border-border bg-card p-6 text-sm">{t('Order not found')}</div>
      ) : (
        <section className="rounded-[10px] border border-border bg-card p-4">
          <GiftOrderDetail
            order={order}
            audience="admin"
            isDark={isDark}
            actions={actions}
            adminExtra={
              <>
                <div className="min-w-0">
                  <dt className="text-xs text-foreground-secondary">{t('Account')}</dt>
                  <dd className="text-sm">{order.user?.name ?? t('Unknown user')}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-xs text-foreground-secondary">{t('Gift source')}</dt>
                  <dd className="text-sm">
                    {order.sources.length > 0 ? (
                      <ul className="space-y-1">
                        {order.sources.map((s) => (
                          <li key={s.id} className="inline-flex w-full items-center gap-2">
                            <SourceAvatar name={s.name} />
                            <span className="min-w-0 [overflow-wrap:anywhere]">{s.name}</span>
                            <span className="shrink-0 tabular-nums text-foreground-secondary">× {s.quantity}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      '—'
                    )}
                  </dd>
                </div>
              </>
            }
          />
        </section>
      )}

      <ShipOrderDialog order={shipMode && order ? order : null} mode={shipMode ?? 'ship'} onClose={() => setShipMode(null)} />
      <CancelRedemptionDialog order={cancelling && order ? order : null} onClose={() => setCancelling(false)} />
    </div>
  );
}
