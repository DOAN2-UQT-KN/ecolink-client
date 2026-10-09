import type { InputHTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';
import { TbPhotoPlus } from 'react-icons/tb';

import { cn } from '@/libs/utils';

/** The dashed "add photos" button: a label wrapping a hidden file input. */
export function UploadLabel({
  busy,
  label,
  inputProps,
  fit = false,
}: {
  busy: boolean;
  label: string;
  inputProps: InputHTMLAttributes<HTMLInputElement>;
  /** Shrink to its content (`w-fit`). */
  fit?: boolean;
}) {
  const { t } = useTranslation('common');
  return (
    <label
      className={cn(
        fit
          ? 'inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-[rgba(136,122,71,0.6)] px-3 py-2 text-sm text-button-accent hover:bg-white/70'
          : 'inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-[rgba(136,122,71,0.6)] px-3 py-2 text-sm text-button-accent hover:bg-white/70',
        busy && 'pointer-events-none opacity-60',
      )}
    >
      <TbPhotoPlus className="size-4" aria-hidden />
      {busy ? `${t('Uploading')}…` : label}
      <input type="file" className="hidden" {...inputProps} disabled={busy} />
    </label>
  );
}
