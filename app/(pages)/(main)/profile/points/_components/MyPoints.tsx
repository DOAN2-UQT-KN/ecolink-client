import { memo } from 'react';

import usePointsContext from '../_hooks/usePointsContext';
import { formatPoints } from '../_services/points.service';
import { formattedDate } from '@/utils/formattedDate';

import { TbClockExclamation, TbCoinFilled, TbLeaf } from 'react-icons/tb';
import { useTranslation } from 'react-i18next';

const MyPoints = memo(function MyPoints() {
  const { points, isLoading } = usePointsContext();

  const { t } = useTranslation();
  const expiringAt = points?.expiringSoon?.earliestAt;

  const cards = [
    {
      key: 'balance',
      icon: <TbCoinFilled className="inline-block size-8 text-yellow-500" />,
      label: t('Current points'),
      value: points?.balance,
      note: null,
    },
    {
      key: 'expiring',
      icon: <TbClockExclamation className="inline-block size-8 text-amber-600" />,
      label: t('Expiring soon'),
      value: points?.expiringSoon?.amount,
      note: expiringAt ? t('Expiring by', { date: formattedDate(expiringAt) }) : null,
    },
    {
      key: 'earned',
      icon: <TbLeaf className="inline-block size-8 text-emerald-600" />,
      label: t('Total earned'),
      value: points?.earnedTotal,
      note: null,
    },
  ];

  return (
    <section className="rounded-xl border border-[rgba(136,122,71,0.35)] bg-white p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-button-accent">{t('My points')}</h2>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <div key={card.key} className="rounded-lg border border-[rgba(136,122,71,0.35)] bg-background/20 p-4">
            <div className="flex items-center gap-2 text-sm text-foreground-secondary">
              {card.icon}
              {card.label}
            </div>
            <div className="mt-2 font-display-4 font-semibold tabular-nums">
              {isLoading ? '...' : formatPoints(card.value)}
            </div>
            {card.note && <p className="mt-1 text-xs text-foreground-secondary">{card.note}</p>}
          </div>
        ))}
      </div>
    </section>
  );
});

export default MyPoints;
