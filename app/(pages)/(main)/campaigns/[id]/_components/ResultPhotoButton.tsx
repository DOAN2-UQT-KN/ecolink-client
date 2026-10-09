import { useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';

import type { LatLngLiteral } from 'leaflet';

import { useUploadResultPhoto, type IResultPhotoCheck, type ResultPhotoSide } from '@/apis/campaign/shiftResult';
import showMessage, { MessageLevel, MessageType } from '@/utils/showMessage';
import { isImageFile, MAX_RESULT_PHOTO_BYTES } from '../_services/shiftResult.service';
import { ResultPhotoPinDialog } from './ResultPhotoPinDialog';
import { UploadLabel } from './UploadLabel';

/**
 * Photos before / after of a waste point (result verification, Layer 1): picked, pinned on the map
 * (starting at the waste point), then uploaded one by one as originals; the server grades each.
 */
export function ResultPhotoButton({
  campaignId,
  shiftId,
  reportId,
  side,
  remaining,
  defaultPin,
  pointTitle,
  onUploaded,
}: {
  campaignId: string;
  shiftId: string;
  reportId: string;
  side: ResultPhotoSide;
  remaining: number;
  defaultPin: LatLngLiteral | null;
  pointTitle: string;
  onUploaded: (items: Array<{ url: string; check: IResultPhotoCheck }>) => void;
}) {
  const { t } = useTranslation('common');
  const [pending, setPending] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const { mutateAsync: upload } = useUploadResultPhoto();

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    const ok: File[] = [];
    for (const file of files) {
      if (!isImageFile(file)) {
        showMessage({ type: MessageType.Toast, level: MessageLevel.Warning, title: t('Use images only.') });
      } else if (file.size > MAX_RESULT_PHOTO_BYTES) {
        showMessage({
          type: MessageType.Toast,
          level: MessageLevel.Error,
          title: t('{{name}} is larger than {{mb}} MB.', { name: file.name, mb: 15 }),
        });
      } else {
        ok.push(file);
      }
    }
    if (ok.length > remaining) {
      showMessage({
        type: MessageType.Toast,
        level: MessageLevel.Warning,
        title: t('Only {{count}} files were added because of the limit.', { count: remaining }),
      });
    }
    setPending(ok.slice(0, remaining));
  };

  const onPin = async (pin: LatLngLiteral) => {
    const files = pending;
    setPending([]);
    setBusy(true);
    const out: Array<{ url: string; check: IResultPhotoCheck }> = [];
    try {
      for (const file of files) {
        try {
          const res = await upload({
            campaign_id: campaignId,
            shift_id: shiftId,
            file,
            report_id: reportId,
            side,
            pin_lat: pin.lat,
            pin_lng: pin.lng,
          });
          out.push(res.data);
        } catch {
          // The error is already shown; carry on with the other photos.
        }
      }
    } finally {
      setBusy(false);
      if (out.length > 0) onUploaded(out);
    }
  };

  return (
    <>
      <UploadLabel
        busy={busy}
        fit
        label={t('Add photos')}
        inputProps={{ accept: 'image/*,.heic,.heif', multiple: true, onChange }}
      />
      <ResultPhotoPinDialog
        open={pending.length > 0}
        count={pending.length}
        defaultPin={defaultPin}
        pointTitle={pointTitle}
        onCancel={() => setPending([])}
        onConfirm={(pin) => void onPin(pin)}
      />
    </>
  );
}
