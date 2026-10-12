import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import type { IVerificationTrashPoint } from '@/apis/campaign/models/verification';
import { Pill } from '@/components/ui/Pill';
import { Link } from '@/libs/router';
import { cn } from '@/libs/utils';
import { checksByUrl, CheckedThumb, Layer1Summary, Thumb, TrashPointResultPill } from '@/modules/CampaignVerification';

/** One trash point of a meeting point: photos with their checks, how it was declared, Layer 1. */
export const TrashPointItem = memo(function TrashPointItem({
  trashPoint,
  title,
  failed,
}: {
  trashPoint: IVerificationTrashPoint;
  title: string;
  /** The meeting point was rejected and this trash point did not pass. */
  failed: boolean;
}) {
  const { t } = useTranslation('common');
  const checks = checksByUrl(trashPoint.layer1);
  const inRound = trashPoint.status === 'cleaned';
  return (
    <li
      className={cn(
        'flex flex-col gap-3 rounded-lg border border-[rgba(136,122,71,0.25)] bg-white/60 p-3',
        !inRound && 'opacity-80',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="flex flex-wrap items-center gap-1.5">
            <Link
              href={`/incidents/${trashPoint.report_id}`}
              className="font-medium text-button-accent underline-offset-2 hover:underline"
            >
              {title}
            </Link>
            {trashPoint.is_mine && <Pill tone="brand">{t('You reported this')}</Pill>}
          </span>
          {trashPoint.report?.detail_address && (
            <span className="text-xs text-foreground-tertiary">{trashPoint.report.detail_address}</span>
          )}
        </div>
        <span className="flex flex-wrap items-center gap-1.5">
          {failed && <Pill tone="red">{t('Did not pass')}</Pill>}
          <TrashPointResultPill status={trashPoint.status} />
        </span>
      </div>
      {!inRound && (
        <p className="text-xs text-foreground-tertiary">{t('Not declared cleaned: shown for reference, not voted on.')}</p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {(
          [
            ['Before', trashPoint.before_urls],
            ['After', trashPoint.after_urls],
          ] as const
        ).map(([label, urls]) => (
          <div key={label} className="flex flex-col gap-1">
            <span className="text-xs text-foreground-tertiary">{t(label)}</span>
            {urls.length === 0 ? (
              <span className="text-sm text-foreground-tertiary">—</span>
            ) : (
              <div className="flex flex-wrap gap-2">
                {urls.map((u) =>
                  trashPoint.layer1 ? (
                    <CheckedThumb key={u} url={u} check={checks.get(u) ?? null} />
                  ) : (
                    <Thumb key={u} url={u} />
                  ),
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      {trashPoint.layer1 && <Layer1Summary layer1={trashPoint.layer1} />}
    </li>
  );
});
