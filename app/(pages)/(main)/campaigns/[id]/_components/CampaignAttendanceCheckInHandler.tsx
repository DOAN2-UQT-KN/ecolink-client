import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from '@/libs/router';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { scanAttendance, type IScanResult } from '@/apis/campaign/campaignAttendance';
import { Button } from '@/components/client/shared/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { apiErrorMessage } from '@/constants/apiErrorMessages';
import { format } from 'date-fns';

import { useCampaignDetail } from '../_hooks/useCampaignDetail';

type Outcome =
  | { kind: 'done'; result: IScanResult }
  | { kind: 'error'; message: string; retry: boolean };

/** The device's position; precise, fresh, within 15 s. */
function currentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('unsupported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15_000,
      maximumAge: 0,
    });
  });
}

/**
 * A volunteer opened a shift's QR code (`?attendance=<jwt>`, spec 4.1): sends it with the device's
 * GPS position. The first scan checks in, a later one checks out.
 */
export function CampaignAttendanceCheckInHandler() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { campaignId, campaign, isLoading, isError } = useCampaignDetail();
  const token = searchParams.get('attendance');
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [busy, setBusy] = useState(false);
  const started = useRef(false);

  const clearQuery = useCallback(() => {
    router.replace(`/campaigns/${campaignId}`);
  }, [router, campaignId]);

  const run = useCallback(
    async (raw: string) => {
      setBusy(true);
      try {
        let position: GeolocationPosition;
        try {
          position = await currentPosition();
        } catch {
          setOutcome({
            kind: 'error',
            message: t('Allow precise location to check in, then try again.'),
            retry: true,
          });
          return;
        }
        const res = await scanAttendance(campaignId, {
          token: raw,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setOutcome({ kind: 'done', result: res.data });
        void queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
      } catch (err: unknown) {
        const e = err as { code?: string; message?: string; status?: number };
        if (e?.status === 401) return;
        setOutcome({
          kind: 'error',
          message: apiErrorMessage(e, t) ?? e?.message ?? t('Check-in failed'),
          // GPS errors are worth another try at once; an expired code needs a new scan.
          retry: e?.code === 'ATTENDANCE_GPS_INACCURATE' || e?.code === 'ATTENDANCE_OUTSIDE_AREA',
        });
      } finally {
        setBusy(false);
      }
    },
    [campaignId, queryClient, t],
  );

  useEffect(() => {
    const raw = token?.trim();
    if (!raw || isLoading || isError || !campaign || started.current) return;
    started.current = true;
    void run(raw);
  }, [token, campaign, isLoading, isError, run]);

  const close = () => {
    setOutcome(null);
    clearQuery();
  };
  const hhmm = (iso?: string | null) => (iso ? format(new Date(iso), 'HH:mm') : '');
  const result = outcome?.kind === 'done' ? outcome.result : null;
  const title = !outcome
    ? ''
    : outcome.kind === 'error'
      ? t('Check-in failed')
      : {
          check_in: t('Checked in successfully'),
          check_out: t('Checked out successfully'),
          already_checked_in: t('Already checked in'),
          already_checked_out: t('Already checked out'),
        }[outcome.result.action];

  return (
    <Dialog open={Boolean(outcome) || busy} onOpenChange={(open) => !open && !busy && close()}>
      <DialogContent className="max-w-sm p-5">
        <DialogHeader>
          <DialogTitle>{busy ? t('Checking your location…') : title}</DialogTitle>
          <DialogDescription>
            {busy
              ? t('Keep this page open while we confirm you are at the meeting point.')
              : outcome?.kind === 'error'
                ? outcome.message
                : result?.check_out_at
                  ? t('In {{in}}, out {{out}}.', { in: hhmm(result.check_in_at), out: hhmm(result.check_out_at) }) +
                    ' ' +
                    (result.eligible
                      ? t('This shift counts for your points.')
                      : t('You were present less than 60% of the shift; it does not count for points.'))
                  : result
                    ? t('In at {{time}}. Scan the code again at the end of the shift to check out.', {
                        time: hhmm(result.check_in_at),
                      })
                    : ''}
          </DialogDescription>
        </DialogHeader>
        {!busy && (
          <DialogFooter>
            {outcome?.kind === 'error' && outcome.retry && token && (
              <Button type="button" variant="outlined-brown" size="medium" onClick={() => void run(token.trim())}>
                {t('Try again')}
              </Button>
            )}
            <Button type="button" variant="brown" size="medium" onClick={close}>
              {t('Close')}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
