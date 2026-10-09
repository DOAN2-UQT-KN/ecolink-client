import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

import type { ICampaignShift } from '@/apis/campaign/models/lifecycle';
import type { IShiftRegistrations } from '@/apis/campaign/models/registration';
import { AvatarList } from '@/components/client/shared/AvatarList';
import { cn } from '@/libs/utils';
import { ShiftAttendancePanel } from '../../../_components/ShiftAttendancePanel';
import { ShiftFillBar } from '../../../_components/ShiftFillBar';
import { useCampaignDetail } from '../../../_hooks/useCampaignDetail';
import { cardClass } from './ShiftInfoTab';

/** "Members & attendance" tab: the attendance panel for those running the shift, then who registered. */
export function ShiftMembersTab({
  shift,
  registrations,
  isLoading: isMembersLoading,
  canSeeAttendance,
}: {
  shift: ICampaignShift;
  registrations: IShiftRegistrations | undefined;
  isLoading: boolean;
  canSeeAttendance: boolean;
}) {
  const { t } = useTranslation('common');
  const { campaignId, canViewVolunteers } = useCampaignDetail();
  const started = new Date(shift.start_at).getTime() <= Date.now();

  return (
    <>
      {/* Attendance (spec 4.1): the leader, managers and admins, from an hour before the shift. */}
      {canSeeAttendance && (
        <ShiftAttendancePanel
          className={cardClass}
          campaignId={campaignId}
          shiftId={shift.id}
          registered={registrations?.volunteers ?? []}
        />
      )}
      <div className={cardClass}>
        {!canViewVolunteers ? (
          <p className="text-sm text-foreground-tertiary">
            {t('Only managers and registered volunteers can see the volunteer list.')}
          </p>
        ) : isMembersLoading ? (
          <AvatarList isLoading items={[]} />
        ) : !registrations || registrations.volunteers.length === 0 ? (
          <p className="text-sm text-foreground-tertiary">{t('Nobody has registered yet')}</p>
        ) : (
          <>
            <ShiftFillBar
              className="mb-4 max-w-sm"
              registered={registrations.registered_count}
              min={registrations.min_volunteers}
              max={registrations.max_volunteers}
            />
            <AvatarList
              isLoading={false}
              showAttendance={started}
              items={registrations.volunteers.map((v) => ({
                id: v.user_id,
                avatar: v.volunteer?.avatar,
                name: v.volunteer?.name,
                checkedIn: Boolean(v.checked_in_at),
              }))}
              renderBadge={(item) => {
                const v = registrations.volunteers.find((x) => x.user_id === item.id);
                if (!v) return null;
                return (
                  <div className={cn('flex flex-wrap items-center gap-1.5')}>
                    <span className="text-xs text-foreground-tertiary">
                      {t('Registered')} {format(new Date(v.registered_at), 'PPp')}
                    </span>
                  </div>
                );
              }}
            />
          </>
        )}
      </div>
    </>
  );
}
