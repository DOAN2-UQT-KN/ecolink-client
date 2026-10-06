import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { updateResponderLocation } from '@/apis/sos/respondSos';
import { hasGeolocation, type GeoPoint } from '@/libs/geo';

const SEND_EVERY_MS = 30_000;

/**
 * While the viewer is on the way to an SOS, watch their GPS and send it at most every 30 s so
 * the server can switch them to "arrived" within 50 m. `onPosition` gets every fix (distance/ETA).
 */
export function useResponderTracking(
  sosId: number,
  active: boolean,
  onPosition: (p: GeoPoint) => void,
) {
  const queryClient = useQueryClient();
  const onPositionRef = useRef(onPosition);
  useEffect(() => {
    onPositionRef.current = onPosition;
  }, [onPosition]);

  useEffect(() => {
    if (!active || !hasGeolocation()) return;
    let lastSent = 0;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const point = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        onPositionRef.current(point);
        const now = Date.now();
        if (now - lastSent < SEND_EVERY_MS) return;
        lastSent = now;
        updateResponderLocation({ id: sosId, latitude: point.lat, longitude: point.lng })
          .then((res) => queryClient.setQueryData(['sos-detail', sosId], res))
          .catch(() => {
            // Retried on the next fix.
            lastSent = 0;
          });
      },
      () => {
        // No GPS: the responder can still be counted as on the way.
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 30_000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [active, sosId, queryClient]);
}
