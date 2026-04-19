"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/client/shared/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { IOrganization } from "@/apis/organization/models/organization";
import { useUpdateOrganization } from "@/apis/organization/organizationById";

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
  const [name, setName] = useState(organization.name);
  const [contactEmail, setContactEmail] = useState(
    organization.contact_email ?? "",
  );
  const [description, setDescription] = useState(
    organization.description ?? "",
  );

  const orgId = organization.id;

  const { mutate, isPending } = useUpdateOrganization({
    onSuccess: () => {
      onUpdated();
      onOpenChange(false);
    },
  });

  const canSubmit = useMemo(() => {
    return name.trim().length > 0 && contactEmail.trim().length > 0;
  }, [name, contactEmail]);

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;
    mutate({
      id: orgId,
      data: {
        name: name.trim(),
        contact_email: contactEmail.trim(),
        description: description.trim() || undefined,
      },
    });
  }, [canSubmit, mutate, orgId, name, contactEmail, description]);

  return (
    <DialogContent
      className="sm:max-w-md"
      showCloseButton
      onPointerDownOutside={(e) => {
        if (isPending) e.preventDefault();
      }}
      onEscapeKeyDown={(e) => {
        if (isPending) e.preventDefault();
      }}
    >
      <DialogHeader>
        <DialogTitle className="text-left font-semibold">
          {t("Edit organization")}
        </DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-4 py-2">
        <div className="space-y-2">
          <Label htmlFor={`org-edit-name-${orgId}`}>{t("Name")}</Label>
          <Input
            id={`org-edit-name-${orgId}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isPending}
            placeholder={t("Enter organization name...")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`org-edit-email-${orgId}`}>
            {t("Contact email")}
          </Label>
          <Input
            id={`org-edit-email-${orgId}`}
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            disabled={isPending}
            placeholder={t("contact@example.com")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`org-edit-desc-${orgId}`}>
            {t("Description")}
          </Label>
          <Textarea
            id={`org-edit-desc-${orgId}`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isPending}
            rows={4}
            placeholder={t("Name, description...")}
          />
        </div>
      </div>
      <DialogFooter className="gap-2 sm:gap-0">
        <Button
          type="button"
          variant="outlined-brown"
          size="medium"
          onClick={() => onOpenChange(false)}
          disabled={isPending}
        >
          {t("Cancel")}
        </Button>
        <Button
          type="button"
          variant="brown"
          size="medium"
          onClick={handleSubmit}
          disabled={isPending || !canSubmit}
        >
          {isPending ? t("Submitting...") : t("Confirm")}
        </Button>
      </DialogFooter>
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
