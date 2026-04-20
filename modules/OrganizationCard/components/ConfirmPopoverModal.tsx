"use client";

import { memo, useCallback, useMemo, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/client/shared/Button";
import { cn } from "@/libs/utils";

export type ConfirmPopoverModalType = "leave" | "cancel";

export type ConfirmPopoverModalProps = {
  type: ConfirmPopoverModalType;
  trigger: ReactNode;
  onConfirm: () => void | Promise<void>;
  confirmPending?: boolean;
};

export const ConfirmPopoverModal = memo(function ConfirmPopoverModal({
  type,
  trigger,
  onConfirm,
  confirmPending = false,
}: ConfirmPopoverModalProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const title = useMemo(() => {
    return type === "leave"
      ? t("Leave this organization?")
      : t("Cancel your join request?");
  }, [type, t]);

  const description = useMemo(() => {
    return type === "leave"
      ? t("You will need to join again to regain access.")
      : t("You can submit a new request later.");
  }, [type, t]);
  
  const confirmLabel = useMemo(() => {
    return type === "leave" ? t("Leave") : t("Cancel request");
  }, [type, t]);

  const runConfirm = useCallback(async () => {
    await onConfirm();
    setOpen(false);
  }, [onConfirm]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        className={cn(
          "gap-4 border-[rgba(136,122,71,0.45)] sm:max-w-md",
          "bg-white text-foreground",
        )}
        showCloseButton
        onPointerDownOutside={(e) => {
          if (confirmPending) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (confirmPending) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-left font-semibold text-foreground">
            {title}
          </DialogTitle>
          <DialogDescription className="text-left text-sm text-foreground-secondary">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:justify-end sm:gap-2">
          <Button
            variant="outlined-brown"
            size="medium"
            disabled={confirmPending}
            // className="border-[rgba(136,122,71,0.45)]"
            className="h-[40px] flex items-center gap-1.5 flex-row"
            onClick={() => setOpen(false)}
          >
            {t("Cancel")}
          </Button>
          <Button
            variant="brown"
            size="medium"
            disabled={confirmPending}
            // className=" bg-button-accent text-white hover:bg-button-accent/90"
            className="h-[40px] flex items-center gap-1.5 flex-row"
            onClick={() => void runConfirm()}
          >
            {confirmPending ? (
              <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
            ) : null}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

export default ConfirmPopoverModal;
