import { useTranslation } from 'react-i18next';
import { TbPhone } from 'react-icons/tb';

import { SOS_EMERGENCY_NUMBER } from '@/constants/sos';
import { cn } from '@/libs/utils';

/** Medical SOS: the app always reminds to call the emergency number first. */
export function Call115Banner({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <a
      href={`tel:${SOS_EMERGENCY_NUMBER}`}
      className={cn(
        'flex items-center gap-4 rounded-xl bg-sos-medical px-5 py-4 text-white shadow-lg transition hover:brightness-110',
        className,
      )}
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white/20">
        <TbPhone className="size-7" aria-hidden />
      </span>
      <span className="flex flex-col">
        <span className="text-2xl font-bold leading-tight">
          {t('Call {{number}}', { number: SOS_EMERGENCY_NUMBER })}
        </span>
        <span className="text-sm text-white/90">
          {t('Call the ambulance first. An SOS in the app does not replace emergency services.')}
        </span>
      </span>
    </a>
  );
}
