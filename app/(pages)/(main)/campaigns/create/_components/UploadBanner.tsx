import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Image as AntdImage } from "antd";
import { BiTrash } from "react-icons/bi";
import { FaEye } from "react-icons/fa";
import { IoDocumentAttachOutline } from "react-icons/io5";
import { toast } from "sonner";

import { Button } from "@/components/client/shared/Button";
import { compressImage } from "@/libs/compressImage";

import { CampaignFormValues } from "../_services/campaign.service";

const UploadBanner = memo(function UploadBanner() {
  const { t } = useTranslation();
  const { watch, setValue } = useFormContext<CampaignFormValues>();
  const banner = watch("banner");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [compressing, setCompressing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");

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

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setCompressing(true);
      try {
        const compressedImage = await compressImage(file);
        setValue("banner", compressedImage, { shouldDirty: true });
      } catch (error) {
        console.error("Error compressing banner:", error);
        toast.error(t("Failed to compress image."));
      } finally {
        setCompressing(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [setValue, t],
  );

  const removeBanner = useCallback(() => {
    setValue("banner", undefined, { shouldDirty: true });
  }, [setValue]);

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
    </div>
  );
});

export default UploadBanner;
