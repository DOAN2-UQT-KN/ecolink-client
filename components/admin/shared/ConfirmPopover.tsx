"use client";

import { memo, useCallback, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/libs/utils";

export type ConfirmPopoverProps = {
  trigger: ReactNode;
  title: string;
  description?: ReactNode;
  confirmLabel: string;
  onConfirm: () => void | Promise<void>;
  rejectLabel?: string;
  onReject?: () => void | Promise<void>;
  cancelLabel?: string;
  theme?: "light" | "dark";
  confirmPending?: boolean;
  rejectPending?: boolean;
};

export const ConfirmPopover = memo(function ConfirmPopover({
  trigger,
  title,
  description,
  confirmLabel,
  onConfirm,
  rejectLabel,
  onReject,
  cancelLabel,
  theme = "dark",
  confirmPending = false,
  rejectPending = false,
}: ConfirmPopoverProps) {
  const [open, setOpen] = useState(false);
  const isDark = theme === "dark";

  const runConfirm = useCallback(async () => {
    await onConfirm();
    setOpen(false);
  }, [onConfirm]);

  const runReject = useCallback(async () => {
    if (!onReject) return;
    await onReject();
    setOpen(false);
  }, [onReject]);

  const busy = confirmPending || rejectPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        className={cn(
          "gap-4 sm:max-w-md",
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
          <DialogTitle
            className={cn("text-left font-semibold", isDark ? "text-zinc-100" : "text-zinc-900")}
          >
            {title}
          </DialogTitle>
          {description != null && description !== "" ? (
            <DialogDescription
              className={cn("text-left text-sm", isDark ? "text-zinc-400" : "text-zinc-600")}
            >
              {description}
            </DialogDescription>
          ) : null}
        </DialogHeader>
        <DialogFooter className="gap-2 sm:justify-end sm:gap-2">
          {cancelLabel ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            className={cn(
              isDark && "border-zinc-600 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-zinc-100",
            )}
            onClick={() => setOpen(false)}
          >
            {cancelLabel}
          </Button>
          ) : null}
           <Button
            type="button"
            size="sm"
            disabled={busy}
            className="inline-flex items-center gap-1.5"
            onClick={() => void runConfirm()}
          >
            {confirmPending ? (
              <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
            ) : null}
            {confirmLabel}
          </Button>
          {onReject && rejectLabel ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={busy}
              className="inline-flex items-center gap-1.5"
              onClick={() => void runReject()}
            >
              {rejectPending ? (
                <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
              ) : null}
              {rejectLabel}
            </Button>
          ) : null}
         
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

export default ConfirmPopover;
