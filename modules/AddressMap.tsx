import { memo, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import MapGL, {
  Marker,
  NavigationControl,
  Popup,
  type MapLayerMouseEvent,
  type MapRef,
} from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { GOONG_STYLE_URL } from '@/libs/goong';
import type { LatLng } from '@/libs/geocoding';

const DEFAULT_CENTER: LatLng = { lat: 10.7769, lng: 106.7009 };
const DEFAULT_ZOOM = 13;

const PIN_SVG = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 32 44"
    width="32"
    height="44"
    aria-hidden="true"
  >
    <filter id="shadow-pin" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="rgba(0,0,0,0.35)" />
    </filter>
    <path
      d="M16 0C7.163 0 0 7.163 0 16c0 11.25 14 28 16 28s16-16.75 16-28C32 7.163 24.837 0 16 0z"
      fill="#2563eb"
      filter="url(#shadow-pin)"
    />
    <circle cx="16" cy="16" r="7" fill="white" opacity="0.95" />
  </svg>
);

export const MapUnavailable = memo(function MapUnavailable() {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      className="flex h-full w-full items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500"
    >
      {t('Map unavailable')}
    </div>
  );
});

type AddressMapProps = {
  position: LatLng | null;
  setPosition: (position: LatLng) => void;
  popupText: string;
};

const AddressMap = memo(function AddressMap({ position, setPosition, popupText }: AddressMapProps) {
  const mapRef = useRef<MapRef>(null);
  const loadedRef = useRef(false);
  const [failed, setFailed] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const lat = position?.lat;
  const lng = position?.lng;

  // Recenters the map when `position` is set or changes (address search, GPS).
  useEffect(() => {
    const map = mapRef.current;
    if (lat == null || lng == null || !map) return;
    map.flyTo({ center: [lng, lat], zoom: Math.max(map.getZoom(), 14), duration: 600 });
  }, [lat, lng]);

  if (!GOONG_STYLE_URL || failed) return <MapUnavailable />;

  const center = position ?? DEFAULT_CENTER;

  return (
    <MapGL
      ref={mapRef}
      mapStyle={GOONG_STYLE_URL}
      initialViewState={{ latitude: center.lat, longitude: center.lng, zoom: DEFAULT_ZOOM }}
      style={{ width: '100%', height: '100%' }}
      onClick={(e: MapLayerMouseEvent) => setPosition({ lat: e.lngLat.lat, lng: e.lngLat.lng })}
      onLoad={() => {
        loadedRef.current = true;
      }}
      // A style that never loads (bad key, quota) leaves a blank box; tile errors after load are ignored.
      onError={() => {
        if (!loadedRef.current) setFailed(true);
      }}
    >
      <NavigationControl showCompass={false} />
      {position && (
        <>
          <Marker
            latitude={position.lat}
            longitude={position.lng}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setPopupOpen((open) => !open);
            }}
          >
            {PIN_SVG}
          </Marker>
          {popupOpen && (
            <Popup
              latitude={position.lat}
              longitude={position.lng}
              anchor="bottom"
              offset={46}
              closeOnClick={false}
              onClose={() => setPopupOpen(false)}
            >
              {popupText}
            </Popup>
          )}
        </>
      )}
    </MapGL>
  );
});

export default AddressMap;
