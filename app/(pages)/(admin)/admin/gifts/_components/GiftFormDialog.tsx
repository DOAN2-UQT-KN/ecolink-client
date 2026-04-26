"use client";

import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";

import type { IGift } from "@/apis/gift/models/gift";
import { useCreateGift } from "@/apis/gift/createGift";
import { useUpdateGift } from "@/apis/gift/updateGift";
import { registerAdminMedia } from "@/apis/admin-media/registerAdminMedia";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useAdminLayout } from "@/app/(pages)/(admin)/_context/AdminLayoutContext";
import { SingleImageFileField } from "@/components/client/shared/SingleImageFileField";
import { uploadToCloudinary } from "@/app/(pages)/(main)/incidents/create/_services/upload.service";
import {
  DEFAULT_GIFT_FORM_VALUES,
  giftToFormValues,
  type GiftFormValues,
} from "../_services/gift-form.service";
import { cn } from "@/libs/utils";
import { isBlobLike } from "@/libs/useImagePreviewSrc";
import showMessage, { MessageLevel, MessageType } from "@/utils/showMessage";

type GiftFormDialogProps = {
  mode: "create" | "edit";
  gift?: IGift | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function GiftFormDialog({ mode, gift, open, onOpenChange }: GiftFormDialogProps) {
  const { t } = useTranslation();
  const { theme } = useAdminLayout();
  const isDark = theme === "dark";

  const form = useForm<GiftFormValues>({
    defaultValues: DEFAULT_GIFT_FORM_VALUES,
  });

  const createMutation = useCreateGift({
    onSuccess: () => onOpenChange(false),
  });
  const updateMutation = useUpdateGift({
    onSuccess: () => onOpenChange(false),
  });

  const busy =
    createMutation.isPending || updateMutation.isPending || form.formState.isSubmitting;

  const { reset } = form;

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && gift) {
      reset(giftToFormValues(gift));
      return;
    }
    reset(DEFAULT_GIFT_FORM_VALUES);
  }, [open, mode, gift, reset]);

  const onSubmit = form.handleSubmit(async (data) => {
    const gp = Number.parseInt(data.greenPoints, 10);
    if (!Number.isFinite(gp) || gp < 0) return;
    const stockNum = Number.parseInt(data.stockRemaining, 10);
    if (!data.unlimitedStock && (!Number.isFinite(stockNum) || stockNum < 0)) return;

    const bodyStock = data.unlimitedStock ? null : stockNum;
    const hasNewImage = isBlobLike(data.giftImage) || data.giftImage instanceof File;

    let resolvedMediaId = "";
    try {
      if (mode === "edit" && gift && !hasNewImage) {
        resolvedMediaId = gift.mediaId;
      } else if (hasNewImage) {
        const imageUrl = await uploadToCloudinary(data.giftImage);
        const reg = await registerAdminMedia({ image_url: imageUrl });
        resolvedMediaId = reg.data?.media?.id ?? "";
        if (!resolvedMediaId) {
          throw new Error("Missing media id from server");
        }
      } else {
        showMessage({
          type: MessageType.Toast,
          level: MessageLevel.Error,
          title: t("Please choose an image file."),
        });
        return;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      showMessage({
        type: MessageType.Toast,
        level: MessageLevel.Error,
        title: msg || t("Failed to upload image"),
      });
      return;
    }

    try {
      if (mode === "create") {
        await createMutation.mutateAsync({
          name: data.name.trim(),
          mediaId: resolvedMediaId,
          description: data.description.trim(),
          greenPoints: gp,
          stockRemaining: bodyStock,
          isActive: data.isActive,
        });
        return;
      }
      if (!gift) return;
      await updateMutation.mutateAsync({
        id: gift.id,
        data: {
          name: data.name.trim(),
          mediaId: resolvedMediaId,
          description: data.description.trim(),
          greenPoints: gp,
          stockRemaining: bodyStock,
          isActive: data.isActive,
        },
      });
    } catch {
      // usePost surfaces API errors.
    }
  });

  const { register, watch, setValue } = form;
  const unlimitedStock = watch("unlimitedStock");
  const isActive = watch("isActive");
  const giftImage = watch("giftImage");
  const hasNewImage = isBlobLike(giftImage) || giftImage instanceof File;
  const imageOk = mode === "edit" && gift ? true : hasNewImage;

  const canSubmit =
    form.watch("name").trim().length > 0 &&
    form.watch("description").trim().length > 0 &&
    imageOk &&
    !busy;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!busy) onOpenChange(next);
      }}
    >
      <DialogContent
        className={cn(
          "max-h-[90vh] max-w-lg overflow-y-auto gap-4",
          isDark ? "bg-zinc-900 text-zinc-100" : "bg-zinc-50 text-zinc-900",
        )}
        showCloseButton
        onPointerDownOutside={(e) => {
          if (busy) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (busy) e.preventDefault();
        }}
      >
        <FormProvider {...form}>
          <DialogHeader>
            <DialogTitle className={cn("text-left font-semibold", isDark ? "text-zinc-100" : "text-zinc-900")}>
              {mode === "create" ? t("Create gift") : t("Edit gift")}
            </DialogTitle>
          </DialogHeader>

          <form className="space-y-4" onSubmit={onSubmit}>
            <Field>
              <FieldLabel>{t("Name")}</FieldLabel>
              <Input
                {...register("name", { required: true })}
                className={cn(isDark && "border-zinc-700 bg-zinc-800 text-zinc-100")}
                disabled={busy}
              />
            </Field>

            <SingleImageFileField
              control={form.control}
              name="giftImage"
              label={t("Gift image")}
              disabled={busy}
              isDark={isDark}
              helperText={
                mode === "edit" && gift && !hasNewImage
                  ? t("Current image will be kept unless you choose a new file.")
                  : undefined
              }
            />

            <Field>
              <FieldLabel>{t("Description")}</FieldLabel>
              <Textarea
                {...register("description", { required: true })}
                rows={4}
                className={cn(isDark && "border-zinc-700 bg-zinc-800 text-zinc-100")}
                disabled={busy}
              />
            </Field>

            <Field>
              <FieldLabel>{t("Green points")}</FieldLabel>
              <Input
                type="number"
                min={0}
                {...register("greenPoints")}
                className={cn(isDark && "border-zinc-700 bg-zinc-800 text-zinc-100")}
                disabled={busy}
              />
            </Field>

            <div className="flex items-center gap-2">
              <Checkbox
                id="gift-unlimited-stock"
                checked={unlimitedStock}
                onCheckedChange={(v) => setValue("unlimitedStock", v === true)}
                disabled={busy}
                className=""
              />
              <label htmlFor="gift-unlimited-stock" className="text-sm">
                {t("Unlimited stock")}
              </label>
            </div>

            {!unlimitedStock ? (
              <Field>
                <FieldLabel>{t("Stock remaining")}</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  {...register("stockRemaining")}
                  className={cn(isDark && "border-zinc-700 bg-zinc-800 text-zinc-100")}
                  disabled={busy}
                />
              </Field>
            ) : null}

            <div className="flex items-center gap-2">
              <Checkbox
                id="gift-active"
                checked={isActive}
                onCheckedChange={(v) => setValue("isActive", v === true)}
                disabled={busy}
              />
              <label htmlFor="gift-active" className="text-sm">
                {t("Active")}
              </label>
            </div>

            <DialogFooter className="gap-2 sm:gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy} className="px-4 !h-[45px] cursor-pointer">
                {t("Cancel")}
              </Button>
              <Button type="submit" disabled={!canSubmit} className="px-4 !h-[45px] cursor-pointer">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t("Save")}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
