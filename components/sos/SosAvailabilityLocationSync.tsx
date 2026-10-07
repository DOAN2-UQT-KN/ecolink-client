import { useEffect } from 'react';

import { getMyAvailability, updateAvailabilityLocation } from '@/apis/sos/availability';
import { geolocationPermission, getCurrentPosition } from '@/libs/geo';
import { queryClient } from '@/libs/queryClient';
import useAuthStore from '@/stores/useAuthStore';

const STORAGE_KEY = 'ecolink:sos-availability-location-sent-at';
const MIN_INTERVAL_MS = 30 * 60_000;

function lastSentAt(): number {
  try {
    return Number(window.localStorage.getItem(STORAGE_KEY)) || 0;
  } catch {
    return 0;
  }
}

export function markAvailabilityLocationSent() {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    // Storage blocked: we simply send again next time.
  }
}

/**
 * "Sẵn sàng hỗ trợ SOS": when the volunteer has it on, refresh their approximate location when the
 * app opens, at most once every 30 minutes. Never prompts if the browser denied location.
 */
export function SosAvailabilityLocationSync() {
  const hydrated = useAuthStore((s) => s.has_hydrated);
  const isAuthenticated = useAuthStore((s) => s.is_authenticated);

  useEffect(() => {
    if (!hydrated || !isAuthenticated) return;
    if (Date.now() - lastSentAt() < MIN_INTERVAL_MS) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await queryClient.fetchQuery({
          queryKey: ['sos-availability'],
          queryFn: getMyAvailability,
        });
        if (cancelled || !res?.data?.enabled) return;
        if ((await geolocationPermission()) === 'denied') return;
        const p = await getCurrentPosition({ enableHighAccuracy: false, maximumAge: 10 * 60_000 });
        if (cancelled || !p) return;
        await updateAvailabilityLocation({ latitude: p.lat, longitude: p.lng });
        markAvailabilityLocationSent();
      } catch {
        // Best effort; retried on the next app open.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, isAuthenticated]);

  return null;
}

export default SosAvailabilityLocationSync;
