import { useMemo, useState } from 'react';
import { useLocalizedDisplay } from '@/hooks/useLocalizedDisplay';
import { useTranslation } from 'react-i18next';
import { HiPlusCircle } from 'react-icons/hi2';

import { useGetGift } from '@/apis/gift/getGift';
import { useGetStockBatches } from '@/apis/gift-stock/getStockBatches';
import type { IStockBatch } from '@/apis/gift-stock/models/stock';
import { Breadcrumbs, type BreadcrumbItemProps } from '@/components/client/shared/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useParams } from '@/libs/router';
import { AdjustDialog } from './_components/AdjustDialog';
import { BatchTable } from './_components/BatchTable';
import { MovementTable } from './_components/MovementTable';
import { StockInDialog } from './_components/StockInDialog';

const PAGE_SIZE = 10;

export default function AdminGiftStockPage() {
  const { t } = useTranslation();
  const { title } = useLocalizedDisplay();
  const { id } = useParams() as { id: string };
  const [page, setPage] = useState(1);
  const [stockInOpen, setStockInOpen] = useState(false);
  const [writeOff, setWriteOff] = useState<IStockBatch | null>(null);

  const giftQuery = useGetGift(id);
  const gift = giftQuery.data?.data?.gift;
  const giftName = gift ? title(gift) : '';
  const batchesQuery = useGetStockBatches({ giftId: id, page, limit: PAGE_SIZE });
  const batches = batchesQuery.data?.data?.batches ?? [];

  const breadcrumbs: BreadcrumbItemProps[] = useMemo(
    () => [
      { label: t('Dashboard'), path: '/admin', type: 'link' },
      { label: t('Gifts'), path: '/admin/gifts', type: 'link' },
      { label: giftName ? `${t('Stock')}: ${giftName}` : t('Stock'), path: `/admin/gifts/${id}/stock`, type: 'page' },
    ],
    [giftName, id, t],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Breadcrumbs breadcrumbs={breadcrumbs} isAdmin={true} />
        <Button type="button" onClick={() => setStockInOpen(true)} disabled={!gift} className="!h-[45px] cursor-pointer px-4">
          <span className="flex items-center gap-2">
            <HiPlusCircle className="size-5" aria-hidden />
            {t('Receive stock')}
          </span>
        </Button>
      </div>

      {giftQuery.isError ? (
        <div className="rounded-[10px] border border-border bg-card p-6 text-sm">
          <p>{t('Could not load the gift.')}</p>
          <Button type="button" variant="outline" onClick={() => giftQuery.refetch()} className="mt-3 cursor-pointer">
            {t('Retry')}
          </Button>
        </div>
      ) : null}

      <Tabs defaultValue="batches" className="gap-4">
        <TabsList className="h-10 border border-border bg-card">
          <TabsTrigger value="batches">{t('Batches')}</TabsTrigger>
          <TabsTrigger value="history">{t('Stock history')}</TabsTrigger>
        </TabsList>
        <TabsContent value="batches">
          <BatchTable
            batches={batches}
            loading={batchesQuery.isLoading}
            error={batchesQuery.isError}
            onRetry={() => batchesQuery.refetch()}
            page={page}
            pageSize={PAGE_SIZE}
            total={batchesQuery.data?.data?.total ?? 0}
            onPageChange={setPage}
            onWriteOff={setWriteOff}
          />
        </TabsContent>
        <TabsContent value="history">
          <MovementTable giftId={id} />
        </TabsContent>
      </Tabs>

      <StockInDialog giftId={id} open={stockInOpen} onOpenChange={setStockInOpen} />
      <AdjustDialog batch={writeOff} onClose={() => setWriteOff(null)} />
    </div>
  );
}
