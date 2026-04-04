import { Button } from "@/components/shared/Button";
import { useTranslation } from "react-i18next";
import { IoDocumentAttachOutline } from "react-icons/io5";
import { BiTrash, BiPlus } from "react-icons/bi";
import { useFormContext } from "react-hook-form";
import { IncidentFormValues } from "../_services/incident.service";
import { Image as AntdImage } from "antd";
import { memo, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { FaEye } from "react-icons/fa";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        const MAX_DIMENSION = 1280;
        if (width > height) {
          if (width > MAX_DIMENSION) {
            height *= MAX_DIMENSION / width;
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width *= MAX_DIMENSION / height;
            height = MAX_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        // We use image/jpeg and 0.5 quality for good compression
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.5);
        resolve(compressedBase64);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

const FileUpload = memo(function FileUpload() {
  const { t } = useTranslation();
  const { watch, setValue } = useFormContext<IncidentFormValues>();
  const imageString = watch("imageString") || [];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [compressing, setCompressing] = useState(false);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const remainingSlots = 10 - imageString.length;
      if (remainingSlots <= 0) {
        toast.error(t("Maximum 10 images allowed."));
        return;
      }

      const filesToProcess = Array.from(files).slice(0, remainingSlots);
      if (files.length > remainingSlots) {
        toast.warning(
          t("Only {{count}} images were added because of the limit.", {
            count: remainingSlots,
          }),
        );
      }

      setCompressing(true);
      const compressionPromises = filesToProcess.map((file) =>
        compressImage(file),
      );

      try {
        const newImages = await Promise.all(compressionPromises);
        setValue("imageString", [...imageString, ...newImages]);
      } catch (error) {
        console.error("Error compressing files:", error);
        toast.error(t("Failed to compress some images."));
      } finally {
        setCompressing(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [imageString, setValue, t],
  );

  const removeImage = useCallback(
    (index: number) => {
      const updatedImages = imageString.filter((_, i) => i !== index);
      setValue("imageString", updatedImages);
    },
    [imageString, setValue],
  );

  const clearAll = useCallback(() => {
    setValue("imageString", []);
  }, [setValue]);

  return (
    <div className="w-full h-full flex flex-col gap-[30px] px-[30px] py-[35px] border-1 border-[rgba(136,122,71,0.5)] rounded-[10px] bg-white/80 shadow-sm ring-1 ring-white/5 overflow-y-auto scrollbar-hide">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        accept="image/*"
        className="hidden"
      />

      {imageString.length === 0 && (
        <>
          <div className="flex flex-col gap-[8px]">
            <span className="font-display-5 font-semibold text-button-accent">
              {t("Upload file")}
            </span>
            <span className="font-display-2 text-button-accent-hover">
              {t("Choose a image and upload securely to proceed.")}
            </span>
          </div>

          <div
            className="p-[32px] flex flex-col gap-[24px] items-center justify-center border-1 border-dashed border-button-accent-hover rounded-[16px] cursor-pointer hover:bg-button-accent/5 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <IoDocumentAttachOutline size={40} className="text-button-accent" />
            <div className="flex flex-col gap-[5px] items-center justify-center text-center">
              <span className="font-display-3 font-semibold text-button-accent">
                {t("Drag and drop your images")}
              </span>
              <span className="font-display-2 text-button-accent-hover">
                {t("JPEG, PNG, and WEBP formats, up to 50MB")}
              </span>
            </div>
            <Button
              variant="outlined-brown"
              type="button"
              disabled={compressing}
            >
              {compressing ? t("Compressing...") : t("Select files")}
            </Button>
          </div>
        </>
      )}

      {imageString.length > 0 && (
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <span className="font-display-3 font-semibold text-button-accent">
              {t("Uploaded Images")}
            </span>

            {/* </div> */}
            {/* <div className="flex items-center gap-2"> */}
            <button
              type="button"
              onClick={clearAll}
              className="text-xs font-semibold text-red-500 hover:text-red-600 transition-colors bg-red-50 px-2.5 py-1 rounded-full border border-red-100"
            >
              {t("Clear all")}
            </button>
            {/* </div> */}
          </div>
          <div className="flex flex-wrap gap-4">
            <AntdImage.PreviewGroup>
              {imageString.map((image, index) => (
                <div
                  key={index}
                  className="relative w-[150px] h-[150px] rounded-[35px]  group shadow-md"
                >
                  <AntdImage
                    src={image}
                    alt={`Uploaded ${index}`}
                    width={150}
                    height={150}
                    className="object-cover transition-transform duration-300 "
                    preview={{
                      mask: (
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <FaEye size={30} />
                        </div>
                      ),
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(index);
                    }}
                    className="absolute -top-5 -right-2 p-1.5 text-red-500 bg-red-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md hover:bg-red-200 cursor-pointer z-10"
                  >
                    <BiTrash size={18} />
                  </button>
                </div>
              ))}
            </AntdImage.PreviewGroup>
            {imageString.length < 10 && (
              <Tooltip>
                <TooltipTrigger>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-[150px] h-[150px] border-2 border-dashed border-button-accent-hover rounded-[15px] flex items-center justify-center cursor-pointer hover:bg-button-accent/5 transition-colors group"
                    // title={t("Add more images")}
                  >
                    <BiPlus
                      size={40}
                      className="text-button-accent group-hover:scale-110 transition-transform"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("Add more images")}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <span className="text-sm text-button-accent-hover font-medium">
            {imageString.length}/10
          </span>
        </div>
      )}
    </div>
  );
});

export default FileUpload;
