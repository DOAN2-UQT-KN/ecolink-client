import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { remainingParts } from '../_services/verification.service';

/** Re-renders every minute for the countdowns. */
export function useNow(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

/** Formats the time left until `iso`, e.g. "2 h 5 min". */
export function useRemaining() {
  const { t } = useTranslation('common');
  return (iso: string, now: number) => {
    const { h, m } = remainingParts(iso, now);
    return h > 0 ? t('{{h}} h {{m}} min', { h, m }) : t('{{m}} min', { m });
  };
}
