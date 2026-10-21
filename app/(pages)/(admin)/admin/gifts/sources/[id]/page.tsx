import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TbPencil } from 'react-icons/tb';

import { useGetGiftSource } from '@/apis/gift-source/getGiftSource';
import { useAdminLayout } from '@/app/(pages)/(admin)/_context/AdminLayoutContext';
import { Breadcrumbs, type BreadcrumbItemProps } from '@/components/client/shared/Breadcrumbs';
import Image from '@/components/ui/AppImage';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useParams } from '@/libs/router';
import { GiftSourceFormDialog } from '../_components/GiftSourceFormDialog';
import { GiftSourceStatusPill } from '../_components/GiftSourceStatusPill';
import { GIFT_SOURCE_TYPE_LABEL } from '../_services/giftSourceForm.service';
import { SourceBatchesTab } from './_components/SourceBatchesTab';
import { SourceReportTab } from './_components/SourceReportTab';

export default function AdminGiftSourceDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams() as { id: string };
  const { theme } = useAdminLayout();
  const isDark = theme === 'dark';
  const { data, isLoading, isError, refetch } = useGetGiftSource(id);
  const source = data?.data?.source;
  const [editOpen, setEditOpen] = useState(false);

  const breadcrumbs: BreadcrumbItemProps[] = useMemo(
    () => [
      { label: t('Dashboard'), path: '/admin', type: 'link' },
      { label: t('Gifts'), path: '/admin/gifts?tab=sources', type: 'link' },
      { label: source?.name ?? t('Gift source'), path: `/admin/gifts/sources/${id}`, type: 'page' },
    ],
    [id, source?.name, t],
  );

  const details: Array<[string, string]> = source
    ? [
        [t('Source type'), t(GIFT_SOURCE_TYPE_LABEL[source.type])],
        [t('Contact person'), source.contactName || '—'],
        [t('Phone number'), source.contactPhone || '—'],
        [t('Email'), source.contactEmail || '—'],
        [t('Shown as sponsor'), source.showOnGift ? t('Shown') : t('Not shown')],
        [t('Note'), source.note || '—'],
      ]
    : [];

  return (
    <div className="space-y-6">
      <Breadcrumbs breadcrumbs={breadcrumbs} isAdmin={true} />

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : isError || !source ? (
        <div className="rounded-[10px] border border-border bg-card p-6 text-sm">
          <p>{t('Could not load the gift source.')}</p>
          <Button type="button" variant="outline" onClick={() => refetch()} className="mt-3 cursor-pointer">
            {t('Retry')}
          </Button>
        </div>
      ) : (
        <section className="space-y-4 rounded-[10px] border border-border bg-card p-4">
          <div className="flex flex-wrap items-center gap-3">
            {source.logo ? (
              <span className="relative size-12 overflow-hidden rounded-md bg-white">
                <Image src={source.logo.url} alt={source.name} fill className="object-contain" sizes="48px" />
              </span>
            ) : null}
            <h2 className="min-w-0 font-display-3 font-semibold [overflow-wrap:anywhere]">{source.name}</h2>
            <GiftSourceStatusPill status={source.status} isDark={isDark} />
            <Button type="button" variant="outline" onClick={() => setEditOpen(true)} className="ml-auto cursor-pointer">
              <TbPencil className="size-4" aria-hidden />
              {t('Edit')}
            </Button>
          </div>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {details.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-foreground-secondary">{label}</dt>
                <dd className="text-sm [overflow-wrap:anywhere]">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <Tabs defaultValue="batches" className="gap-4">
        <TabsList className="h-10 border border-border bg-card">
          <TabsTrigger value="batches">{t('Batches received')}</TabsTrigger>
          <TabsTrigger value="report">{t('Report')}</TabsTrigger>
        </TabsList>
        <TabsContent value="batches">
          <SourceBatchesTab sourceId={id} />
        </TabsContent>
        <TabsContent value="report">
          <SourceReportTab sourceId={id} />
        </TabsContent>
      </Tabs>

      <GiftSourceFormDialog source={source} open={editOpen} onOpenChange={setEditOpen} />
    </div>
  );
}
