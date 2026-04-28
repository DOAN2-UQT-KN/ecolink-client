import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Image as AntdImage } from "antd";
import Cropper, { type Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { BiTrash } from "react-icons/bi";
import { FaEye } from "react-icons/fa";
import { IoDocumentAttachOutline } from "react-icons/io5";
import { toast } from "sonner";

import { Button } from "@/components/client/shared/Button";
import { compressImage } from "@/libs/compressImage";
import { getCroppedImageBlob } from "@/libs/getCroppedImage";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { CampaignFormValues } from "../_services/campaign.service";

const UploadBanner = memo(function UploadBanner() {
  const { t } = useTranslation();
  const { watch, setValue } = useFormContext<CampaignFormValues>();
  const banner = watch("banner");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [compressing, setCompressing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  useEffect(() => {
    if (!banner) {
      setPreviewUrl("");
      return;
    }

    if (typeof banner === "string") {
      setPreviewUrl(banner);
      return;
    }

    const url = URL.createObjectURL(banner);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [banner]);

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

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      revokeCropSrc();
      resetCropState();
      const url = URL.createObjectURL(file);
      setCropSrc(url);
      setCropOpen(true);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [resetCropState, revokeCropSrc],
  );

  const removeBanner = useCallback(() => {
    setValue("banner", undefined, { shouldDirty: true });
  }, [setValue]);

  const applyCroppedImage = useCallback(async () => {
    if (!cropSrc || !croppedAreaPixels) {
      toast.error(t("Failed to crop image."));
      return;
    }
    setCompressing(true);
    try {
      const raw = await getCroppedImageBlob(cropSrc, croppedAreaPixels);
      const compressedImage = await compressImage(raw);
      setValue("banner", compressedImage, { shouldDirty: true });
      onCropDialogOpenChange(false);
    } catch (error) {
      console.error("Error processing banner:", error);
      toast.error(t("Failed to compress image."));
    } finally {
      setCompressing(false);
    }
  }, [cropSrc, croppedAreaPixels, onCropDialogOpenChange, setValue, t]);

  return (
    <div className="flex flex-col gap-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {!banner && (
        <div
          className="p-[24px] flex flex-col gap-[20px] items-center justify-center border-1 border-dashed border-button-accent-hover rounded-[16px] cursor-pointer hover:bg-button-accent/5 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <IoDocumentAttachOutline size={32} className="text-button-accent" />
          <div className="flex flex-col gap-[5px] items-center justify-center text-center">
            <span className="font-display-3 font-semibold text-button-accent">
              {t("Upload campaign banner")}
            </span>
            <span className="font-display-2 text-button-accent-hover">
              {t("JPEG, PNG, and WEBP formats, up to 50MB")}
            </span>
          </div>
          <Button variant="outlined-brown" type="button" disabled={compressing}>
            {compressing ? t("Compressing...") : t("Select image")}
          </Button>
        </div>
      )}

      {banner && previewUrl && (
        <div className="flex flex-col gap-3">
          <span className="font-display-3 font-semibold text-button-accent">
            {t("Uploaded Banner")}
          </span>
          <div className="relative w-full h-[220px] rounded-[16px] group shadow-md ring-1 ring-black/5 overflow-hidden">
            <AntdImage
              src={previewUrl}
              alt={t("Campaign banner")}
              width={"100%"}
              height={220}
              className="object-cover w-full h-full"
              preview={{
                cover: (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <FaEye size={28} />
                  </div>
                ),
              }}
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeBanner();
              }}
              className="absolute top-3 right-3 p-1.5 text-red-500 bg-red-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md hover:bg-red-200 cursor-pointer z-10"
            >
              <BiTrash size={18} />
            </button>
          </div>
        </div>
      )}
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
            <DialogTitle>{t("Crop image")}</DialogTitle>
          </DialogHeader>
          {cropSrc ? (
            <>
              <div className="relative h-[min(50vh,360px)] w-full overflow-hidden rounded-lg bg-black">
                <Cropper
                  image={cropSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={16 / 9}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">{t("Zoom")}</span>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={zoom}
                  onChange={(ev) => setZoom(Number(ev.target.value))}
                  className="w-full"
                  style={{ accentColor: "var(--button-accent)" }}
                  disabled={compressing}
                />
              </div>
            </>
          ) : null}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outlined-brown"
              type="button"
              disabled={compressing}
              onClick={() => onCropDialogOpenChange(false)}
            >
              {t("Cancel")}
            </Button>
            <Button
              variant="brown"
              type="button"
              disabled={compressing || !cropSrc}
              onClick={() => void applyCroppedImage()}
            >
              {compressing ? t("Loading...") : t("Confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

export default UploadBanner;
