import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useCancelMyRedemption } from '@/apis/gift/cancelMyRedemption';
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
import { cn } from '@/libs/utils';
import { fieldErrorsFromApi } from '@/utils/validationErrors';
import {
  CANCEL_REASON_OPTIONS,
  isStaleOrderError,
  MAX_CANCEL_REASON,
  toCancelRequest,
} from '../_services/orderAction.service';

type Props = { code: string; className?: string };

/** The customer cancels an order not yet shipped; points come back, the item returns to stock. */
export function CancelOrderDialog({ code, className }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  // "Other" has no text of its own, so its selection is kept apart from the reason.
  const [other, setOther] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { mutateAsync, isPending } = useCancelMyRedemption({ onSuccess: () => setOpen(false) });
  const {
    register,
    reset,
    setError,
    setValue,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<{ reason: string }>({ defaultValues: { reason: '' } });

  useEffect(() => {
    if (open) {
      reset({ reason: '' });
      setOther(false);
    }
  }, [open, reset]);

  const submit = handleSubmit(async ({ reason }) => {
    try {
      await mutateAsync(toCancelRequest(code, reason));
    } catch (error) {
      // Shipped meanwhile: usePost already showed the server's message and refetched the order.
      if (isStaleOrderError(error)) {
        setOpen(false);
        return;
      }
      for (const e of fieldErrorsFromApi(error)) {
        if (e.field === 'cancelReason') setError('reason', { message: e.message });
      }
    }
  });

  const reason = watch('reason');
  const length = reason.trim().length;
  const picked = other ? null : CANCEL_REASON_OPTIONS.find((option) => t(option) === reason.trim());
  const pick = (option: (typeof CANCEL_REASON_OPTIONS)[number] | null) => {
    setOther(option === null);
    setValue('reason', option ? t(option) : '', { shouldValidate: option !== null });
    if (option === null) textareaRef.current?.focus();
  };
  const reasonField = register('reason', {
    validate: (v) => {
      const n = v.trim().length;
      if (n === 0) return t('Enter a reason');
      return n <= MAX_CANCEL_REASON || t('At most {{max}} characters', { max: MAX_CANCEL_REASON });
    },
  });
  const chip = (selected: boolean) =>
    cn(
      'cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button-accent disabled:cursor-not-allowed disabled:opacity-50',
      selected
        ? 'border-button-accent bg-button-accent text-white'
        : 'border-[rgba(136,122,71,0.35)] text-foreground hover:bg-[#f5f2e6]',
    );

  return (
    <>
      <Button
        type="button"
        variant="outlined-brown"
        size="medium"
        className={className}
        onClick={() => setOpen(true)}
      >
        {t('Cancel order')}
      </Button>
      <Dialog open={open} onOpenChange={(next) => !isPending && setOpen(next)}>
        <DialogContent className="max-w-md border border-[rgba(136,122,71,0.35)] bg-white">
          <DialogHeader>
            <DialogTitle>{t('Cancel order')}</DialogTitle>
            <DialogDescription>
              {t('Your points come back to your wallet right away.')}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 flex flex-col gap-3">
            <label htmlFor={`cancel-${code}`} className="text-sm font-medium">
              {t('Reason')}
              <span className="text-destructive" aria-hidden> *</span>
            </label>
            <div role="radiogroup" aria-label={t('Common reasons')} className="flex flex-wrap gap-2">
              {CANCEL_REASON_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={picked === option}
                  disabled={isPending}
                  className={chip(picked === option)}
                  onClick={() => pick(option)}
                >
                  {t(option)}
                </button>
              ))}
              <button
                type="button"
                role="radio"
                aria-checked={other}
                disabled={isPending}
                className={chip(other)}
                onClick={() => pick(null)}
              >
                {t('Other')}
              </button>
            </div>
            <Textarea
              id={`cancel-${code}`}
              rows={3}
              aria-required
              disabled={isPending}
              aria-invalid={!!errors.reason}
              aria-describedby={`cancel-${code}-hint`}
              placeholder={other ? t('Tell us why you are cancelling') : t('Pick a reason above or write your own')}
              {...reasonField}
              ref={(el) => {
                reasonField.ref(el);
                textareaRef.current = el;
              }}
            />
            <p id={`cancel-${code}-hint`} className="-mt-1 flex justify-between gap-2 text-sm">
              <span className="text-red-600">{errors.reason?.message}</span>
              <span className={cn('tabular-nums text-foreground-secondary', length > MAX_CANCEL_REASON && 'text-red-600')}>
                {length}/{MAX_CANCEL_REASON}
              </span>
            </p>
          </div>
          <DialogFooter className="mt-2">
            <Button
              variant="outlined-brown"
              size="medium"
              className="!h-[44px]"
              onClick={() => setOpen(false)}
              isDisabled={isPending}
            >
              {t('Keep order')}
            </Button>
            <Button variant="brown" size="medium" className="!h-[44px]" onClick={() => void submit()} isLoading={isPending}>
              {t('Cancel order')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
