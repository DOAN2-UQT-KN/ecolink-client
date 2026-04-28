'use client';

import { useCallback, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { Control, FieldValues, Path } from 'react-hook-form';
import { useController } from 'react-hook-form';
import Cropper, { type Area } from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import { Image as AntdImage } from 'antd';
import { BiTrash } from 'react-icons/bi';
import { FaEye } from 'react-icons/fa';
import { IoDocumentAttachOutline } from 'react-icons/io5';
import { toast } from 'sonner';

import { Field, FieldLabel } from '@/components/ui/field';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { compressImage } from '@/libs/compressImage';
import { getCroppedImageBlob } from '@/libs/getCroppedImage';
import { useImagePreviewSrc } from '@/libs/useImagePreviewSrc';
import { cn } from '@/libs/utils';
import { Button } from '@/components/ui/button';

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
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState('');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const { field } = useController<T>({ control, name });

  const previewSrc = useImagePreviewSrc(field.value);

  const onPick = () => {
    if (disabled || compressing) return;
    inputRef.current?.click();
  };

  const revokeCropSrc = useCallback(() => {
    setCropSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return '';
    });
  }, []);

  const resetCropState = useCallback(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  }, []);

  const onCropDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setCropOpen(false);
        revokeCropSrc();
        resetCropState();
      }
    },
    [resetCropState, revokeCropSrc],
  );

  const onCropComplete = useCallback((_croppedArea: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        toast.error(t('Please choose an image file.'));
        return;
      }
      revokeCropSrc();
      resetCropState();
      setCropSrc(URL.createObjectURL(file));
      setCropOpen(true);
    },
    [resetCropState, revokeCropSrc, t],
  );

  const onRemove = () => field.onChange('');

  const busy = Boolean(disabled || compressing);

  const onApplyCrop = useCallback(async () => {
    if (!cropSrc || !croppedAreaPixels) {
      toast.error(t('Failed to crop image.'));
      return;
    }
    setCompressing(true);
    try {
      const raw = await getCroppedImageBlob(cropSrc, croppedAreaPixels);
      const blob = await compressImage(raw);
      field.onChange(blob);
      onCropDialogOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error(t('Failed to compress image.'));
    } finally {
      setCompressing(false);
    }
  }, [cropSrc, croppedAreaPixels, field, onCropDialogOpenChange, t]);

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
      {helperText ? <p className="text-muted-foreground mt-1 text-xs">{helperText}</p> : null}
      <div
        className={cn(
          'mt-2 relative flex w-[200px] shrink-0 items-center justify-center overflow-hidden rounded-md border border-dashed border-foreground-tertiary cursor-pointer group',
          frameClassName,
        )}
        style={{ minHeight: '200px' }}
        onClick={onPick}
        onKeyDown={(ev) => {
          if (ev.key === 'Enter' || ev.key === ' ') {
            ev.preventDefault();
            onPick();
          }
        }}
        role="button"
        tabIndex={busy ? -1 : 0}
        aria-disabled={busy}
      >
        {previewSrc ? (
          <>
            <AntdImage
              src={previewSrc}
              alt={label}
              width={'100%'}
              height={200}
              className="object-cover w-full h-full"
              preview={{
                cover: (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <FaEye size={24} />
                  </div>
                ),
              }}
            />
            {!busy ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRemove();
                }}
                className="absolute top-2 right-2 p-1.5 text-red-500 bg-red-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md hover:bg-red-200 cursor-pointer z-10"
                aria-label={t('Remove')}
              >
                <BiTrash size={16} />
              </button>
            ) : null}
          </>
        ) : (
          <div className="p-[32px] flex flex-col gap-[24px] items-center justify-center ">
            <IoDocumentAttachOutline size={40} className="text-black" />
            <div className="flex flex-col gap-[5px] items-center justify-center text-center">
              <span className="font-display-3 font-semibold text-black">
                {t('Drag and drop your images')}
              </span>
              <span className="font-display-2 text-foreground-tertiary">
                {t('JPEG, PNG, and WEBP formats, up to 50MB')}
              </span>
            </div>
            {/* <Button variant="outline" type="button" disabled={compressing} onClick={onPick}>
              {compressing ? t('Compressing...') : t('Select files')}
            </Button> */}
          </div>
        )}
      </div>
      <Dialog open={cropOpen} onOpenChange={onCropDialogOpenChange}>
        <DialogContent
          className="max-w-lg gap-4 sm:max-w-xl"
          showCloseButton={!compressing}
          onPointerDownOutside={(ev) => {
            if (compressing) ev.preventDefault();
          }}
          onEscapeKeyDown={(ev) => {
            if (compressing) ev.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>{t('Crop image')}</DialogTitle>
          </DialogHeader>
          {cropSrc ? (
            <>
              <div className="relative h-[min(50vh,360px)] w-full overflow-hidden rounded-lg bg-black">
                <Cropper
                  image={cropSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">{t('Zoom')}</span>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={zoom}
                  onChange={(ev) => setZoom(Number(ev.target.value))}
                  className="w-full "
                  style={{ accentColor: 'black' }}
                  disabled={compressing}
                />
              </div>
            </>
          ) : null}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              // variant="outlined-brown"
              disabled={compressing}
              onClick={() => onCropDialogOpenChange(false)}
            >
              {t('Cancel')}
            </Button>
            <Button
              variant="outline"
              disabled={compressing || !cropSrc}
              onClick={() => void onApplyCrop()}
            >
              {compressing ? t('Loading...') : t('Confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Field>
  );
}
