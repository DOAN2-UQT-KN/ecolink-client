import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { TbTrash } from 'react-icons/tb';

import type {
  IResultPhotoCheck,
  IShiftMedia,
  IShiftResult,
  IShiftResultReport,
} from '@/apis/campaign/shiftResult';
import { Pill } from '@/components/ui/Pill';
import { cn } from '@/libs/utils';
import { REPORT_LABEL, REPORT_TONE, type ReportChoice } from '@/constants/campaignVerification';
import { checksByUrl, Layer1Summary, PhotoCheckBadge } from './ResultVerificationBadges';

export const Thumb = /* @__PURE__ */ memo(function Thumb({
  url,
  kind = 'image',
  onRemove,
  className,
}: {
  url: string;
  kind?: 'image' | 'video';
  onRemove?: () => void;
  className?: string;
}) {
  const { t } = useTranslation('common');
  return (
    <div className={cn('group relative size-24 overflow-hidden rounded-lg border border-border/60 bg-white', className)}>
      {kind === 'video' ? (
        <video src={url} className="size-full object-cover" muted playsInline controls />
      ) : (
        <a href={url} target="_blank" rel="noreferrer">
          <img src={url} alt="" className="size-full object-cover" loading="lazy" />
        </a>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={t('Remove')}
          title={t('Remove')}
          className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-90 hover:opacity-100"
        >
          <TbTrash className="size-3.5" aria-hidden />
        </button>
      )}
    </div>
  );
});

/** A trash point photo with its Layer 1 badge (pass / warning / fail) in the corner. */
export const CheckedThumb = /* @__PURE__ */ memo(function CheckedThumb({
  url,
  check,
  onRemove,
  className,
}: {
  url: string;
  /** null: saved before photos were checked. */
  check: IResultPhotoCheck | null;
  onRemove?: () => void;
  className?: string;
}) {
  return (
    <div className="relative w-fit">
      <Thumb url={url} onRemove={onRemove} className={className} />
      <PhotoCheckBadge check={check} className="absolute bottom-1 left-1 shadow-sm" />
    </div>
  );
});

/** Description, bags and kg of a saved shift result. */
export const ShiftResultAmounts = /* @__PURE__ */ memo(function ShiftResultAmounts({ result }: { result: IShiftResult }) {
  const { t } = useTranslation('common');
  return (
    <>
      <p className="whitespace-pre-wrap">{result.description}</p>
      <div className="flex flex-wrap gap-4">
        <span>
          <span className="text-foreground-tertiary">{t('Bags')}: </span>
          <span className="font-medium tabular-nums">{result.waste_bags ?? '—'}</span>
        </span>
        <span>
          <span className="text-foreground-tertiary">{t('Weight (kg)')}: </span>
          <span className="font-medium tabular-nums">{result.waste_kg ?? '—'}</span>
        </span>
      </div>
    </>
  );
});

/**
 * Each waste point of the shift: its status in the result and the photos before / after, each with
 * its Layer 1 badge, and the point's Layer 1 grade.
 */
export const ShiftResultWastePoints = /* @__PURE__ */ memo(function ShiftResultWastePoints({
  reportIds,
  reports,
  reportTitle,
  thumbClassName,
}: {
  reportIds: string[];
  reports: IShiftResultReport[];
  reportTitle: (id: string) => string;
  thumbClassName?: string;
}) {
  const { t } = useTranslation('common');
  const handled = new Map(reports.map((r) => [r.report_id, r]));
  return (
    <>
      {reportIds.map((id) => {
        const r = handled.get(id);
        const choice: ReportChoice = r?.status ?? 'none';
        const checks = checksByUrl(r?.layer1);
        return (
          <div key={id} className="rounded-lg border border-[rgba(136,122,71,0.3)] bg-white/70 p-3">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="font-medium">{reportTitle(id)}</span>
              <Pill tone={REPORT_TONE[choice]}>{t(REPORT_LABEL[choice])}</Pill>
            </div>
            {r?.layer1 && <Layer1Summary layer1={r.layer1} className="mb-2" />}
            {r && (
              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    [t('Before'), r.before_urls],
                    [t('After'), r.after_urls],
                  ] as const
                ).map(([label, urls]) => (
                  <div key={label}>
                    <span className="text-xs text-foreground-tertiary">{label}</span>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {urls.map((u) =>
                        r.layer1 ? (
                          <CheckedThumb key={u} url={u} check={checks.get(u) ?? null} className={thumbClassName} />
                        ) : (
                          <Thumb key={u} url={u} className={thumbClassName} />
                        ),
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
});

/** Photos and videos of the shift's pool that went into the result (read-only). */
export const ShiftResultIncludedMedia = /* @__PURE__ */ memo(function ShiftResultIncludedMedia({
  media,
  thumbClassName,
}: {
  media: IShiftMedia[];
  thumbClassName?: string;
}) {
  const { t } = useTranslation('common');
  const included = media.filter((m) => m.included_in_result);
  if (included.length === 0) {
    return <p className="text-sm text-foreground-tertiary">{t('No photos yet')}</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {included.map((m) => (
        <Thumb key={m.id} url={m.url} kind={m.kind} className={thumbClassName} />
      ))}
    </div>
  );
});

/**
 * Read-only view of a shift result (spec 4.2): description, amounts and every waste point of the
 * meeting point. Used by the shift page (ShiftResultPanel) and the Progress tab popover.
 */
export const ShiftResultView = /* @__PURE__ */ memo(function ShiftResultView({
  result,
  reportIds,
  started,
  reportTitle,
}: {
  result: IShiftResult | null;
  reportIds: string[];
  started: boolean;
  reportTitle: (id: string) => string;
}) {
  const { t } = useTranslation('common');
  if (!result) {
    return (
      <p className="mb-4 text-sm text-foreground-tertiary">
        {started ? t('The result has not been submitted yet.') : t('The shift has not started yet.')}
      </p>
    );
  }
  return (
    <div className="mb-6 flex flex-col gap-4 text-sm">
      <ShiftResultAmounts result={result} />
      {reportIds.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">{t('Waste points')}</h3>
          <ShiftResultWastePoints reportIds={reportIds} reports={result.reports} reportTitle={reportTitle} />
        </div>
      )}
    </div>
  );
});
