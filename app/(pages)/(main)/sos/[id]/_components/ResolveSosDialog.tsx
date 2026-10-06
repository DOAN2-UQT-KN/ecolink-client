import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useResolveSos } from '@/apis/sos/manageSos';
import type { ISosDetailResponse, SosResolutionCode } from '@/apis/sos/models/sos';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldLabel } from '@/components/ui/field';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { Textarea } from '@/components/ui/textarea';
import { SOS_RESOLUTION_CODES } from '@/constants/sos';
import { cn } from '@/libs/utils';

/** "Đã giải quyết": a closing code and an optional note; everyone on the way is told to stop. */
export function ResolveSosDialog({
  sosId,
  open,
  onOpenChange,
  onResolved,
}: {
  sosId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolved: (res: ISosDetailResponse) => void;
}) {
  const { t } = useTranslation();
  const [code, setCode] = useState<SosResolutionCode>('handled');
  const [note, setNote] = useState('');
  const mutation = useResolveSos({
    onSuccess: (res) => {
      onResolved(res);
      onOpenChange(false);
    },
  });

  const submit = async () => {
    try {
      await mutation.mutateAsync({ id: sosId, code, ...(note.trim() ? { note: note.trim() } : {}) });
    } catch {
      // usePost surfaces API errors.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('Mark this SOS as resolved')}</DialogTitle>
          <DialogDescription>
            {t('People on the way will be told they no longer need to come.')}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel className="text-foreground-tertiary font-display-3">
              {t('Outcome')} <span className="text-destructive">*</span>
              <InfoTooltip
                content={t('"False alarm" and "Not real" are logged; repeated ones are reviewed by an admin.')}
              />
            </FieldLabel>
            <div className="flex flex-wrap gap-2" role="radiogroup">
              {SOS_RESOLUTION_CODES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  role="radio"
                  aria-checked={code === c.value}
                  onClick={() => setCode(c.value)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-sm transition',
                    code === c.value
                      ? 'border-button-accent bg-button-accent text-white'
                      : 'border-[rgba(136,122,71,0.4)] bg-white text-foreground-secondary hover:bg-background-primary',
                  )}
                >
                  {t(c.label)}
                </button>
              ))}
            </div>
          </Field>
          <Field>
            <FieldLabel className="text-foreground-tertiary font-display-3">
              {t('How was it handled?')}
            </FieldLabel>
            <Textarea
              rows={3}
              maxLength={1000}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('Optional note')}
            />
          </Field>
        </div>
        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            {t('Cancel')}
          </Button>
          <Button type="button" onClick={() => void submit()} disabled={mutation.isPending}>
            {mutation.isPending ? t('Saving...') : t('Mark as resolved')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
