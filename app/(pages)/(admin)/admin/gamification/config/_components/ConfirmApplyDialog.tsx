"use client";

import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ConfirmApplyDialog({
  open,
  title = "Apply changes?",
  description = "This action updates live gamification settings.",
  onCancel,
  onConfirm,
  busy,
}: {
  open: boolean;
  title?: string;
  description?: string;
  onCancel: () => void;
  onConfirm: () => void;
  busy?: boolean;
}) {
  const { t } = useTranslation();
  const resolvedTitle = title ?? t("Apply changes?");
  const resolvedDescription =
    description ?? t("This action updates live gamification settings.");

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !busy && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{resolvedTitle}</DialogTitle>
          <DialogDescription>{resolvedDescription}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
            {t("Cancel")}
          </Button>
          <Button type="button" onClick={onConfirm} disabled={busy}>
            {t("Confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
