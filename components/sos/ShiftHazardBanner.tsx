import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TbBiohazard } from 'react-icons/tb';

import { useSosList } from '@/apis/sos/getSos';
import { SOS_OPEN_STATES_PARAM } from '@/constants/sos';
import { haversineMeters } from '@/libs/geo';
import { Link } from '@/libs/router';

/**
 * Spec "An toàn": a shift whose meeting point has an open hazardous-waste SOS warns everyone on it.
 * Matches by `meeting_point_id` when the list sends it, otherwise by distance to the point.
 */
export function ShiftHazardBanner({
  campaignId,
  meetingPoint,
}: {
  campaignId: string;
  meetingPoint: { id?: string; latitude: number; longitude: number; radius_km?: number | null };
}) {
  const { t } = useTranslation();
  const { data } = useSosList(
    { campaign_id: campaignId, states: SOS_OPEN_STATES_PARAM, limit: 100 },
    { enabled: Boolean(campaignId), refetchInterval: 30_000 },
  );

  const hazards = useMemo(() => {
    const items = data?.data?.items ?? [];
    const reach = Math.max(500, (meetingPoint.radius_km ?? 0) * 1000);
    return items.filter((s) => {
      if (s.type !== 'hazard') return false;
      if (s.meeting_point_id && meetingPoint.id) return s.meeting_point_id === meetingPoint.id;
      return (
        haversineMeters(
          { lat: s.latitude, lng: s.longitude },
          { lat: meetingPoint.latitude, lng: meetingPoint.longitude },
        ) <= reach
      );
    });
  }, [data?.data?.items, meetingPoint]);

  if (hazards.length === 0) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl border-2 border-sos-hazard/40 bg-sos-hazard/10 px-4 py-3 text-sm"
    >
      <TbBiohazard className="mt-0.5 size-6 shrink-0 text-sos-hazard" aria-hidden />
      <div className="flex flex-col gap-1">
        <p className="font-semibold text-sos-hazard">
          {t('Hazardous waste reported at this meeting point')}
        </p>
        <p className="text-foreground-secondary">
          {t('Do not touch it, keep your distance and wait for the authorities.')}
        </p>
        <ul className="flex flex-wrap gap-x-3">
          {hazards.map((s) => (
            <li key={s.id}>
              <Link href={`/sos/${s.id}`} className="text-button-accent underline">
                {t('View SOS #{{id}}', { id: s.id })}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default ShiftHazardBanner;
