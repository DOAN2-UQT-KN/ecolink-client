import type { Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import { TbVideo } from 'react-icons/tb';

import type { IShiftMedia, IShiftResultView } from '@/apis/campaign/models/shiftResult';
import { Checkbox } from '@/components/ui/checkbox';
import { Pill } from '@/components/ui/Pill';
import { cn } from '@/libs/utils';
import { Thumb } from '@/modules/CampaignVerification';
import useAuthStore from '@/stores/useAuthStore';
import type { UploadedMedia } from '../_services/shiftResult.service';
import { MediaUploadButton } from './MediaUploadButton';

/** The shift's photo pool: volunteers add to it; whoever edits the result ticks what goes in. */
export function ShiftMediaPool({
  view,
  editing,
  editable,
  picked,
  setPicked,
  onUploaded,
  onRemove,
}: {
  view: IShiftResultView;
  editing: boolean;
  editable: boolean;
  picked: Set<string>;
  setPicked: Dispatch<SetStateAction<Set<string>>>;
  onUploaded: (items: UploadedMedia[]) => Promise<void>;
  onRemove: (mediaId: string) => void;
}) {
  const { t } = useTranslation('common');
  const currentUserId = useAuthStore((s) => s.user?.id);
  const myMedia = (m: IShiftMedia) => m.uploaded_by === currentUserId;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{t('Shift activity photos')}</h3>
        {/* Volunteers who attended add photos any time; whoever edits the result does it in Edit. */}
        {((editing && editable) || (view.can_contribute && !view.can_edit && !view.locked)) && (
          <MediaUploadButton
            label={t('Add photos or videos')}
            accept="image/*,video/*"
            allowVideo
            onUploaded={onUploaded}
          />
        )}
      </div>
      {editing && editable && view.media.length > 0 && (
        <p className="text-xs text-foreground-tertiary">{t('Tick the photos that go into the result.')}</p>
      )}
      {view.media.length === 0 ? (
        <p className="text-sm text-foreground-tertiary">{t('No photos yet')}</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {view.media.map((m) => (
            <div key={m.id} className="flex flex-col gap-1">
              <Thumb
                url={m.url}
                kind={m.kind}
                onRemove={
                  !view.locked && (editing && editable ? view.can_edit : myMedia(m))
                    ? () => onRemove(m.id)
                    : undefined
                }
                className={cn(picked.has(m.id) && 'ring-2 ring-emerald-500')}
              />
              {editing && editable ? (
                <label className="flex items-center gap-1.5 text-xs">
                  <Checkbox
                    checked={picked.has(m.id)}
                    onCheckedChange={(v) =>
                      setPicked((prev) => {
                        const next = new Set(prev);
                        if (v) next.add(m.id);
                        else next.delete(m.id);
                        return next;
                      })
                    }
                  />
                  {t('In result')}
                </label>
              ) : m.included_in_result ? (
                <Pill tone="green" className="w-fit">
                  {t('In result')}
                </Pill>
              ) : null}
              <span className="max-w-24 truncate text-[11px] text-foreground-tertiary">
                {m.kind === 'video' && <TbVideo className="mr-0.5 inline size-3" aria-hidden />}
                {myMedia(m) ? t('You') : m.uploader?.name || t('Volunteer')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
