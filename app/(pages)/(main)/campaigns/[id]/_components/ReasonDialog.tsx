import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/client/shared/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

type ReasonDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel: ReactNode;
  placeholder: string;
  pending: boolean;
  /** Called with the trimmed reason. */
  onConfirm: (reason: string) => void;
  /** Extra fields shown above the reason. */
  children?: ReactNode;
};

/** A dialog that asks for a required reason before confirming. */
export function ReasonDialog({ open, onOpenChange, ...props }: ReasonDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {/* Inside the content so the reason resets each time the dialog closes. */}
        <ReasonForm onOpenChange={onOpenChange} {...props} />
      </DialogContent>
    </Dialog>
  );
}

function ReasonForm({
  onOpenChange,
  title,
  description,
  confirmLabel,
  placeholder,
  pending,
  onConfirm,
  children,
}: Omit<ReasonDialogProps, 'open'>) {
  const { t } = useTranslation('common');
  const [reason, setReason] = useState('');

  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        {description && <DialogDescription>{description}</DialogDescription>}
      </DialogHeader>
      {children}
      <Textarea
        value={reason}
        maxLength={500}
        placeholder={placeholder}
        onChange={(e) => setReason(e.target.value)}
      />
      <DialogFooter>
        <Button variant="outlined-brown" onClick={() => onOpenChange(false)}>
          {t('Cancel')}
        </Button>
        <Button variant="brown" isDisabled={!reason.trim() || pending} onClick={() => onConfirm(reason.trim())}>
          {confirmLabel}
        </Button>
      </DialogFooter>
    </>
  );
}
