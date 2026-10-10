import { useTranslation } from 'react-i18next';
import { TbArrowBackUp, TbUserX } from 'react-icons/tb';

import { useRestoreAttendance } from '@/apis/campaign/restoreAttendance';
import type { IShiftAttendanceRow, IShiftAttendanceView } from '@/apis/campaign/models/attendance';
import type { ShiftParams } from '@/apis/campaign/models/lifecycle';
import { Button } from '@/components/client/shared/Button';
import { Pill } from '@/components/ui/Pill';
import { hhmm } from '@/utils/campaignLabels';

/** Who checked in to the shift, with their flags; leaders can exclude or restore a row. */
export function AttendanceTable({
  view,
  params,
  onExclude,
}: {
  view: IShiftAttendanceView;
  params: ShiftParams;
  onExclude: (row: IShiftAttendanceRow) => void;
}) {
  const { t } = useTranslation('common');
  const { mutate: restore, isPending: isRestoring } = useRestoreAttendance();

  return view.attendances.length === 0 ? (
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
              <td className="py-2 pr-3 tabular-nums">{hhmm(a.check_in_at, '—')}</td>
              <td className="py-2 pr-3 tabular-nums">{hhmm(a.check_out_at, '—')}</td>
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
                      onClick={() => onExclude(a)}
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
  );
}
