import { memo, useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Control,
  Controller,
  type FieldError as RhfFieldError,
} from "react-hook-form";
import Cropper, { type Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { IoDocumentAttachOutline } from "react-icons/io5";
import { BiTrash } from "react-icons/bi";
import { toast } from "sonner";

import { Button } from "@/components/client/shared/Button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { compressImage } from "@/libs/compressImage";
import { getCroppedImageBlob } from "@/libs/getCroppedImage";
import { useImagePreviewSrc } from "@/libs/useImagePreviewSrc";
import {
  ApplicationFormValues,
  ApplicationImageSource,
} from "../_services/application.service";

/**
 * Same pick → crop → compress pipeline and the same brown skin as the other client image
 * fields, bound to this form's values.
 *
 * It exists instead of `components/client/shared/SingleImageFileField` because that one
 * hard-codes `aspect={1}`, which silently crops the 16:9 banner into a square.
 */

function isImageSelected(value: ApplicationImageSource): boolean {
  if (value === "" || value == null) return false;
  return true;
}

const ApplicationImagePreview = memo(function ApplicationImagePreview({
  image,
  alt,
  onRemove,
  variant,
}: {
  image: string | File | Blob;
  alt: string;
  onRemove: () => void;
  variant: "logo" | "background";
}) {
  const { t } = useTranslation();
  const previewUrl = useImagePreviewSrc(image);
  const isWide = variant === "background";

  if (!previewUrl) {
    return (
      <div
        className={
          isWide
            ? "w-full max-w-[min(100%,280px)] aspect-video rounded-[35px] bg-slate-100 animate-pulse border-1 border-[rgba(136,122,71,0.5)]"
            : "w-[150px] h-[150px] rounded-[35px] bg-slate-100 animate-pulse border-1 border-[rgba(136,122,71,0.5)]"
        }
      />
    );
  }

  return (
    <div
      className={
        isWide
          ? "relative w-full max-w-[min(100%,280px)] aspect-video shrink-0 group"
          : "relative h-[150px] w-[150px] shrink-0 group"
      }
    >
      <div className="absolute inset-0 overflow-hidden rounded-[35px] shadow-md ring-1 ring-black/5">
        {/* Plain <img>: the source is a blob: URL or an arbitrary user URL, which AppImage
            does not handle. */}
        <img
          src={previewUrl}
          alt={alt}
          width={isWide ? 280 : 150}
          height={isWide ? 158 : 150}
          className="h-full w-full object-cover transition-transform duration-300"
        />
      </div>
      <button
        type="button"
        aria-label={t("Remove")}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onRemove();
        }}
        className="absolute -top-5 -right-2 p-1.5 text-red-500 bg-red-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md hover:bg-red-200 cursor-pointer z-10"
      >
        <BiTrash size={18} />
      </button>
    </div>
  );
});

