'use client';

import { useCallback, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { Control, FieldValues, Path } from 'react-hook-form';
import { useController } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { compressImage } from '@/libs/compressImage';
import { useImagePreviewSrc } from '@/libs/useImagePreviewSrc';
import { cn } from '@/libs/utils';

type SingleImageFileFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
  disabled?: boolean;
  helperText?: ReactNode;
  /** Outer preview frame (default 200×200). */
  frameClassName?: string;
  isDark?: boolean;
};

function isNonEmptyImage(value: unknown): value is File | Blob | string {
  if (value === '' || value == null) return false;
  return true;
}

/**
 * One image slot with the same pipeline as incident FileUpload: pick file → compress → store Blob in RHF.
 */
export function SingleImageFileField<T extends FieldValues>({
  control,
  name,
  label,
  disabled,
  helperText,
  frameClassName,
  isDark,
}: SingleImageFileFieldProps<T>) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [compressing, setCompressing] = useState(false);

  const { field } = useController<T>({ control, name });

  const previewSrc = useImagePreviewSrc(field.value);

  const onPick = () => inputRef.current?.click();

  const onChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        toast.error(t('Please choose an image file.'));
        return;
      }
      setCompressing(true);
      try {
        const blob = await compressImage(file);
        field.onChange(blob);
      } catch (err) {
        console.error(err);
        toast.error(t('Failed to compress some images.'));
      } finally {
        setCompressing(false);
      }
    },
    [field, t],
  );

  const onRemove = () => field.onChange('');

  const busy = Boolean(disabled || compressing);

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        className="sr-only"
        onChange={onChange}
        disabled={busy}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onPick} disabled={busy}>
          {compressing ? t('Compressing...') : t('Select files')}
        </Button>
        {isNonEmptyImage(field.value) ? (
          <Button type="button" variant="ghost" size="sm" onClick={onRemove} disabled={busy}>
            {t('Remove')}
          </Button>
        ) : null}
      </div>
      {helperText ? <p className="text-muted-foreground mt-1 text-xs">{helperText}</p> : null}
      <div
        className={cn(
          'mt-2 flex w-[200px]  shrink-0 items-center justify-center overflow-hidden rounded-md border',
          isDark ? 'border-zinc-700 bg-zinc-800/50' : 'border-zinc-200 bg-zinc-100',
          frameClassName,
        )}
        style={{ minHeight: '200px' }}
      >
        {previewSrc ? (
          // eslint-disable-next-line @next/next/no-img-element -- blob: previews
          <img src={previewSrc} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-muted-foreground px-2 text-center text-xs">
            {t('No image selected')}
          </span>
        )}
      </div>
    </Field>
  );
}
