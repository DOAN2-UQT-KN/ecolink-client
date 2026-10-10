import { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAttendanceQr } from '@/apis/campaign/getAttendanceQr';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { hhmm } from '@/utils/campaignLabels';

/** The dynamic QR of the open session: a new code every period (spec 4.1). */
export const AttendanceQrDialog = memo(function AttendanceQrDialog({
  campaignId,
  shiftId,
  open,
  onOpenChange,
}: {
  campaignId: string;
  shiftId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation('common');
  const { data, isError } = useAttendanceQr(
    { campaign_id: campaignId, shift_id: shiftId },
    {
      enabled: open,
      refetchInterval: (query) => (query.state.data?.data?.period_sec || 600) * 1000,
      refetchIntervalInBackground: true,
      gcTime: 0,
    },
  );
  const qr = data?.data;
  const periodSec = qr?.period_sec || 600;
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    if (!qr?.token) return;
    const url = `${window.location.origin}/campaigns/${campaignId}?attendance=${encodeURIComponent(qr.token)}`;
    // qrcode is only needed while this dialog shows a code.
    void import('qrcode').then(({ default: QRCode }) =>
      QRCode.toDataURL(url, { width: 300, margin: 2 }).then(setImage),
    );
  }, [qr?.token, campaignId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('Attendance QR')}</DialogTitle>
          <DialogDescription>
            {t(
              'Volunteers scan this code with their phone at the meeting point, with precise location on. The code changes every {{n}} minutes. Scans farther than 50 m are recorded but flagged for you to check.',
              { n: Math.round(periodSec / 60) },
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-3 py-2">
          {isError ? (
            <p className="text-sm text-destructive">{t('The session has ended; open attendance again.')}</p>
          ) : image ? (
            <img src={image} alt="" className="rounded-lg border border-border/60 bg-white p-2" width={300} height={300} />
          ) : (
            <p className="text-sm text-muted-foreground">{t('Loading')}…</p>
          )}
          {qr?.session_expires_at && (
            <p className="text-xs text-muted-foreground">
              {t('Session open until {{time}}', { time: hhmm(qr.session_expires_at, '—') })}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
});
