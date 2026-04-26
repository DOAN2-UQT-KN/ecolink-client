"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/client/shared/Button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import RichTextEditor from "@/components/ui/RichTextEditor";
import { cn } from "@/libs/utils";
import { IOrganization } from "@/apis/organization/models/organization";
import { useUpdateOrganization } from "@/apis/organization/organizationById";
import { OrganizationFormValues } from "@/app/(pages)/(main)/organizations/create/_services/organization.service";
import { uploadToCloudinary } from "@/app/(pages)/(main)/organizations/create/_services/upload.service";
import { OrganizationImageField } from "@/app/(pages)/(main)/organizations/create/_components/OrganizationImageUpload";

export type UpdateOrganizationPopoverProps = {
  organization: IOrganization | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
};

const EditOrganizationFormBody = memo(function EditOrganizationFormBody({
  organization,
  onUpdated,
  onOpenChange,
}: {
  organization: IOrganization;
  onUpdated: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const [isUploading, setIsUploading] = useState(false);

  const orgId = organization.id;

  const defaultValues = useMemo(
    (): OrganizationFormValues => ({
      name: organization.name,
      description: organization.description ?? "",
      logoUrl: organization.logo_url ?? "",
      backgroundUrl: organization.background_url ?? "",
      contactEmail: organization.contact_email ?? "",
    }),
    [
      organization.id,
      organization.name,
      organization.description,
      organization.logo_url,
      organization.background_url,
      organization.contact_email,
    ],
  );

  const form = useForm<OrganizationFormValues>({
    defaultValues,
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = form;

  const { mutateAsync, isPending } = useUpdateOrganization({
    onSuccess: () => {
      onUpdated();
      onOpenChange(false);
    },
  });

  const inputClassName = useMemo(
    () =>
      "border-1 border-[rgba(136,122,71,0.5)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50",
    [],
  );

  const busy = isPending || isUploading;

  const onValidSubmit = useCallback(
    async (data: OrganizationFormValues) => {
      setIsUploading(true);
      try {
        let logo_url: string;
        let background_url: string;
        try {
          logo_url = await uploadToCloudinary(data.logoUrl || "");
          background_url = await uploadToCloudinary(data.backgroundUrl || "");
        } catch (err) {
          console.error(err);
          toast.error(t("Failed to upload image."));
          return;
        }
        await mutateAsync({
          id: orgId,
          data: {
            name: data.name.trim(),
            contact_email: data.contactEmail.trim(),
            description: data.description.trim() || undefined,
            logo_url,
            background_url,
          },
        });
      } finally {
        setIsUploading(false);
      }
    },
    [mutateAsync, orgId, t],
  );

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
        <DialogTitle className="text-left font-semibold">
          {t("Edit organization")}
        </DialogTitle>
      </DialogHeader>
      <form
        className="flex flex-col gap-6 py-2"
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit(onValidSubmit)(e);
        }}
      >
        <div className="flex flex-col gap-6">
          <span className="font-display-5 font-semibold !text-button-accent">
            {t("General Information")}
          </span>

          <Field>
            <FieldLabel className="text-foreground-tertiary font-display-3">
              {t("Name")} <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              {...register("name", { required: t("Name is required") })}
              placeholder={t("Enter organization name...")}
              className={inputClassName}
              disabled={busy}
            />
            <FieldError errors={[errors.name]} />
          </Field>

          <Field>
            <FieldLabel className="text-foreground-tertiary font-display-3">
              {t("Description")}
            </FieldLabel>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <RichTextEditor
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t("Enter description...")}
                  className={cn(
                    inputClassName,
                    "min-h-[220px]",
                    busy && "pointer-events-none opacity-60",
                  )}
                />
              )}
            />
            <FieldError errors={[errors.description]} />
          </Field>
        </div>

        <div className="flex flex-col gap-6">
          <span className="font-display-5 font-semibold !text-button-accent">
            {t("Brand & contact")}
          </span>

          <OrganizationImageField
            name="logoUrl"
            control={control}
            label={t("Logo")}
            error={errors.logoUrl}
            cropAspect={1}
            required={false}
          />

          <OrganizationImageField
            name="backgroundUrl"
            control={control}
            label={t("Background")}
            error={errors.backgroundUrl}
            cropAspect={16 / 9}
            required={false}
          />

          <Field>
            <FieldLabel className="text-foreground-tertiary font-display-3">
              {t("Contact email")} <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              type="email"
              {...register("contactEmail", {
                required: t("Contact email is required"),
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: t("Invalid email address"),
                },
              })}
              placeholder={t("contact@example.com")}
              className={inputClassName}
              disabled={busy}
            />
            <FieldError errors={[errors.contactEmail]} />
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
          <Button
            type="submit"
            variant="brown"
            size="medium"
            isLoading={isPending || isUploading}
            isDisabled={busy}
          >
            {isUploading ? t("Uploading...") : t("Confirm")}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
});

export const UpdateOrganizationPopover = memo(
  function UpdateOrganizationPopover({
    organization,
    open,
    onOpenChange,
    onUpdated,
  }: UpdateOrganizationPopoverProps) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        {organization ? (
          <EditOrganizationFormBody
            key={organization.id}
            organization={organization}
            onUpdated={onUpdated}
            onOpenChange={onOpenChange}
          />
        ) : null}
      </Dialog>
    );
  },
);

export default UpdateOrganizationPopover;
