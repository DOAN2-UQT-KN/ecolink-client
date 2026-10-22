import { useEffect, useMemo, useState } from 'react';
import { Gift, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useGetGiftRedemptions } from '@/apis/gift/getGiftRedemptions';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';
import { usePathname, useRouter, useSearchParams } from '@/libs/router';
import { OrderCard } from './_components/OrderCard';

const PAGE_SIZE = 10;

function OrderCardSkeleton() {
  return (
    <article className="rounded-lg border border-[rgba(136,122,71,0.35)] bg-background/20 p-4">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="mt-3 h-4 w-2/3" />
      <Skeleton className="mt-2 h-4 w-1/2" />
    </article>
  );
}

export default function ProfileOrdersPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const code = useSearchParams().get('code') ?? '';
  const [page, setPage] = useState(1);
  const [codeInput, setCodeInput] = useState(code);
  const debouncedCode = useDebounce(codeInput.trim(), 300);
  useEffect(() => {
    // Keep the searched code in the URL (?code=) once typing pauses.
    if (debouncedCode === code) return;
    setPage(1);
    router.replace(debouncedCode ? `${pathname}?code=${encodeURIComponent(debouncedCode)}` : pathname, { scroll: false });
  }, [debouncedCode, code, pathname, router]);
  const request = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      code: code || undefined,
      sortBy: 'createdAt' as const,
      sortOrder: 'desc' as const,
    }),
    [page, code],
  );
  const { data, isLoading } = useGetGiftRedemptions(request);
  const redemptions = data?.data?.redemptions ?? [];
  const totalPages = Math.max(1, data?.data?.totalPages ?? 1);

  return (
    <section className="rounded-xl border border-[rgba(136,122,71,0.35)] bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-button-accent">{t('Orders')}</h2>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground-secondary" aria-hidden />
          <Input
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            placeholder={t('Order code')}
            aria-label={t('Search by order code')}
            className="!h-10 pl-9 font-mono"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="mt-4 space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <OrderCardSkeleton key={index} />
          ))}
        </div>
      ) : redemptions.length === 0 ? (
        <div className="mt-4">
          <Empty className="rounded-xl border border-[rgba(136,122,71,0.35)] bg-background/20 p-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Gift className="h-5 w-5 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle>{code ? t('No order matches this code') : t('No orders yet')}</EmptyTitle>
              <EmptyDescription>
                {code ? t('Check the code and try again.') : t('Redeemed gifts will appear here.')}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      ) : (
        <>
          <div className="mt-4 space-y-3">
            {redemptions.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-5 flex items-center justify-between border-t border-[rgba(136,122,71,0.35)] pt-4">
              <Button
                type="button"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                {t('Previous')}
              </Button>
              <span className="text-sm text-foreground-secondary">
                {t('Page')} {page} {t('of')} {totalPages}
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
        </>
      )}
    </section>
  );
}
