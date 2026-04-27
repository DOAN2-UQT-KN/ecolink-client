"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Image as AntdImage } from "antd";
import { BiTrash } from "react-icons/bi";
import { FaEye } from "react-icons/fa";
import { IoDocumentAttachOutline } from "react-icons/io5";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";

import { STATUS } from "@/constants/status";
import { ICampaign } from "@/apis/campaign/models/campaign";
import { uploadToCloudinary } from "@/app/(pages)/(main)/incidents/create/_services/upload.service";
import { compressImage } from "@/libs/compressImage";
import { cn } from "@/libs/utils";
import { useUpdateCampaignMe } from "../_services/campaignMe.service";
import { Button } from "@/components/client/shared/Button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import RichTextEditor from "@/components/ui/RichTextEditor";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type UpdateCampaignFormValues = {
  title: string;
  description: string;
  banner?: string | File | Blob;
  start_date?: string;
  end_date?: string;
};

export type UpdateCampaignPopoverProps = {
  campaign: ICampaign | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
};

function toInputDateTime(value?: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function toIsoDateTime(value?: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

const EditCampaignFormBody = memo(function EditCampaignFormBody({
  campaign,
  onOpenChange,
  onUpdated,
}: {
  campaign: ICampaign;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}) {
  const { t } = useTranslation();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canEditAll = campaign.status === STATUS.PENDING;
  const canEditDateOnly = campaign.status === STATUS.ACTIVE;

  const defaultValues = useMemo<UpdateCampaignFormValues>(
    () => ({
      title: campaign.title ?? "",
      description: campaign.description ?? "",
      banner: campaign.banner ?? "",
      start_date: toInputDateTime(campaign.start_date),
      end_date: toInputDateTime(campaign.end_date),
    }),
    [campaign.banner, campaign.description, campaign.end_date, campaign.start_date, campaign.title],
  );

  const form = useForm<UpdateCampaignFormValues>({ defaultValues });
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = form;

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  const { mutateAsync, isPending } = useUpdateCampaignMe({
    onSuccess: () => {
      onUpdated();
      onOpenChange(false);
    },
  });

  const banner = watch("banner");
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
    const objectUrl = URL.createObjectURL(banner);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [banner]);

  const busy = isPending || isUploading;
  const inputClassName = useMemo(
    () =>
      "border-1 border-[rgba(136,122,71,0.5)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50",
    [],
  );

  const handleBannerChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const compressed = await compressImage(file);
        setValue("banner", compressed, { shouldDirty: true });
      } catch (error) {
        console.error(error);
        toast.error(t("Failed to process banner image."));
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [setValue, t],
  );

  const onValidSubmit = useCallback(
    async (data: UpdateCampaignFormValues) => {
      try {
        setIsUploading(true);
        const payload: {
          title?: string;
          description?: string;
          banner?: string;
          start_date?: string;
          end_date?: string;
        } = {
          start_date: toIsoDateTime(data.start_date),
          end_date: toIsoDateTime(data.end_date),
        };

        if (canEditAll) {
          payload.title = data.title.trim();
          payload.description = data.description.trim();
          if (data.banner) {
            payload.banner = await uploadToCloudinary(data.banner);
          }
        }

        await mutateAsync({
          id: campaign.id,
          data: payload,
        });
      } finally {
        setIsUploading(false);
      }
    },
    [campaign.id, canEditAll, mutateAsync],
  );

  if (!canEditAll && !canEditDateOnly) return null;

  return (
    <DialogContent
      className="sm:max-w-xl max-h-[min(90vh,720px)] overflow-y-auto gap-4"
      showCloseButton
      onPointerDownOutside={(e) => {
        if (busy) e.preventDefault();
      }}
      onEscapeKeyDown={(e) => {
        if (busy) e.preventDefault();
      }}
    >
      <DialogHeader>
        <DialogTitle className="text-left font-semibold">{t("Edit campaign")}</DialogTitle>
      </DialogHeader>
      <form
        className="flex flex-col gap-6 py-2"
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit(onValidSubmit)(e);
        }}
      >
        {canEditAll && (
          <>
            <Field>
              <FieldLabel className="text-foreground-tertiary font-display-3">
                {t("Title")} <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                {...register("title", { required: t("Title is required") })}
                placeholder={t("Enter campaign title...")}
                className={inputClassName}
                disabled={busy}
              />
              <FieldError errors={[errors.title]} />
            </Field>

            <Field>
              <FieldLabel className="text-foreground-tertiary font-display-3">{t("Description")}</FieldLabel>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <RichTextEditor
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={t("Enter description...")}
                    className={cn(inputClassName, "min-h-[220px]", busy && "pointer-events-none opacity-60")}
                  />
                )}
              />
              <FieldError errors={[errors.description]} />
            </Field>

            <Field>
              <FieldLabel className="text-foreground-tertiary font-display-3">{t("Banner")}</FieldLabel>
              <input type="file" ref={fileInputRef} onChange={handleBannerChange} accept="image/*" className="hidden" />
              {!banner ? (
                <div
                  className="p-6 flex flex-col gap-4 items-center justify-center border border-dashed border-button-accent-hover rounded-[16px] cursor-pointer hover:bg-button-accent/5 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <IoDocumentAttachOutline size={28} className="text-button-accent" />
                  <span className="font-display-2 text-button-accent-hover">
                    {t("Upload campaign banner")}
                  </span>
                  <Button type="button" variant="outlined-brown" isDisabled={busy}>
                    {t("Select image")}
                  </Button>
                </div>
              ) : (
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
                      setValue("banner", undefined, { shouldDirty: true });
                    }}
                    className="absolute top-3 right-3 p-1.5 text-red-500 bg-red-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md hover:bg-red-200 cursor-pointer z-10"
                  >
                    <BiTrash size={18} />
                  </button>
                </div>
              )}
            </Field>
          </>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel className="text-foreground-tertiary font-display-3">
              {t("Start date")} <span className="text-destructive">*</span>
            </FieldLabel>
            <div className="relative">
              <Input
                type="datetime-local"
                {...register("start_date", { required: t("Start date is required") })}
                className={cn(inputClassName, "pr-10")}
                disabled={busy}
              />
              <CalendarIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            <FieldError errors={[errors.start_date]} />
          </Field>

          <Field>
            <FieldLabel className="text-foreground-tertiary font-display-3">
              {t("End date")} <span className="text-destructive">*</span>
            </FieldLabel>
            <div className="relative">
              <Input
                type="datetime-local"
                {...register("end_date", { required: t("End date is required") })}
                className={cn(inputClassName, "pr-10")}
                disabled={busy}
              />
              <CalendarIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            <FieldError errors={[errors.end_date]} />
          </Field>
        </div>

        <DialogFooter className="space-x-2 sm:gap-0 pt-2 h-[50px]">
          <Button
            type="button"
            variant="outlined-brown"
            size="medium"
            onClick={() => onOpenChange(false)}
            isDisabled={busy}
          >
            {t("Cancel")}
          </Button>
          <Button type="submit" variant="brown" size="medium" isLoading={busy} isDisabled={busy}>
            {isUploading ? t("Uploading...") : t("Confirm")}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
});

export const UpdateCampaignPopover = memo(function UpdateCampaignPopover({
  campaign,
  open,
  onOpenChange,
  onUpdated,
}: UpdateCampaignPopoverProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {campaign ? (
        <EditCampaignFormBody
          key={campaign.id}
          campaign={campaign}
          onOpenChange={onOpenChange}
          onUpdated={onUpdated}
        />
      ) : null}
    </Dialog>
  );
});

export default UpdateCampaignPopover;
