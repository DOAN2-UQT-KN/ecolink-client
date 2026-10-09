import { useTranslation } from 'react-i18next';

import type { IVerificationTrashPoint } from '@/apis/campaign/verification';
import { Button } from '@/components/client/shared/Button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Thumb } from '@/modules/CampaignVerification';
import { UploadLabel } from '../../_components/UploadLabel';
import type { useMeetingPointVote } from '../_hooks/useMeetingPointVote';
import { NOTE_MAX } from '../_services/verification.service';

/** The "not clean" vote: which waste points, and a note or a photo saying what is left. */
export function NotCleanForm({
  meetingPointId,
  cleaned,
  titleById,
  form,
}: {
  meetingPointId: string;
  cleaned: IVerificationTrashPoint[];
  titleById: Map<string, string>;
  form: ReturnType<typeof useMeetingPointVote>;
}) {
  const { t } = useTranslation('common');
  const { busy, uploading, photoUrl, formError } = form;
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-[rgba(136,122,71,0.3)] bg-white/70 p-3">
      <span className="text-sm font-medium">
        {t('Which waste points are not clean?')} <span className="text-destructive">*</span>
      </span>
      <div className="flex flex-col gap-1.5">
        {cleaned.map((tp) => {
          const id = `flag-${meetingPointId}-${tp.report_id}`;
          return (
            <label key={tp.report_id} htmlFor={id} className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                id={id}
                checked={form.flagged.includes(tp.report_id)}
                disabled={busy}
                onCheckedChange={(v) => form.toggleFlagged(tp.report_id, v === true)}
              />
              {titleById.get(tp.report_id)}
            </label>
          );
        })}
      </div>
      <span className="text-sm font-medium">{t('What is not clean? Add a note or a photo.')}</span>
      <Textarea
        rows={3}
        value={form.note}
        maxLength={NOTE_MAX}
        placeholder={t('Describe what is still there')}
        onChange={(e) => form.onNoteChange(e.target.value)}
      />
      <div className="flex flex-wrap items-center gap-2">
        {photoUrl && <Thumb url={photoUrl} onRemove={() => form.setPhotoUrl(null)} />}
        {!photoUrl && (
          <UploadLabel
            busy={uploading}
            fit
            label={t('Add a photo')}
            inputProps={{ accept: 'image/*', onChange: form.onPickPhoto }}
          />
        )}
      </div>
      {formError && <p className="text-xs text-destructive">{formError}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outlined-brown" size="medium" isDisabled={busy} onClick={form.cancelDown}>
          {t('Cancel')}
        </Button>
        <Button
          type="button"
          variant="brown"
          size="medium"
          className="w-fit"
          isLoading={form.acting === 'submit'}
          isDisabled={busy || uploading}
          onClick={() => void form.vote('down')}
        >
          {t('Submit')}
        </Button>
      </div>
    </div>
  );
}
