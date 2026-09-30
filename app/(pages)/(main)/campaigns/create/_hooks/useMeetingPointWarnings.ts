import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import {
  CAMPAIGN_MEETING_POINT_MAX_DISTANCE_KM,
  haversineKm,
} from '@/constants/campaignLifecycle';
import { useCampaign } from './useCampaign';

/** Client-side hint for meeting points too far apart to share a campaign. */
export function useMeetingPointWarnings(): string[] {
  const { t } = useTranslation();
  const { form } = useCampaign();
  const points = form.watch('meeting_points');

  return useMemo(() => {
    const out: string[] = [];
    const located = points
      .map((p, i) => ({ p, i }))
      .filter(({ p }) => p.latitude != null && p.longitude != null);
    for (let a = 0; a < located.length; a++) {
      for (let b = a + 1; b < located.length; b++) {
        const km = haversineKm(
          { latitude: located[a].p.latitude!, longitude: located[a].p.longitude! },
          { latitude: located[b].p.latitude!, longitude: located[b].p.longitude! },
        );
        if (km > CAMPAIGN_MEETING_POINT_MAX_DISTANCE_KM) {
          out.push(
            t('Points {{a}} and {{b}} are {{km}} km apart (max {{max}} km). Split them into separate campaigns.', {
              a: located[a].i + 1,
              b: located[b].i + 1,
              km: km.toFixed(1),
              max: CAMPAIGN_MEETING_POINT_MAX_DISTANCE_KM,
            }),
          );
        }
      }
    }
    return out;
  }, [points, t]);
}
