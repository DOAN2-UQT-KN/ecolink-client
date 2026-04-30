'use client';

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/client/shared/Button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import SelectListCampaign, { ALL_CAMPAIGNS_VALUE } from '@/components/form/SelectListCampaign';
import { useCreateSOS } from '@/apis/sos/createSos';
import type { ISOS } from '@/apis/sos/models/sos';

interface SOSFormProps {
  open: boolean;
  onClose: () => void;
  onCreated: (sos: ISOS) => void;
  defaultCampaignId?: string;
}

interface SOSFormValues {
  content: string;
  phone: string;
  campaign_id: string;
}

const PHONE_RE = /^[0-9+\s\-(). ]{7,20}$/;

const inputClassName =
  'border-1 border-[rgba(136,122,71,0.5)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50';

const SOSForm = memo(function SOSForm({
  open,
  onClose,
  onCreated,
  defaultCampaignId,
}: SOSFormProps) {
  const { t } = useTranslation();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SOSFormValues>({
    defaultValues: {
      content: '',
      phone: '',
      campaign_id: defaultCampaignId ?? '',
    },
  });

  const { mutate: createSOS, isPending } = useCreateSOS({
    onSuccess: (data) => {
      const sos = data?.data?.sos;
      if (sos) onCreated(sos);
      handleClose();
    },
  });

  const handleClose = () => {
    reset({ content: '', phone: '', campaign_id: defaultCampaignId ?? '' });
    onClose();
  };

  const onSubmit = (values: SOSFormValues) => {
    createSOS({
      content: values.content.trim(),
      phone: values.phone.trim(),
      ...(values.campaign_id && values.campaign_id !== ALL_CAMPAIGNS_VALUE
        ? { campaign_id: values.campaign_id }
        : {}),
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600 text-lg font-bold">
            {t('Create SOS Alert')}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            {t('Fill in the details below. Our team will respond immediately.')}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Content */}
          <Field>
            <FieldLabel className="text-foreground-tertiary font-display-3">
              {t('Emergency Description')} <span className="text-destructive">*</span>
            </FieldLabel>
            <Textarea
              {...register('content', { required: t('Content is required') })}
              placeholder={t('Describe the emergency situation...')}
              className={inputClassName}
              rows={3}
            />
            <FieldError errors={[errors.content]} />
          </Field>

          {/* Phone */}
          <Field>
            <FieldLabel className="text-foreground-tertiary font-display-3">
              {t('Contact Phone')} <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              type="tel"
              {...register('phone', {
                required: t('Phone number is required'),
                validate: (v) => PHONE_RE.test(v.trim()) || t('Invalid phone number'),
              })}
              placeholder={t('e.g. +84 901 234 567')}
              className={inputClassName}
            />
            <FieldError errors={[errors.phone]} />
          </Field>

          {/* Campaign */}
          <Field>
            <FieldLabel className="text-foreground-tertiary font-display-3">
              {t('Related Campaign')} <span className="text-destructive">*</span>
            </FieldLabel>
            <Controller
              name="campaign_id"
              control={control}
              render={({ field }) => (
                <SelectListCampaign
                  value={field.value}
                  onChange={field.onChange}
                  allOptions
                  disabled={isPending}
                />
              )}
            />
          </Field>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outlined-brown"
              onClick={handleClose}
              disabled={isPending}
            >
              {t('Cancel')}
            </Button>
            <Button type="submit" variant="brown" disabled={isPending}>
              {isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  {t('Sending...')}
                </span>
              ) : (
                <span className="flex items-center gap-2">{t('Submit')}</span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
});

export default SOSForm;
