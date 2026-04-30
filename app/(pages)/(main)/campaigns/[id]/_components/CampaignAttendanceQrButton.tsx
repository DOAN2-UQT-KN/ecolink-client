'use client';

import { memo, useCallback, useState } from 'react';
import QRCode from 'qrcode';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { issueCampaignAttendanceQr } from '@/apis/campaign/campaignAttendance';
import { Button } from '@/components/client/shared/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { STATUS } from '@/constants/status';

import { useCampaignDetail } from '../_hooks/useCampaignDetail';

export const CampaignAttendanceQrButton = memo(function CampaignAttendanceQrButton() {
  const { t } = useTranslation('common');
  const { campaignId, campaign, canManageCampaign } = useCampaignDetail();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [expiresLabel, setExpiresLabel] = useState<string | null>(null);

  const loadQr = useCallback(async () => {
    setLoading(true);
    setQrDataUrl(null);
    setExpiresLabel(null);
    try {
      const res = await issueCampaignAttendanceQr(campaignId);
      const tok = res.data?.token;
      const expRaw = res.data?.expires_at;
      if (!tok) {
        throw new Error('missing token');
      }
      if (expRaw) {
        try {
          setExpiresLabel(
            new Date(expRaw).toLocaleString(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short',
            }),
          );
        } catch {
          setExpiresLabel(null);
        }
      }
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const targetUrl = `${origin}/campaigns/${campaignId}?attendance=${encodeURIComponent(tok)}`;
      const dataUrl = await QRCode.toDataURL(targetUrl, { width: 280, margin: 2 });
      setQrDataUrl(dataUrl);
    } catch {
      toast.error(t('Could not generate attendance QR'));
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }, [campaignId, t]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next);
      if (next) {
        void loadQr();
      } else {
        setQrDataUrl(null);
        setExpiresLabel(null);
      }
    },
    [loadQr],
  );

  const show = canManageCampaign && campaign?.status === STATUS.ACTIVE;

  if (!show) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outlined-brown" size="medium" className="!h-[45px]">
          {t('Attendance QR')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('Attendance QR')}</DialogTitle>
          <DialogDescription>{t('Attendance QR description')}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-2">
          {loading ? (
            <p className="text-sm text-muted-foreground">{t('Loading')}…</p>
          ) : qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- data URL from qrcode
            <img
              src={qrDataUrl}
              alt=""
              className="rounded-lg border border-border/60 p-2 bg-white"
              width={280}
              height={280}
            />
          ) : null}
          {expiresLabel ? (
            <p className="text-xs text-muted-foreground text-center">
              {t('QR expires at', { time: expiresLabel })}
            </p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
});
