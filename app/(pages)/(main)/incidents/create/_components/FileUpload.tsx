import { Button } from "@/components/client/shared/Button";
import { useTranslation } from "react-i18next";
import { IoDocumentAttachOutline } from "react-icons/io5";
import { BiTrash, BiPlus } from "react-icons/bi";
import { TbCamera } from "react-icons/tb";
import { useFormContext } from "react-hook-form";
import {
  IncidentFormValues,
  IncidentImage,
  MAX_INCIDENT_IMAGES,
} from "../_services/incident.service";
import { Image as AntdImage } from "antd";
import { memo, useRef, useState, useCallback, useEffect } from "react";
import showMessage, { MessageLevel, MessageType } from "@/utils/showMessage";
import { FaEye } from "react-icons/fa";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FieldError } from "@/components/ui/field";
import { compressImage } from "@/libs/compressImage";
import { cn } from "@/libs/utils";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { Pill } from "@/components/ui/Pill";
import { useCreateCapture } from "@/apis/incident/createCapture";

const ImagePreviewItem = memo(function ImagePreviewItem({
  image,
  index,
  live,
  onRemove,
}: {
  image: string | File | Blob;
  index: number;
  live: boolean;
  onRemove: (index: number) => void;
}) {
  const { t } = useTranslation();
  const [previewUrl, setPreviewUrl] = useState<string>("");

  useEffect(() => {
    let url = "";
    if (typeof image === "string") {
      url = image;
    } else {
      url = URL.createObjectURL(image);
    }
    setPreviewUrl(url);

    return () => {
      if (typeof image !== "string" && url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [image]);

  if (!previewUrl) {
    return (
      <div className="w-[150px] h-[150px] rounded-[35px] bg-slate-100 animate-pulse border-1 border-[rgba(136,122,71,0.5)]" />
    );
  }

  return (
    <div className="relative w-[150px] h-[150px] rounded-[35px] group shadow-md  ring-1 ring-black/5">
      <AntdImage
        src={previewUrl}
        alt={`Uploaded ${index}`}
        width={150}
        height={150}
        className="object-cover transition-transform duration-300 w-full h-full rounded-[10px]"
        preview={{
          cover: (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <FaEye size={30} />
            </div>
          ),
        }}
      />
      {live && (
        <Pill tone="green" className="absolute bottom-2 left-2 z-10">
          {t("Live capture")}
        </Pill>
      )}
      <button
        type="button"
        aria-label={t("Remove image")}
        onClick={(e) => {
          e.stopPropagation();
          onRemove(index);
        }}
        className="absolute -top-5 -right-2 p-1.5 text-red-500 bg-red-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md hover:bg-red-200 cursor-pointer z-10"
      >
        <BiTrash size={18} />
      </button>
    </div>
  );
});

const FileUpload = memo(function FileUpload() {
  const { t } = useTranslation();
  const { watch, setValue, register, formState: { errors } } = useFormContext<IncidentFormValues>();
  const images = watch("images") || [];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [compressing, setCompressing] = useState(false);
  const { mutateAsync: createCapture } = useCreateCapture();
  // Session requested when "Take photo" is pressed, used by the photo that comes back.
  const capturePromiseRef = useRef<Promise<IncidentImage["capture"] | undefined> | null>(null);
  const hasLibraryImage = images.some((image) => !image.capture);

  const openCamera = useCallback(() => {
    capturePromiseRef.current = createCapture()
      .then((res) => ({ id: res.data.capture_id, expiresAt: res.data.expires_at, upload: res.data.upload }))
      .catch(() => {
        showMessage({
          type: MessageType.Toast,
          level: MessageLevel.Info,
          title: t("Live capture is unavailable, the photo will be added as a library photo"),
        });
        return undefined;
      });
    cameraInputRef.current?.click();
  }, [createCapture, t]);

  useEffect(() => {
    register("images", {
      validate: (value) =>
        (Array.isArray(value) && value.length > 0) ||
        t("At least one image is required"),
    });
  }, [register, t]);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const remainingSlots = MAX_INCIDENT_IMAGES - images.length;
      if (remainingSlots <= 0) {
        showMessage({ type: MessageType.Toast, level: MessageLevel.Error, title: t("Maximum 10 images allowed.") });
        return;
      }

      const filesToProcess = Array.from(files).slice(0, remainingSlots);
      if (files.length > remainingSlots) {
        showMessage({
          type: MessageType.Toast,
          level: MessageLevel.Warning,
          title: t("Only {{count}} images were added because of the limit.", {
            count: remainingSlots,
          }),
        });
      }

      setCompressing(true);
      const compressionPromises = filesToProcess.map((file) =>
        compressImage(file),
      );

      try {
        const compressed = await Promise.all(compressionPromises);
        // A session is single-use: only the first photo from the camera input gets it.
        const fromCamera = e.target === cameraInputRef.current;
        const capture = fromCamera ? await capturePromiseRef.current : undefined;
        capturePromiseRef.current = null;
        const newImages: IncidentImage[] = compressed.map((source, i) =>
          i === 0 && capture ? { source, capture } : { source },
        );
        setValue("images", [...images, ...newImages], {
          shouldDirty: true,
          shouldValidate: true,
        });
      } catch (error) {
        console.error("Error compressing files:", error);
        showMessage({ type: MessageType.Toast, level: MessageLevel.Error, title: t("Failed to compress some images.") });
      } finally {
        setCompressing(false);
        e.target.value = "";
      }
    },
    [images, setValue, t],
  );

  const removeImage = useCallback(
    (index: number) => {
      const updatedImages = images.filter((_, i) => i !== index);
      setValue("images", updatedImages, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [images, setValue],
  );

  const clearAll = useCallback(() => {
    setValue("images", [], { shouldDirty: true, shouldValidate: true });
  }, [setValue]);

  return (
    <div
      id="incident-images"
      className={cn(
        "w-full h-full flex flex-col gap-[30px] px-[30px] py-[35px] border-1 rounded-[10px] bg-white/80 shadow-sm ring-1 ring-white/5 overflow-y-auto scrollbar-hide",
        errors.images
          ? "border-destructive ring-2 ring-destructive/20"
          : "border-[rgba(136,122,71,0.5)]",
      )}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        accept="image/*"
        className="hidden"
      />
      {/* Opens the rear camera on phones; browsers without capture support fall back to a file picker. */}
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {images.length === 0 && (
        <>
          <div className="flex flex-col gap-[8px]">
            <span className="flex items-center gap-2 font-display-5 font-semibold text-button-accent">
              {t("Upload file")} <span className="text-destructive">*</span>
              <InfoTooltip content={t("Live photos help your report get reviewed faster")} />
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
            <div className="flex flex-wrap justify-center gap-3" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="outlined-brown"
                type="button"
                disabled={compressing}
                iconLeft={<TbCamera aria-hidden />}
                onClick={openCamera}
              >
                {t("Take photo")}
              </Button>
              <Button
                variant="outlined-brown"
                type="button"
                disabled={compressing}
                onClick={() => fileInputRef.current?.click()}
              >
                {compressing ? t("Compressing...") : t("Choose from library")}
              </Button>
            </div>
          </div>
        </>
      )}

      {images.length > 0 && (
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
              {images.map((image, index) => (
                <ImagePreviewItem
                  key={index}
                  image={image.source}
                  live={!!image.capture}
                  index={index}
                  onRemove={removeImage}
                />
              ))}
            </AntdImage.PreviewGroup>
            {images.length < MAX_INCIDENT_IMAGES && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={openCamera}
                    aria-label={t("Take photo")}
                    className="w-[150px] h-[150px] border-2 border-dashed border-button-accent-hover rounded-[15px] flex items-center justify-center cursor-pointer hover:bg-button-accent/5 transition-colors group"
                  >
                    <TbCamera size={40} className="text-button-accent group-hover:scale-110 transition-transform" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("Take photo")}</p>
                </TooltipContent>
              </Tooltip>
            )}
            {images.length < MAX_INCIDENT_IMAGES && (
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
            {images.length}/{MAX_INCIDENT_IMAGES}
          </span>
          {hasLibraryImage && (
            <span className="text-sm text-amber-700">{t("Live photos help your report get reviewed faster")}</span>
          )}
        </div>
      )}
      <FieldError errors={[errors.images as { message?: string } | undefined]} />
    </div>
  );
});

export default FileUpload;
