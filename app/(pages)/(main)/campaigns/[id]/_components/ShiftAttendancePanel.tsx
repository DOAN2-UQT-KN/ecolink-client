import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TbQrcode, TbUserPlus } from 'react-icons/tb';

import { useAddManualAttendance } from '@/apis/campaign/addManualAttendance';
import { useCloseAttendance } from '@/apis/campaign/closeAttendance';
import { useExcludeAttendance } from '@/apis/campaign/excludeAttendance';
import { useOpenAttendanceSession } from '@/apis/campaign/openAttendanceSession';
import { useShiftAttendance } from '@/apis/campaign/getShiftAttendance';
import type { IShiftAttendanceRow } from '@/apis/campaign/models/attendance';
import type { IRegisteredVolunteer } from '@/apis/campaign/models/registration';
import { Button } from '@/components/client/shared/Button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmPopoverModal } from '@/components/client/shared/ConfirmPopoverModal';
import showMessage, { MessageLevel, MessageType } from '@/utils/showMessage';

import { AttendanceQrDialog } from './AttendanceQrDialog';
import { AttendanceTable } from './AttendanceTable';
import { ReasonDialog } from './ReasonDialog';

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
      setManualUser(undefined);
    },
  });

  const [excluding, setExcluding] = useState<IShiftAttendanceRow | null>(null);
  const { mutate: exclude, isPending: isExcluding } = useExcludeAttendance({
    onSuccess: () => setExcluding(null),
  });

  const presentIds = new Set((view?.attendances ?? []).map((a) => a.user_id));
  const candidates = registered.filter((r) => !presentIds.has(r.user_id));

  if (isError || !view) return null;
  const now = Date.now();
  // Ended early (spec 4.2): no more scans; otherwise check-outs run 30 minutes past the end.
  const ended = view.ended_at
    ? new Date(view.ended_at).getTime() <= now
    : new Date(view.end_at).getTime() + 30 * 60 * 1000 < now;

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

      <AttendanceTable view={view} params={params} onExclude={setExcluding} />

      <AttendanceQrDialog campaignId={campaignId} shiftId={shiftId} open={qrOpen} onOpenChange={setQrOpen} />

      <ReasonDialog
        open={Boolean(excluding)}
        onOpenChange={(open) => !open && setExcluding(null)}
        title={t('Exclude this attendance?')}
        description={t(
          '{{name}} will not get points for this shift. You can restore it later. A reason is required.',
          { name: excluding?.volunteer?.name || t('Unnamed volunteer') },
        )}
        confirmLabel={t('Exclude')}
        placeholder={t('Reason (e.g. was not at the meeting point)')}
        pending={isExcluding}
        onConfirm={(reason) => excluding && exclude({ ...params, user_id: excluding.user_id, reason })}
      />

      <ReasonDialog
        open={manualOpen}
        onOpenChange={setManualOpen}
        title={t('Add attendance manually')}
        description={t(
          'For someone whose phone failed. A reason is required; at most 20% of the people present may be added by hand.',
        )}
        confirmLabel={t('Add')}
        placeholder={t('Reason (e.g. phone out of battery)')}
        // A volunteer must be picked too.
        pending={!manualUser || isAdding}
        onConfirm={(reason) => manualUser && addManual({ ...params, user_id: manualUser, reason })}
      >
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
      </ReasonDialog>
    </div>
  );
});
