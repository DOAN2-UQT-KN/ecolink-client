import { useCallback, useEffect, useState } from 'react';

import { geolocationPermission, getCurrentPosition, type GeoPoint } from '@/libs/geo';

export type GeoStatus = 'idle' | 'pending' | 'ready' | 'unavailable';

/**
 * The viewer's GPS position. With `requestOnMount` it asks right away (may prompt); otherwise it
 * only reads it silently when the browser already granted access, and `request()` asks on demand.
 */
export function useGeoPosition({ requestOnMount = false }: { requestOnMount?: boolean } = {}) {
  const [position, setPosition] = useState<GeoPoint | null>(null);
  const [status, setStatus] = useState<GeoStatus>('idle');

  const request = useCallback(async () => {
    setStatus('pending');
    const p = await getCurrentPosition();
    setPosition(p);
    setStatus(p ? 'ready' : 'unavailable');
    return p;
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (requestOnMount) {
        if (!cancelled) await request();
        return;
      }
      const permission = await geolocationPermission();
      if (!cancelled && permission === 'granted') await request();
    })();
    return () => {
      cancelled = true;
    };
  }, [requestOnMount, request]);

  return { position, status, request, setPosition };
}
