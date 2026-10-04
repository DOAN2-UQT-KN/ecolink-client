import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Inbox } from 'lucide-react';

import { useGetCampaignRegistrations, useInviteNearby } from '@/apis/campaign/registration';
import { Button } from '@/components/client/shared/Button';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import showMessage, { MessageLevel, MessageType } from '@/utils/showMessage';
import { TbSpeakerphone } from 'react-icons/tb';
import type { IShiftRegistrations } from '@/apis/campaign/models/registration';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Pill } from '@/components/ui/Pill';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from '@/libs/router';

import { useCampaignDetail } from '../_hooks/useCampaignDetail';
import useAuthStore from '@/stores/useAuthStore';
import { ADMIN_ROLE_ID } from '@/constants/roles';
import { AvatarList } from './AvatarList';
import { CloseShiftButton } from './CloseShiftButton';
import { ShiftFillBar } from './ShiftFillBar';


const hhmm = (iso: string) => format(new Date(iso), 'HH:mm');

/**
 * Managers: who registered for each shift, by day (spec 3.1), to read only: it shows whether a
 * shift will have enough people. Managers can re-invite nearby residents and turn a shift off
 * (3.2), but never remove or move a volunteer.
 */
export const CampaignRegistrations = memo(function CampaignRegistrations({
  enabled,
}: {
  enabled: boolean;
}) {
  const { t } = useTranslation();
  const { campaignId, campaign, canManageCampaign, isRegistered } = useCampaignDetail();
  const isPlatformAdmin = useAuthStore((s) => s.user?.roleId === ADMIN_ROLE_ID);
  // Who registered is only for the team, registered volunteers and admins (spec 4.5); everyone
  // else sees the shifts with their numbers, to open a shift.
  const canViewVolunteers = canManageCampaign || isRegistered || isPlatformAdmin;
  // Shifts that lost their leader (spec 3.4) need one before attendance opens.
  const leaderless = useMemo(
    () =>
      new Set(
        (campaign?.shifts ?? [])
          .filter((s) => s.min_volunteers > 0 && !s.leader_user_id)
          .map((s) => s.id),
      ),
    [campaign?.shifts],
  );
  const { data: fetched, isLoading, isError } = useGetCampaignRegistrations(campaignId, {
    enabled: enabled && Boolean(campaignId) && canViewVolunteers,
  });
  const data = useMemo(() => {
    if (canViewVolunteers) return fetched;
    const points = campaign?.meeting_points ?? [];
    const shifts: IShiftRegistrations[] = (campaign?.shifts ?? [])
      .filter((s) => s.min_volunteers > 0)
      .sort(
        (a, b) =>
          new Date(a.start_at).getTime() - new Date(b.start_at).getTime() ||
          points.findIndex((p) => p.id === a.meeting_point_id) -
            points.findIndex((p) => p.id === b.meeting_point_id),
      )
      .map((s) => ({
        shift_id: s.id,
        day_id: s.day_id,
        meeting_point_id: s.meeting_point_id,
        meeting_point_name: points.find((p) => p.id === s.meeting_point_id)?.name ?? null,
        start_at: s.start_at,
        end_at: s.end_at,
        min_volunteers: s.min_volunteers,
        max_volunteers: s.max_volunteers,
        registered_count: s.registered_count ?? 0,
        volunteers: [],
      }));
    return { data: { shifts, next_invite_at: null } };
  }, [canViewVolunteers, fetched, campaign?.shifts, campaign?.meeting_points]);

  const pointName = (shift: IShiftRegistrations) => {
    const index = (campaign?.meeting_points ?? []).findIndex((p) => p.id === shift.meeting_point_id);
    return shift.meeting_point_name || t('Meeting point {{n}}', { n: index + 1 });
  };

  const days = useMemo(() => {
    const shifts = data?.data?.shifts ?? [];
    return (campaign?.days ?? [])
      .map((day, index) => ({
        day,
        index,
        shifts: shifts.filter((s) => s.day_id === day.id),
      }))
      .filter((d) => d.shifts.length > 0);
  }, [campaign?.days, data]);

  const shifts = data?.data?.shifts ?? [];
  const nextInviteAt = data?.data?.next_invite_at ? new Date(data.data.next_invite_at) : null;
  const now = Date.now();
  const anyShort = canManageCampaign && shifts.some(
    (s) => new Date(s.start_at).getTime() > now && s.registered_count < s.min_volunteers,
  );
  /** Running shifts per day; the last one of a day cannot be turned off. */
  const runningPerDay = shifts.reduce<Record<string, number>>((acc, s) => {
    if (s.min_volunteers > 0) acc[s.day_id] = (acc[s.day_id] ?? 0) + 1;
    return acc;
  }, {});

  const { mutate: invite, isPending: isInviting } = useInviteNearby({
    onSuccess: (response) =>
      showMessage({
        type: MessageType.Toast,
        level: MessageLevel.Success,
        title: t('Invited {{n}} nearby resident(s)', { n: response.data.invited }),
      }),
  });

  return (
    <div className="rounded-xl border border-[rgba(136,122,71,0.35)] bg-white/60 p-4 sm:p-5 shadow-sm">
      {canViewVolunteers && isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
        </div>
      ) : canViewVolunteers && isError ? (
        <p className="text-sm text-destructive">{t('Could not load registrations.')}</p>
      ) : shifts.length === 0 ? (
        <div className="flex justify-center pt-12 pb-20">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Inbox className="h-12 w-12 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle>{t('No registrations yet.')}</EmptyTitle>
              <EmptyDescription>
                {t('Volunteers who register for a shift appear here right away.')}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="flex items-center gap-1 text-sm text-foreground-tertiary">
              {canViewVolunteers ? (
                <>
                  {t('Who registered for each shift')}
                  <InfoTooltip
                    content={t(
                      'Read only: registering just keeps volunteers informed and helps you estimate numbers. Volunteers pick and leave shifts themselves.',
                    )}
                  />
                </>
              ) : (
                t('Shifts and how many have registered; open a shift for its details.')
              )}
            </span>
            {anyShort && (
              <div className="flex items-center gap-2">
                {nextInviteAt && (
                  <span className="text-xs text-foreground-tertiary">
                    {t('You can invite again at {{time}}', { time: format(nextInviteAt, 'HH:mm, dd/MM') })}
                  </span>
                )}
                <Button
                  type="button"
                  variant="brown"
                  iconLeft={<TbSpeakerphone className="size-4" aria-hidden />}
                  isLoading={isInviting}
                  isDisabled={Boolean(nextInviteAt)}
                  onClick={() => invite({ campaign_id: campaignId })}
                >
                  {t('Invite nearby residents')}
                </Button>
                <InfoTooltip
                  content={t(
                    'Notifies people within 5 km of the meeting points that this campaign still needs volunteers. Once every 24 hours.',
                  )}
                />
              </div>
            )}
          </div>
          {days.map(({ day, index, shifts }) => (
            <section key={day.id} className="flex flex-col gap-3">
              <h3 className="font-display-3 font-semibold text-button-accent">
                {t('Day {{n}}', { n: index + 1 })} · {format(new Date(day.start_at), 'EEEE, PP')}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {shifts.map((shift) => {
                  const canClose =
                    canManageCampaign &&
                    new Date(shift.start_at).getTime() > now &&
                    shift.min_volunteers > 0 &&
                    (runningPerDay[shift.day_id] ?? 0) > 1;
                  return (
                    <div
                      key={shift.shift_id}
                      className="flex flex-col gap-2 rounded-lg border border-[rgba(136,122,71,0.3)] bg-white/70 p-4 text-sm"
                    >
                      <div className="flex flex-col">
                        <Link
                          href={`/campaigns/${campaignId}/shifts/${shift.shift_id}`}
                          className="font-semibold hover:underline"
                        >
                          {pointName(shift)}
                        </Link>
                        <span className="text-xs text-foreground-tertiary tabular-nums">
                          {hhmm(shift.start_at)} – {hhmm(shift.end_at)}
                        </span>
                      </div>
                      {canManageCampaign &&
                        leaderless.has(shift.shift_id) &&
                        new Date(shift.end_at).getTime() > now && (
                          <Link
                            href={`/campaigns/${campaignId}/shifts/${shift.shift_id}`}
                            className="self-start"
                          >
                            <Pill tone="red">{t('Needs a person in charge')}</Pill>
                          </Link>
                        )}
                      <ShiftFillBar
                        registered={shift.registered_count}
                        min={shift.min_volunteers}
                        max={shift.max_volunteers}
                      />
                      {!canViewVolunteers ? null : shift.volunteers.length === 0 ? (
                        <p className="text-xs text-foreground-tertiary">
                          {t('Nobody has registered yet')}
                        </p>
                      ) : (
                        <AvatarList
                          isLoading={false}
                          items={shift.volunteers.map((v) => ({
                            id: v.user_id,
                            avatar: v.volunteer?.avatar,
                            name: v.volunteer?.name || t('Unnamed volunteer'),
                          }))}
                          renderBadge={(item) => {
                            const v = shift.volunteers.find((x) => x.user_id === item.id);
                            return v ? (
                              <span className="text-xs text-foreground-tertiary">
                                {format(new Date(v.registered_at), 'PPp')}
                              </span>
                            ) : null;
                          }}
                        />
                      )}
                      {canClose && (
                        <div className="mt-auto flex justify-end pt-1">
                          <CloseShiftButton
                            campaignId={campaignId}
                            shiftId={shift.shift_id}
                            registered={shift.registered_count}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
});

export default CampaignRegistrations;