export const ApplicationImageField = memo(function ApplicationImageField({
  name,
  control,
  label,
  error,
  cropAspect,
  required = false,
  requiredMessage,
}: {
  name: "logo" | "background";
  control: Control<ApplicationFormValues>;
  label: string;
  error?: RhfFieldError;
  /** 1 for the square logo, 16/9 for the banner. */
  cropAspect: number;
  required?: boolean;
  requiredMessage?: string;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const revokeCropSrc = useCallback(() => {
    setCropSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return "";
    });
  }, []);

  const resetCropState = useCallback(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  }, []);

  const openPicker = useCallback(() => {
    inputRef.current?.click();
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

  const onCropComplete = useCallback(
    (_croppedArea: Area, croppedPixels: Area) => {
      setCroppedAreaPixels(croppedPixels);
    },
    [],
  );

  return (
    <Field>
      <FieldLabel className="text-foreground-tertiary font-display-3">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </FieldLabel>
      <Controller
        name={name}
        control={control}
        rules={
          required && requiredMessage
            ? {
                validate: (value) =>
                  isImageSelected(value as ApplicationImageSource) ||
                  requiredMessage,
              }
            : undefined
        }
        render={({ field: { value, onChange } }) => {
          const applyCroppedImage = async () => {
            if (!cropSrc || !croppedAreaPixels) {
              toast.error(t("Failed to crop image."));
              return;
            }
            setBusy(true);
            try {
              const raw = await getCroppedImageBlob(cropSrc, croppedAreaPixels);
              const blob = await compressImage(raw);
              onChange(blob);
              setCropOpen(false);
              revokeCropSrc();
              resetCropState();
            } catch (err) {
              console.error(err);
              toast.error(t("Failed to compress image."));
            } finally {
              setBusy(false);
            }
          };

          return (
            <>
              <div className="flex flex-col gap-3">
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (!file) return;
                    revokeCropSrc();
                    resetCropState();
                    const url = URL.createObjectURL(file);
                    setCropSrc(url);
                    setCropOpen(true);
                  }}
                />

                {!isImageSelected(value as ApplicationImageSource) ? (
                  <div
                    className="py-5 px-4 flex flex-col gap-3 items-center justify-center border-1 border-dashed border-button-accent-hover rounded-xl cursor-pointer hover:bg-button-accent/5 transition-colors w-full"
                    onClick={() => !busy && openPicker()}
                    onKeyDown={(ev) => {
                      if (ev.key === "Enter" || ev.key === " ") {
                        ev.preventDefault();
                        if (!busy) openPicker();
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <IoDocumentAttachOutline
                      size={28}
                      className="text-button-accent"
                    />
                    <div className="flex flex-col gap-1 items-center justify-center text-center">
                      <span className="font-display-3 text-sm font-semibold text-button-accent">
                        {t("Drag and drop your images")}
                      </span>
                      <span className="font-display-2 text-xs text-button-accent-hover">
                        {t("JPEG, PNG, and WEBP formats, up to 50MB")}
                      </span>
                    </div>
                  </div>
                ) : (
                  <ApplicationImagePreview
                    variant={name === "background" ? "background" : "logo"}
                    image={value as string | File | Blob}
                    alt={label}
                    onRemove={() => onChange("")}
                  />
                )}
              </div>

              <Dialog open={cropOpen} onOpenChange={onCropDialogOpenChange}>
                <DialogContent
                  className="max-w-lg gap-4 sm:max-w-xl"
                  showCloseButton={!busy}
                  onPointerDownOutside={(ev) => {
                    if (busy) ev.preventDefault();
                  }}
                  onEscapeKeyDown={(ev) => {
                    if (busy) ev.preventDefault();
                  }}
                >
                  <DialogHeader>
                    <DialogTitle>{t("Crop image")}</DialogTitle>
                  </DialogHeader>
                  {cropSrc ? (
                    <>
                      <div className="relative h-[min(50vh,360px)] w-full overflow-hidden rounded-lg bg-black">
                        <Cropper
                          image={cropSrc}
                          crop={crop}
                          zoom={zoom}
                          aspect={cropAspect}
                          onCropChange={setCrop}
                          onZoomChange={setZoom}
                          onCropComplete={onCropComplete}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">
                          {t("Zoom")}
                        </span>
                        <input
                          type="range"
                          min={1}
                          max={3}
                          step={0.01}
                          value={zoom}
                          onChange={(ev) => setZoom(Number(ev.target.value))}
                          className="w-full"
                          style={{ accentColor: "var(--button-accent)" }}
                          disabled={busy}
                        />
                      </div>
                    </>
                  ) : null}
                  <DialogFooter className="gap-2 sm:gap-2">
                    <Button
                      variant="outlined-brown"
                      isDisabled={busy}
                      onClick={() => onCropDialogOpenChange(false)}
                    >
                      {t("Cancel")}
                    </Button>
                    <Button
                      variant="brown"
                      isDisabled={busy || !cropSrc}
                      onClick={() => void applyCroppedImage()}
                    >
                      {busy ? t("Loading...") : t("Confirm")}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          );
        }}
      />
      <FieldError errors={[error]} />
    </Field>
  );
});

export default ApplicationImageField;
