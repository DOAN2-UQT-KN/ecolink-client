import { memo, useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { TbArrowBackUp, TbQrcode, TbUserPlus, TbUserX } from 'react-icons/tb';

import {
  useAddManualAttendance,
  useAttendanceQr,
  useCloseAttendance,
  useExcludeAttendance,
  useOpenAttendanceSession,
  useRestoreAttendance,
  useShiftAttendance,
  type IShiftAttendanceRow,
} from '@/apis/campaign/campaignAttendance';
import type { IRegisteredVolunteer } from '@/apis/campaign/models/registration';
import { Button } from '@/components/client/shared/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Pill } from '@/components/ui/Pill';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmPopoverModal } from '@/modules/OrganizationCard/components/ConfirmPopoverModal';
import showMessage, { MessageLevel, MessageType } from '@/utils/showMessage';

const hhmm = (iso?: string | null) => (iso ? format(new Date(iso), 'HH:mm') : '—');

/** The dynamic QR of the open session: a new code every period (spec 4.1). */
const AttendanceQrDialog = memo(function AttendanceQrDialog({
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
  const [periodSec, setPeriodSec] = useState(600);
  const { data, isError } = useAttendanceQr(
    { campaign_id: campaignId, shift_id: shiftId },
    { enabled: open, refetchInterval: periodSec * 1000, refetchIntervalInBackground: true, gcTime: 0 },
  );
  const qr = data?.data;
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    if (qr?.period_sec) setPeriodSec(qr.period_sec);
    if (!qr?.token) return;
    const url = `${window.location.origin}/campaigns/${campaignId}?attendance=${encodeURIComponent(qr.token)}`;
    void QRCode.toDataURL(url, { width: 300, margin: 2 }).then(setImage);
  }, [qr?.token, qr?.period_sec, campaignId]);

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
              {t('Session open until {{time}}', { time: hhmm(qr.session_expires_at) })}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
});

/**
 * Attendance of one shift for its leader and the campaign's managers (spec 4.1): open the QR
 * session, end it (checks everyone out), add someone by hand, and see who counts for points.
 */
