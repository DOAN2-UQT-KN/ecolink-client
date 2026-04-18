"use client";

import { useEffect, useRef, useState } from "react";
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
import { uploadToCloudinary } from "@/app/(pages)/(main)/incidents/create/_services/upload.service";
import { compressImage } from "@/libs/compressImage";
import { cn } from "@/libs/utils";
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [greenPoints, setGreenPoints] = useState("0");
  const [unlimitedStock, setUnlimitedStock] = useState(true);
  const [stockRemaining, setStockRemaining] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const createMutation = useCreateGift({
    onSuccess: () => onOpenChange(false),
  });
  const updateMutation = useUpdateGift({
    onSuccess: () => onOpenChange(false),
  });

  const busy = uploadingMedia || createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!open) {
      setImageFile(null);
      setPreviewUrl("");
      return;
    }
    if (mode === "edit" && gift) {
      setName(gift.name);
      setDescription(gift.description);
      setGreenPoints(String(gift.greenPoints));
      const unlimited = gift.stockRemaining === null;
      setUnlimitedStock(unlimited);
      setStockRemaining(unlimited ? "0" : String(gift.stockRemaining ?? 0));
      setIsActive(gift.isActive);
      setImageFile(null);
      setPreviewUrl("");
      return;
    }
    setName("");
    setDescription("");
    setGreenPoints("0");
    setUnlimitedStock(true);
    setStockRemaining("0");
    setIsActive(true);
    setImageFile(null);
    setPreviewUrl("");
  }, [open, mode, gift]);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const gp = Number.parseInt(greenPoints, 10);
  const greenOk = Number.isFinite(gp) && gp >= 0;
  const stockNum = Number.parseInt(stockRemaining, 10);
  const stockOk = unlimitedStock || (Number.isFinite(stockNum) && stockNum >= 0);
  const imageOk = mode === "edit" ? Boolean(imageFile) || Boolean(gift) : Boolean(imageFile);
  const canSubmit =
    name.trim().length > 0 &&
    description.trim().length > 0 &&
    imageOk &&
    greenOk &&
    stockOk &&
    !busy;

  const onPickFile = () => fileInputRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showMessage({
        type: MessageType.Toast,
        level: MessageLevel.Error,
        title: t("Please choose an image file."),
      });
      return;
    }
    setImageFile(file);
  };

  const onSubmit = async () => {
    if (!canSubmit) return;
    const bodyStock = unlimitedStock ? null : stockNum;

    let resolvedMediaId = "";
    try {
      if (mode === "edit" && gift && !imageFile) {
        resolvedMediaId = gift.mediaId;
      } else if (imageFile) {
        setUploadingMedia(true);
        const blob = await compressImage(imageFile);
        const imageUrl = await uploadToCloudinary(blob);
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
    } finally {
      setUploadingMedia(false);
    }

    try {
      if (mode === "create") {
        await createMutation.mutateAsync({
          name: name.trim(),
          mediaId: resolvedMediaId,
          description: description.trim(),
          greenPoints: gp,
          stockRemaining: bodyStock,
          isActive,
        });
        return;
      }
      if (!gift) return;
      await updateMutation.mutateAsync({
        id: gift.id,
        data: {
          name: name.trim(),
          mediaId: resolvedMediaId,
          description: description.trim(),
          greenPoints: gp,
          stockRemaining: bodyStock,
          isActive,
        },
      });
    } catch {
      // Gift create/update errors are surfaced by usePost / axios interceptor.
    }
  };

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
        <DialogHeader>
          <DialogTitle className={cn("text-left font-semibold", isDark ? "text-zinc-100" : "text-zinc-900")}>
            {mode === "create" ? t("Create gift") : t("Edit gift")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Field>
            <FieldLabel>{t("Name")}</FieldLabel>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={cn(isDark && "border-zinc-700 bg-zinc-800 text-zinc-100")}
              disabled={busy}
            />
          </Field>

          <Field>
            <FieldLabel>{t("Gift image")}</FieldLabel>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={onFileChange}
              disabled={busy}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onPickFile} disabled={busy}>
                {t("Select files")}
              </Button>
              {imageFile ? (
                <Button type="button" variant="ghost" size="sm" onClick={() => setImageFile(null)} disabled={busy}>
                  {t("Remove")}
                </Button>
              ) : null}
            </div>
            {mode === "edit" && gift && !imageFile ? (
              <p className="text-muted-foreground mt-1 text-xs">{t("Current image will be kept unless you choose a new file.")}</p>
            ) : null}
            <div
              className={cn(
                "mt-2 flex h-[200px] w-[200px] shrink-0 items-center justify-center overflow-hidden rounded-md border",
                isDark ? "border-zinc-700 bg-zinc-800/50" : "border-zinc-200 bg-zinc-100",
              )}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-muted-foreground px-2 text-center text-xs">
                  {t("No image selected")}
                </span>
              )}
            </div>
          </Field>

          <Field>
            <FieldLabel>{t("Description")}</FieldLabel>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
              value={greenPoints}
              onChange={(e) => setGreenPoints(e.target.value)}
              className={cn(isDark && "border-zinc-700 bg-zinc-800 text-zinc-100")}
              disabled={busy}
            />
          </Field>

          <div className="flex items-center gap-2">
            <Checkbox
              id="gift-unlimited-stock"
              checked={unlimitedStock}
              onCheckedChange={(v) => setUnlimitedStock(v === true)}
              disabled={busy}
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
                value={stockRemaining}
                onChange={(e) => setStockRemaining(e.target.value)}
                className={cn(isDark && "border-zinc-700 bg-zinc-800 text-zinc-100")}
                disabled={busy}
              />
            </Field>
          ) : null}

          <div className="flex items-center gap-2">
            <Checkbox
              id="gift-active"
              checked={isActive}
              onCheckedChange={(v) => setIsActive(v === true)}
              disabled={busy}
            />
            <label htmlFor="gift-active" className="text-sm">
              {t("Active")}
            </label>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            {t("Cancel")}
          </Button>
          <Button type="button" onClick={() => void onSubmit()} disabled={!canSubmit}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t("Save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
