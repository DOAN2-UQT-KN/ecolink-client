'use client';

import { memo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Phone, FileText, Megaphone } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import SelectListCampaign, { ALL_CAMPAIGNS_VALUE } from '@/components/form/SelectListCampaign';
import { useCreateSOS } from '@/apis/sos/createSos';
import type { ISOS } from '@/apis/sos/models/sos';

interface SOSFormProps {
  open: boolean;
  onClose: () => void;
  onCreated: (sos: ISOS) => void;
  defaultCampaignId?: string;
}

interface FormErrors {
  content?: string;
  phone?: string;
}

const PHONE_RE = /^[0-9+\s\-(). ]{7,20}$/;

const SOSForm = memo(function SOSForm({
  open,
  onClose,
  onCreated,
  defaultCampaignId,
}: SOSFormProps) {
  const { t } = useTranslation();
  const [content, setContent] = useState('');
  const [phone, setPhone] = useState('');
  const [campaignId, setCampaignId] = useState(defaultCampaignId ?? '');
  const [errors, setErrors] = useState<FormErrors>({});

  const { mutate: createSOS, isPending } = useCreateSOS({
    onSuccess: (data) => {
      const sos = data?.data?.sos;
      if (sos) onCreated(sos);
      handleClose();
    },
  });

  const handleClose = useCallback(() => {
    setContent('');
    setPhone('');
    setCampaignId(defaultCampaignId ?? '');
    setErrors({});
    onClose();
  }, [onClose, defaultCampaignId]);

  const validate = useCallback((): boolean => {
    const next: FormErrors = {};
    if (!content.trim()) next.content = t('Content is required');
    if (!phone.trim()) {
      next.phone = t('Phone number is required');
    } else if (!PHONE_RE.test(phone.trim())) {
      next.phone = t('Invalid phone number');
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [content, phone, t]);

  const handleSubmit = useCallback(() => {
    if (!validate()) return;
    createSOS({
      content: content.trim(),
      phone: phone.trim(),
      ...(campaignId && campaignId !== ALL_CAMPAIGNS_VALUE
        ? { campaign_id: campaignId }
        : {}),
    });
  }, [validate, createSOS, content, phone, campaignId]);

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600 text-lg font-bold">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            {t('Create SOS Alert')}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            {t('Fill in the details below. Our team will respond immediately.')}
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Content */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-gray-500" />
              {t('Emergency Description')}
              <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (errors.content) setErrors((p) => ({ ...p, content: undefined }));
              }}
              placeholder={t('Describe the emergency situation...')}
              className={errors.content ? 'border-red-500 focus-visible:ring-red-500/50' : ''}
              rows={3}
            />
            {errors.content && (
              <p className="text-xs text-red-500">{errors.content}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-gray-500" />
              {t('Contact Phone')}
              <span className="text-red-500">*</span>
            </label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (errors.phone) setErrors((p) => ({ ...p, phone: undefined }));
              }}
              placeholder={t('e.g. +84 901 234 567')}
              className={errors.phone ? 'border-red-500 focus-visible:ring-red-500/50' : ''}
            />
            {errors.phone && (
              <p className="text-xs text-red-500">{errors.phone}</p>
            )}
          </div>

          {/* Campaign */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <Megaphone className="h-3.5 w-3.5 text-gray-500" />
              {t('Related Campaign')}
              <span className="text-xs font-normal text-muted-foreground ml-1">
                ({t('optional')})
              </span>
            </label>
            <SelectListCampaign
              value={campaignId}
              onChange={setCampaignId}
              allOptions
              disabled={isPending}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            {t('Cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold transition-all duration-200"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                {t('Sending...')}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                🚨 {t('Send SOS')}
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

export default SOSForm;
