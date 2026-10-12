import { useTranslation } from 'react-i18next';

import type { IResultPhotoCheck, IShiftResultReport, ResultPhotoSide } from '@/apis/campaign/models/shiftResult';
import type { IIncident } from '@/apis/incident/models/incident';
import { Pill } from '@/components/ui/Pill';
import { CHECK_LEVEL_LABEL, CHECK_LEVEL_TONE, REPORT_LABEL } from '@/constants/campaignVerification';
import { cn } from '@/libs/utils';
import { CheckedThumb, Layer1Summary } from '@/modules/CampaignVerification';
import {
  defaultPinOf,
  MAX_PHOTOS_PER_SIDE,
  sameUrls,
  worstLevel,
  type PhotoChecks,
  type ReportDraft,
} from '../_services/shiftResult.service';
import { ResultPhotoButton } from './ResultPhotoButton';

/** One waste point in the result form: its status, then photos before / after with their checks. */
export function ShiftResultReportEditor({
  campaignId,
  shiftId,
  id,
  title,
  draft: d,
  saved,
  checks,
  incident,
  setDraft,
  onPhotosUploaded,
}: {
  campaignId: string;
  shiftId: string;
  id: string;
  title: string;
  draft: ReportDraft;
  saved: IShiftResultReport | undefined;
  checks: PhotoChecks;
  incident: IIncident | undefined;
  setDraft: (id: string, patch: Partial<ReportDraft>) => void;
  onPhotosUploaded: (side: ResultPhotoSide, items: Array<{ url: string; check: IResultPhotoCheck }>) => void;
}) {
  const { t } = useTranslation('common');
  const unchanged = saved != null && sameUrls(saved.before_urls, d.before) && sameUrls(saved.after_urls, d.after);
  const photos = [...d.before, ...d.after];
  const worst = worstLevel(photos, checks);
  return (
    <div className="rounded-lg border border-[rgba(136,122,71,0.3)] bg-white/70 p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium">{title}</span>
        {/* kept: ui/radio-group renders circle radios; these pills already expose radiogroup/radio ARIA. */}
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={title}>
          {(['cleaned', 'partial', 'none'] as const).map((choice) => (
            <button
              key={choice}
              type="button"
              role="radio"
              aria-checked={d.status === choice}
              onClick={() => setDraft(id, { status: choice })}
              className={cn(
                'rounded-full border px-3 py-1 text-xs transition-colors',
                d.status === choice
                  ? 'border-button-accent bg-button-accent text-white'
                  : 'border-[rgba(136,122,71,0.4)] hover:bg-white',
              )}
            >
              {t(REPORT_LABEL[choice])}
            </button>
          ))}
        </div>
      </div>
      {d.status !== 'none' &&
        (unchanged && saved?.layer1 ? (
          <Layer1Summary layer1={saved.layer1} className="mb-2" />
        ) : photos.length > 0 ? (
          <span className="mb-2 flex flex-wrap items-center gap-1.5 text-xs text-foreground-tertiary">
            {t('Photo check')}
            <Pill tone={CHECK_LEVEL_TONE[worst]}>{t(CHECK_LEVEL_LABEL[worst])}</Pill>
            {t('The pair of photos is checked again when you save.')}
          </span>
        ) : null)}
      {d.status !== 'none' && (
        <div className="grid gap-3 sm:grid-cols-2">
          {(['before', 'after'] as const).map((side) => (
            <div key={side} className="flex flex-col gap-1.5">
              <span className="text-xs text-foreground-tertiary">
                {side === 'before' ? `${t('Before')} ${t('(optional)')}` : t('After')}
              </span>
              <div className="flex flex-wrap gap-2">
                {d[side].map((u) => (
                  <CheckedThumb
                    key={u}
                    url={u}
                    check={checks[u] ?? null}
                    onRemove={() => setDraft(id, { [side]: d[side].filter((x) => x !== u) })}
                  />
                ))}
              </div>
              {d[side].length < MAX_PHOTOS_PER_SIDE && (
                <ResultPhotoButton
                  campaignId={campaignId}
                  shiftId={shiftId}
                  reportId={id}
                  side={side}
                  remaining={MAX_PHOTOS_PER_SIDE - d[side].length}
                  defaultPin={defaultPinOf(incident)}
                  pointTitle={title}
                  onUploaded={(items) => onPhotosUploaded(side, items)}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