export const ShiftAttendancePanel = memo(function ShiftAttendancePanel({
  campaignId,
  shiftId,
  registered,
  className,
}: {
  campaignId: string;
  shiftId: string;
  /** Registered volunteers of the shift, offered for manual attendance. */
  registered: IRegisteredVolunteer[];
  className?: string;
}) {
  const { t } = useTranslation('common');
  const params = { campaign_id: campaignId, shift_id: shiftId };
  const [qrOpen, setQrOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualUser, setManualUser] = useState<string | undefined>();
  const [reason, setReason] = useState('');

  const { data, isError } = useShiftAttendance(params, { refetchInterval: qrOpen ? 10_000 : false });
  const view = data?.data;
  const { mutate: openSession, isPending: isOpening } = useOpenAttendanceSession({
    onSuccess: () => setQrOpen(true),
  });
  const { mutateAsync: closeSession, isPending: isClosing } = useCloseAttendance({
    onSuccess: (res) =>
      showMessage({
        type: MessageType.Toast,
        level: MessageLevel.Success,
        title: t('Attendance ended; {{n}} person(s) checked out', { n: res.data.checked_out }),
      }),
  });
  const { mutate: addManual, isPending: isAdding } = useAddManualAttendance({
    onSuccess: () => {
      setManualOpen(false);
      setReason('');
      setManualUser(undefined);
    },
  });

  const [excluding, setExcluding] = useState<IShiftAttendanceRow | null>(null);
  const [excludeReason, setExcludeReason] = useState('');
  const { mutate: exclude, isPending: isExcluding } = useExcludeAttendance({
    onSuccess: () => {
      setExcluding(null);
      setExcludeReason('');
    },
  });
  const { mutate: restore, isPending: isRestoring } = useRestoreAttendance();

  const presentIds = useMemo(() => new Set((view?.attendances ?? []).map((a) => a.user_id)), [view]);
  const candidates = registered.filter((r) => !presentIds.has(r.user_id));

  if (isError || !view) return null;
  const now = Date.now();
  const ended = new Date(view.end_at).getTime() + 30 * 60 * 1000 < now;

  return (
    <div className={className}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col">
          <h2 className="font-display-6 font-semibold text-button-accent">{t('Attendance')}</h2>
          <span className="text-xs text-foreground-tertiary">
            {t('{{present}} present · {{eligible}} count for points · {{manual}} manual', {
              present: view.present,
              eligible: view.eligible,
              manual: view.manual,
            })}
            {view.flagged > 0 && (
              <span className="text-amber-700">
                {' · '}
                {t('{{n}} flagged to check', { n: view.flagged })}
              </span>
            )}
          </span>
        </div>
        {view.can_run && !ended && (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="brown"
              size="medium"
              iconLeft={<TbQrcode className="size-4" aria-hidden />}
              isDisabled={isOpening}
              onClick={() => (view.session ? setQrOpen(true) : openSession(params))}
            >
              {view.session ? t('Show QR') : t('Open attendance')}
            </Button>
            <Button
              type="button"
              variant="outlined-brown"
              size="medium"
              iconLeft={<TbUserPlus className="size-4" aria-hidden />}
              onClick={() => setManualOpen(true)}
            >
              {t('Add manually')}
            </Button>
            <ConfirmPopoverModal
              title={t('End attendance?')}
              description={t(
                'Everyone still checked in is checked out now and the QR code stops working. Someone without a check-out does not count for points.',
              )}
              confirmLabel={t('End attendance')}
              cancelLabel={t('Cancel')}
              confirmPending={isClosing}
              onConfirm={async () => {
                await closeSession(params);
                setQrOpen(false);
              }}
              trigger={
                <Button type="button" variant="outlined-brown" size="medium">
                  {t('End attendance')}
                </Button>
              }
            />
          </div>
        )}
      </div>

      {view.attendances.length === 0 ? (
        <p className="text-sm text-foreground-tertiary">{t('Nobody has checked in yet')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-foreground-tertiary">
              <tr>
                <th className="py-2 pr-3 font-medium">{t('Volunteer')}</th>
                <th className="py-2 pr-3 font-medium">{t('In')}</th>
                <th className="py-2 pr-3 font-medium">{t('Out')}</th>
                <th className="py-2 pr-3 font-medium" />
                {view.can_run && <th className="py-2 font-medium" />}
              </tr>
            </thead>
            <tbody>
              {view.attendances.map((a) => (
                <tr key={a.user_id} className="border-t border-[rgba(136,122,71,0.2)]">
                  <td className="py-2 pr-3">{a.volunteer?.name || t('Unnamed volunteer')}</td>
                  <td className="py-2 pr-3 tabular-nums">{hhmm(a.check_in_at)}</td>
                  <td className="py-2 pr-3 tabular-nums">{hhmm(a.check_out_at)}</td>
                  <td className="py-2 pr-3">
                    <div className="flex flex-wrap gap-1">
                      {a.excluded && (
                        <Pill tone="red" title={a.exclude_reason ?? undefined}>
                          {t('Excluded')}
                        </Pill>
                      )}
                      {a.out_of_area && (
                        <Pill tone="amber">
                          {t('Out of area ({{m}} m)', {
                            m: Math.max(a.check_in_distance_m ?? 0, a.check_out_distance_m ?? 0),
                          })}
                        </Pill>
                      )}
                      {a.low_accuracy && <Pill tone="amber">{t('Imprecise GPS')}</Pill>}
                      {a.eligible ? (
                        <Pill tone="green">{t('Counts for points')}</Pill>
                      ) : a.check_out_at ? (
                        <Pill tone="red">{t('Under 60%')}</Pill>
                      ) : null}
                      {a.manual && <Pill tone="amber">{t('Manual')}</Pill>}
                      {!a.pre_registered && <Pill tone="neutral">{t('Not registered')}</Pill>}
                      {a.offline && <Pill tone="neutral">{t('Synced later')}</Pill>}
                    </div>
                  </td>
                  {view.can_run && (
                    <td className="py-2 text-right">
                      {a.excluded ? (
                        <Button
                          type="button"
                          variant="outlined-brown"
                          size="medium"
                          aria-label={t('Restore')}
                          title={t('Restore')}
                          isDisabled={isRestoring}
                          onClick={() => restore({ ...params, user_id: a.user_id })}
                        >
                          <TbArrowBackUp className="size-5" aria-hidden />
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outlined-brown"
                          size="medium"
                          aria-label={t('Exclude')}
                          title={t('Exclude')}
                          onClick={() => {
                            setExcludeReason('');
                            setExcluding(a);
                          }}
                        >
                          <TbUserX className="size-5" aria-hidden />
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AttendanceQrDialog campaignId={campaignId} shiftId={shiftId} open={qrOpen} onOpenChange={setQrOpen} />

      <Dialog open={Boolean(excluding)} onOpenChange={(open) => !open && setExcluding(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('Exclude this attendance?')}</DialogTitle>
            <DialogDescription>
              {t(
                '{{name}} will not get points for this shift. You can restore it later. A reason is required.',
                { name: excluding?.volunteer?.name || t('Unnamed volunteer') },
              )}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={excludeReason}
            maxLength={500}
            placeholder={t('Reason (e.g. was not at the meeting point)')}
            onChange={(e) => setExcludeReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outlined-brown" onClick={() => setExcluding(null)}>
              {t('Cancel')}
            </Button>
            <Button
              variant="brown"
              isDisabled={!excludeReason.trim() || isExcluding}
              onClick={() =>
                excluding && exclude({ ...params, user_id: excluding.user_id, reason: excludeReason.trim() })
              }
            >
              {t('Exclude')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={manualOpen} onOpenChange={setManualOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('Add attendance manually')}</DialogTitle>
            <DialogDescription>
              {t(
                'For someone whose phone failed. A reason is required; at most 20% of the people present may be added by hand.',
              )}
            </DialogDescription>
          </DialogHeader>
          <Select value={manualUser} onValueChange={setManualUser}>
            <SelectTrigger className="!h-[44px] w-full">
              <SelectValue placeholder={t('Choose a registered volunteer')} />
            </SelectTrigger>
            <SelectContent>
              {candidates.map((c) => (
                <SelectItem key={c.user_id} value={c.user_id}>
                  {c.volunteer?.name || c.user_id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            value={reason}
            maxLength={500}
            placeholder={t('Reason (e.g. phone out of battery)')}
            onChange={(e) => setReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outlined-brown" onClick={() => setManualOpen(false)}>
              {t('Cancel')}
            </Button>
            <Button
              variant="brown"
              isDisabled={!manualUser || !reason.trim() || isAdding}
              onClick={() => manualUser && addManual({ ...params, user_id: manualUser, reason: reason.trim() })}
            >
              {t('Add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

export default ShiftAttendancePanel;
