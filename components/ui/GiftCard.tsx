'use client';

import { memo, useCallback, useMemo } from 'react';
import Image from 'next/image';

import type { IGift } from '@/apis/gift/models/gift';
import { cn } from '@/libs/utils';
import bannerDefault from '@/public/banner-default.jpg';
import { Button } from '../client/shared/Button';
import { TbCoinFilled } from 'react-icons/tb';
import { ConfirmPopover } from '@/components/admin/shared/ConfirmPopover';
import { useTranslation } from 'react-i18next';

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
  const imageSrc = useMemo(
    () => (gift.mediaId.startsWith('http') ? gift.mediaId : bannerDefault),
    [gift.mediaId],
  );

  const stockLabel = useMemo(() => {
    if (gift.stockRemaining === null) return 'Unlimited';
    return `${gift.stockRemaining} left`;
  }, [gift.stockRemaining]);

  const handleExchange = useCallback(() => onExchange(gift), [gift, onExchange]);

  return (
    <article
      className={cn(
        'bg-white flex h-full flex-col rounded-[15px] border border-[rgba(136,122,71,0.5)] p-4 shadow-sm',
        'gap-3',
        className,
      )}
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-[#edf3e6]">
        <Image
          src={imageSrc}
          alt={gift.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <div className="absolute right-2 top-2 rounded-[5px] bg-background-primary px-2.5 py-1.5 text-xs font-semibold text-button-accent shadow-sm flex flex-row items-center justify-center gap-1">
          <TbCoinFilled className="inline-block size-4 text-yellow-500" />
          {gift.greenPoints}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex flex-row items-center justify-between">
          <h3 className="line-clamp-2 font-serif text-lg font-bold text-button-accent">
            {gift.name}
          </h3>
          <p className="font-display-1 text-foreground-secondary">{stockLabel}</p>
        </div>
        <p className="line-clamp-2 font-display-1 text-foreground-secondary">{gift.description}</p>
      </div>

      <div className="mt-auto flex items-left justify-end gap-3 pt-1">
        <ConfirmPopover
          theme="light"
          title={t('Exchange this reward?')}
          description={t('You will spend {{points}} GP to redeem «{{name}}».', {
            points: gift.greenPoints,
            name: gift.name,
          })}
          confirmLabel={t('Exchange')}
          cancelLabel={t('Cancel')}
          onConfirm={handleExchange}
          confirmPending={exchangePending}
          trigger={
            <Button
              variant="brown"
              size="medium"
              className="!h-[45px]"
              isDisabled={exchangePending}
            >
              {t('Exchange')}
            </Button>
          }
        />
      </div>
    </article>
  );
});
