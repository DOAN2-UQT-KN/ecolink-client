import { memo, useCallback, useMemo } from 'react';
import { useLocalizedDisplay } from '@/hooks/useLocalizedDisplay';
import Image from '@/components/ui/AppImage';

import type { IGift } from '@/apis/gift/models/gift';
import { cn } from '@/libs/utils';
import bannerDefault from '@/public/banner-default.jpg';
import { ConfirmPopover } from '@/components/ui/ConfirmPopover';
import { Pill } from '@/components/ui/Pill';
import { Button } from '../client/shared/Button';
import { TbCoinFilled } from 'react-icons/tb';
import { useTranslation } from 'react-i18next';

/** At or below this many items the card warns that the gift is running out. */
const LOW_STOCK = 5;

type GiftCardProps = {
  gift: IGift;
  onExchange: (gift: IGift) => void;
  exchangePending?: boolean;
  className?: string;
};

export const GiftCard = memo(function GiftCard({
  gift,
  onExchange,
  exchangePending = false,
  className,
}: GiftCardProps) {
  const { t } = useTranslation();
  const { title, description } = useLocalizedDisplay();
  const name = title(gift);
  const summary = description(gift);
  const imageSrc = useMemo(
    () => (gift?.media?.url?.startsWith('http') ? gift.media?.url : bannerDefault),
    [gift.media?.url],
  );

  const outOfStock = gift.stockRemaining <= 0;
  const lowStock = !outOfStock && gift.stockRemaining <= LOW_STOCK;
  const sponsors = gift.sponsors ?? [];

  const handleExchange = useCallback(() => onExchange(gift), [gift, onExchange]);

  return (
    <article
      className={cn(
        'group flex h-full flex-col overflow-hidden rounded-[15px] border border-[rgba(136,122,71,0.35)] bg-white shadow-sm',
        'transition-shadow duration-200 hover:shadow-md',
        className,
      )}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#edf3e6]">
        <Image
          src={imageSrc}
          alt={name}
          fill
          className={cn(
            'object-cover transition-transform duration-300 motion-safe:group-hover:scale-[1.03]',
            outOfStock && 'grayscale',
          )}
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <div className="absolute left-3 top-3">
          {outOfStock ? (
            <Pill tone="red" className="bg-white">{t('Out of stock')}</Pill>
          ) : (
            <Pill tone={lowStock ? 'amber' : 'neutral'} className="bg-white/95">
              {lowStock
                ? t('Only {{count}} left', { count: gift.stockRemaining })
                : t('{{count}} left', { count: gift.stockRemaining })}
            </Pill>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1">
          <h3 className="line-clamp-2 font-display-4 font-semibold text-button-accent [overflow-wrap:anywhere]">
            {name}
          </h3>
          {summary ? (
            <p className="line-clamp-2 text-sm leading-relaxed text-foreground-secondary [overflow-wrap:anywhere]">
              {summary}
            </p>
          ) : null}
        </div>

        {sponsors.length > 0 ? (
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-foreground-secondary">
            <span>{t('Sponsored by')}</span>
            {sponsors.map((s) => (
              <span key={s.id} className="inline-flex min-w-0 items-center gap-1.5 font-medium text-button-accent">
                {s.logoUrl ? (
                  <span className="relative size-5 shrink-0 overflow-hidden rounded bg-white ring-1 ring-black/5">
                    <Image src={s.logoUrl} alt="" fill className="object-contain" sizes="20px" />
                  </span>
                ) : null}
                <span className="truncate">{s.name}</span>
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-[rgba(136,122,71,0.2)] pt-3">
          <p className="flex items-baseline gap-1 text-button-accent">
            <TbCoinFilled className="size-5 self-center text-yellow-500" aria-hidden />
            <span className="text-xl font-bold tabular-nums">{gift.greenPoints}</span>
            <span className="text-sm text-foreground-secondary">{t('points')}</span>
          </p>
          <ConfirmPopover
            theme="light"
            title={t('Exchange this reward?')}
            description={t('You will spend {{points}} SP to redeem «{{name}}».', {
              points: gift.greenPoints,
              name,
            })}
            confirmLabel={t('Exchange')}
            cancelLabel={t('Cancel')}
            onConfirm={handleExchange}
            confirmPending={exchangePending}
            trigger={
              <Button
                variant="brown"
                size="medium"
                className="!h-[44px] shrink-0"
                isDisabled={exchangePending || outOfStock}
              >
                {outOfStock ? t('Out of stock') : t('Exchange')}
              </Button>
            }
          />
        </div>
      </div>
    </article>
  );
});
