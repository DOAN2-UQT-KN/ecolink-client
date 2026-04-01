import { Button } from "@/components/shared/Button";
import { useTranslation } from "react-i18next";
import { IoDocumentAttachOutline } from "react-icons/io5";
import { BiTrash } from "react-icons/bi";
import { useFormContext } from "react-hook-form";
import { IncidentFormValues } from "./IncidentContext";
import Image from "next/image";
import { useRef } from "react";

export default function FileUpload() {
  const { t } = useTranslation();
  const { watch, setValue } = useFormContext<IncidentFormValues>();
  const imageString = watch("imageString") || [];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages: string[] = [];
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newImages.push(reader.result as string);
          if (newImages.length === files.length) {
            setValue("imageString", [...imageString, ...newImages]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    const updatedImages = imageString.filter((_, i) => i !== index);
    setValue("imageString", updatedImages);
  };

  return (
    <div className="w-full h-full flex flex-col gap-[30px] px-[30px] py-[35px] border-1 border-[rgba(136,122,71,0.5)] rounded-[20px] bg-white/50 shadow-lg ring-1 ring-white/5 overflow-y-auto scrollbar-hide">
      <div className="flex flex-col gap-[8px]">
        <span className="font-display-5 font-semibold text-button-accent">
          {t("Upload file")}
        </span>
        <span className="font-display-3 text-button-accent-hover">
          {t("Choose a image and upload securely to proceed.")}
        </span>
      </div>

      <div
        className="p-[32px] flex flex-col gap-[24px] items-center justify-center border-1 border-dashed border-button-accent-hover rounded-[16px] cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <IoDocumentAttachOutline size={40} className="text-button-accent" />
        <div className="flex flex-col gap-[5px] items-center justify-center text-center">
          <span className="font-display-3 font-semibold text-button-accent">
            {t("Drag and drop your images")}
          </span>
          <span className="font-display-2 text-button-accent-hover">
            {t("JPEG, PND, and WEBPH formats, up to 50MB")}
          </span>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          accept="image/*"
          className="hidden"
        />
        <Button variant="outlined-brown" type="button">
          {t("Select files")}
        </Button>
      </div>

      <div className="flex flex-col gap-5">
        <span className="font-display-3 font-semibold text-button-accent">
          {t("Uploaded Images")}
        </span>
        <div className="flex flex-wrap gap-4">
          {imageString.map((image, index) => (
            <div
              key={index}
              className="relative w-[150px] h-[150px] rounded-[15px] overflow-hidden group"
            >
              <Image
                src={image}
                alt={`Uploaded ${index}`}
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md hover:bg-red-600"
              >
                <BiTrash size={16} />
              </button>
            </div>
          ))}
          {imageString.length === 0 && (
            <span className="text-button-accent-hover italic">
              {t("No images uploaded yet.")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
