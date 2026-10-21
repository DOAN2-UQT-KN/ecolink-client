import { useTranslation } from 'react-i18next';

import type { GiftSourceStatus } from '@/apis/gift-source/models/giftSource';
import { Pill } from '@/components/ui/Pill';

export function GiftSourceStatusPill({ status, isDark }: { status: GiftSourceStatus; isDark: boolean }) {
  const { t } = useTranslation();
  return (
    <Pill tone={status === 'ACTIVE' ? 'green' : 'neutral'} isDark={isDark}>
      {status === 'ACTIVE' ? t('Partnering') : t('Stopped')}
    </Pill>
  );
}
