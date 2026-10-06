import { useTranslation } from 'react-i18next';

import type { SosState, SosType } from '@/apis/sos/models/sos';
import { Pill } from '@/components/ui/Pill';
import { SOS_STATE_META, SOS_TYPE_META } from '@/constants/sos';
import { cn } from '@/libs/utils';

/** Type tag in the type's own colour (map, lists, detail). */
export function SosTypeBadge({ type, className }: { type: SosType; className?: string }) {
  const { t } = useTranslation();
  const meta = SOS_TYPE_META[type];
  const Icon = meta.icon;
  return (
    <Pill
      tone={meta.tone}
      className={cn(meta.bgClass, meta.textClass, meta.borderClass, className)}
    >
      <Icon className="size-3.5" aria-hidden />
      {t(meta.label)}
    </Pill>
  );
}

export function SosStatePill({ state }: { state: SosState }) {
  const { t } = useTranslation();
  const meta = SOS_STATE_META[state];
  return <Pill tone={meta.tone}>{t(meta.label)}</Pill>;
}
