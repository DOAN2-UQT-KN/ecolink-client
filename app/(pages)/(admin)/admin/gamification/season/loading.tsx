'use client';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';

export default function LoadingAdminGamificationSeasonPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <span className="sr-only">{t('Loading')}</span>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-[45px] w-44 shrink-0" />
      </div>
      <Skeleton className="h-36 w-full rounded-[10px]" />
      <Skeleton className="h-96 w-full rounded-[10px]" />
    </div>
  );
}
