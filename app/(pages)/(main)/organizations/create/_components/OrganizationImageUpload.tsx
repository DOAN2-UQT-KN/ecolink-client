"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Control,
  Controller,
  type FieldError as RhfFieldError,
} from "react-hook-form";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import {
  OrganizationFormValues,
  OrganizationImageSource,
} from "../_services/organization.service";
import { IoDocumentAttachOutline } from "react-icons/io5";
import { BiTrash } from "react-icons/bi";
import { Image as AntdImage } from "antd";
import { FaEye } from "react-icons/fa";
import { toast } from "sonner";
import { compressImage } from "@/libs/compressImage";

function isImageSelected(value: OrganizationImageSource): boolean {
  if (value === "" || value == null) return false;
  return true;
}

const SmallOrganizationImagePreview = memo(
  function SmallOrganizationImagePreview({
    image,
    alt,
    onRemove,
  }: {
    image: string | File | Blob;
    alt: string;
    onRemove: () => void;
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
      <div className="relative h-[150px] w-[150px] shrink-0 group">
        <div className="absolute inset-0  rounded-[35px] shadow-md ring-1 ring-black/5">
          <AntdImage
            src={previewUrl}
            alt={alt}
            width={150}
            height={150}
            className="object-cover transition-transform duration-300 h-full w-full"
            preview={{
              cover: (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <FaEye size={30} />
                </div>
              ),
            }}
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
  },
);

export const OrganizationImageField = memo(function OrganizationImageField({
  name,
  control,
  label,
  error,
}: {
  name: "logoUrl" | "backgroundUrl";
  control: Control<OrganizationFormValues>;
  label: string;
  error?: RhfFieldError;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [compressing, setCompressing] = useState(false);

  const openPicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  return (
    <Field>
      <FieldLabel className="text-foreground-tertiary font-display-3">
        {label}
      </FieldLabel>
      <Controller
        name={name}
        control={control}
        render={({ field: { value, onChange } }) => (
          <div className="flex flex-col gap-3">
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setCompressing(true);
                try {
                  const blob = await compressImage(file);
                  onChange(blob);
                } catch (err) {
                  console.error(err);
                  toast.error(t("Failed to compress image."));
                } finally {
                  setCompressing(false);
                  e.target.value = "";
                }
              }}
            />

            {!isImageSelected(value) ? (
              <div
                className="py-5 px-4 flex flex-col gap-3 items-center justify-center border-1 border-dashed border-button-accent-hover rounded-xl cursor-pointer hover:bg-button-accent/5 transition-colors max-w-xs"
                onClick={() => !compressing && openPicker()}
                onKeyDown={(ev) => {
                  if (ev.key === "Enter" || ev.key === " ") {
                    ev.preventDefault();
                    if (!compressing) openPicker();
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
              <AntdImage.PreviewGroup>
                <SmallOrganizationImagePreview
                  image={value as string | File | Blob}
                  alt={label}
                  onRemove={() => onChange("")}
                />
              </AntdImage.PreviewGroup>
            )}
          </div>
        )}
      />
      <FieldError errors={[error]} />
    </Field>
  );
});
