import { useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { uploadToCloudinary } from '@/libs/cloudinary';
import { compressImage } from '@/libs/compressImage';
import showMessage, { MessageLevel, MessageType } from '@/utils/showMessage';
import { MAX_RESULT_MEDIA, MAX_VIDEO_BYTES, type UploadedMedia } from '../_services/shiftResult.service';
import { UploadLabel } from './UploadLabel';

/** Uploads picked photos (compressed) and videos (≤ 100 MB) to Cloudinary. */
async function uploadPicked(
  files: File[],
  t: (key: string, options?: Record<string, unknown>) => string,
  allowVideo: boolean,
): Promise<UploadedMedia[]> {
  const out: UploadedMedia[] = [];
  for (const file of files.slice(0, MAX_RESULT_MEDIA)) {
    if (allowVideo && file.type.startsWith('video/')) {
      if (file.size > MAX_VIDEO_BYTES) {
        showMessage({
          type: MessageType.Toast,
          level: MessageLevel.Error,
          title: t('Video must be at most {{mb}} MB.', { mb: 100 }),
        });
        continue;
      }
      out.push({ url: await uploadToCloudinary(file), kind: 'video' });
    } else if (file.type.startsWith('image/')) {
      out.push({ url: await uploadToCloudinary(await compressImage(file)), kind: 'image' });
    } else {
      showMessage({
        type: MessageType.Toast,
        level: MessageLevel.Warning,
        title: allowVideo ? t('Unsupported file type. Use images or video.') : t('Use images only.'),
      });
    }
  }
  return out;
}

/** A file button that uploads what is picked and hands back the URLs. */
export function MediaUploadButton({
  label,
  accept,
  allowVideo,
  onUploaded,
}: {
  label: string;
  accept: string;
  allowVideo: boolean;
  onUploaded: (items: UploadedMedia[]) => Promise<void> | void;
}) {
  const { t } = useTranslation('common');
  const [busy, setBusy] = useState(false);
  const onChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;
    if (files.length > MAX_RESULT_MEDIA) {
      showMessage({
        type: MessageType.Toast,
        level: MessageLevel.Warning,
        title: t('Only {{count}} files were added because of the limit.', { count: MAX_RESULT_MEDIA }),
      });
    }
    setBusy(true);
    try {
      const items = await uploadPicked(files, t, allowVideo);
      if (items.length > 0) await onUploaded(items);
    } catch {
      showMessage({ type: MessageType.Toast, level: MessageLevel.Error, title: t('Failed to upload some media.') });
    } finally {
      setBusy(false);
    }
  };
  return <UploadLabel busy={busy} label={label} inputProps={{ accept, multiple: true, onChange }} />;
}
