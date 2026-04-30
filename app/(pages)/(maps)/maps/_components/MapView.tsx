'use client';

import { memo, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from 'react-i18next';
import type { MapMarker } from './MapPage';

// Vietnam geographic center
const DEFAULT_CENTER: [number, number] = [16.047, 108.206];
const DEFAULT_ZOOM = 6;

// ─── SOS pulse keyframe (injected once) ───────────────────────────────────────
const SOS_STYLE = `
  @keyframes sos-marker-pulse {
    0%   { transform: translate(-50%, -50%) scale(1);   opacity: 0.8; }
    70%  { transform: translate(-50%, -50%) scale(2.4); opacity: 0; }
    100% { transform: translate(-50%, -50%) scale(1);   opacity: 0; }
  }
  .sos-ring {
    position: absolute;
    top: 50%; left: 50%;
    width: 44px; height: 44px;
    border-radius: 50%;
    background: rgba(220, 38, 38, 0.35);
    animation: sos-marker-pulse 1.8s ease-out infinite;
    pointer-events: none;
  }
  .sos-ring-delay {
    animation-delay: 0.6s;
  }
`;

function injectSOSStyle() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('sos-marker-style')) return;
  const el = document.createElement('style');
  el.id = 'sos-marker-style';
  el.textContent = SOS_STYLE;
  document.head.appendChild(el);
}

// ─── custom SVG pin icons ──────────────────────────────────────────────────────
function buildPinIcon(fill: string): L.DivIcon {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 44" width="32" height="44">
      <filter id="shadow-${fill.replace('#', '')}" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.35)"/>
      </filter>
      <path
        d="M16 0C7.163 0 0 7.163 0 16c0 11.25 14 28 16 28s16-16.75 16-28C32 7.163 24.837 0 16 0z"
        fill="${fill}"
        filter="url(#shadow-${fill.replace('#', '')})"
      />
      <circle cx="16" cy="16" r="7" fill="white" opacity="0.95"/>
    </svg>`.trim();

  return L.divIcon({
    className: '',
    html: svg,
    iconSize: [32, 44],
    iconAnchor: [16, 44],
    popupAnchor: [0, -46],
  });
}

function buildSOSIcon(): L.DivIcon {
  // Red pin with two pulsing rings behind it
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 44" width="32" height="44">
      <filter id="shadow-sos" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="rgba(127,29,29,0.5)"/>
      </filter>
      <path
        d="M16 0C7.163 0 0 7.163 0 16c0 11.25 14 28 16 28s16-16.75 16-28C32 7.163 24.837 0 16 0z"
        fill="#dc2626"
        filter="url(#shadow-sos)"
      />
      <circle cx="16" cy="16" r="7" fill="white" opacity="0.95"/>
      <text x="16" y="20" text-anchor="middle" font-size="9" font-weight="bold" fill="#991b1b">!</text>
    </svg>`.trim();

  const html = `
    <div style="position:relative;width:48px;height:48px;display:flex;align-items:center;justify-content:flex-end;flex-direction:column;">
      <div class="sos-ring" style="width:44px;height:44px;"></div>
      <div class="sos-ring sos-ring-delay" style="width:44px;height:44px;"></div>
      <div style="position:relative;z-index:1;">${svg}</div>
    </div>
  `.trim();

  return L.divIcon({
    className: '',
    html,
    iconSize: [48, 60],
    iconAnchor: [24, 60],
    popupAnchor: [0, -62],
  });
}

// ─── marker list (memoised) ────────────────────────────────────────────────────
const MarkerList = memo(function MarkerList({ markers }: { markers: MapMarker[] }) {
  const { t } = useTranslation();

  const icons = useMemo(
    () => ({
      CAMPAIGN: buildPinIcon('#2563eb'),
      INCIDENT: buildPinIcon('#eab308'),
      SOS: buildSOSIcon(),
    }),
    [],
  );

  return (
    <>
      {markers.map((m) => (
        <Marker
          key={`${m.type}-${m.id}`}
          position={[m.lat, m.lng]}
          icon={icons[m.type]}
          zIndexOffset={m.type === 'SOS' ? 1000 : 0}
        >
          <Popup minWidth={200} maxWidth={280} className="map-popup">
            <div className="py-1 space-y-1.5">
              {/* Badge */}
              <span
                className={`inline-block text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full ${
                  m.type === 'CAMPAIGN'
                    ? 'bg-blue-100 text-blue-700'
                    : m.type === 'SOS'
                      ? 'bg-red-100 text-red-700 border border-red-300'
                      : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {m.type === 'CAMPAIGN'
                  ? t('Campaign')
                  : m.type === 'SOS'
                    ? `🚨 ${t('SOS')}`
                    : t('Incident')}
              </span>

              <p className="font-semibold text-gray-900 text-sm leading-snug">{m.title}</p>

              {/* SOS-specific fields */}
              {m.type === 'SOS' && m.content && (
                <p className="text-xs text-gray-700 leading-snug">{m.content}</p>
              )}
              {m.type === 'SOS' && m.phone && (
                <p className="text-xs text-gray-600 flex items-center gap-1">📞 {m.phone}</p>
              )}
              {/* {m.type === 'SOS' && (m.campaignTitle || m.campaignId || m.campaignAddress) && (
                <div className="rounded-md border border-blue-100 bg-blue-50 px-2 py-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-700">
                    {t('Campaign')}
                  </p>
                  {m.campaignTitle && (
                    <p className="text-xs font-medium text-blue-900">{m.campaignTitle}</p>
                  )}
                </div>
              )} */}

              {m.wasteType && <p className="text-xs text-gray-500 capitalize">{m.wasteType}</p>}

              {m.address && (
                <p className="text-xs text-gray-400 leading-snug line-clamp-2">📍 {m.address}</p>
              )}

              {(m.type == 'SOS' || m.type == 'CAMPAIGN') && (
                <div className="flex justify-end">
                  <a
                    href={`/campaigns/${m.campaignId ?? m.id}`}
                    className="text-xs text-blue-700 underline text-right"
                    target="_blank"
                  >
                    {t('View more')}
                  </a>
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
});

// ─── loading toast ─────────────────────────────────────────────────────────────
const LoadingToast = memo(function LoadingToast() {
  const { t } = useTranslation();
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg text-sm text-gray-600 pointer-events-none select-none">
      <span className="h-3 w-3 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      {t('Refreshing map…')}
    </div>
  );
});

// ─── empty state overlay ───────────────────────────────────────────────────────
const EmptyState = memo(function EmptyState() {
  const { t } = useTranslation();
  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[999] bg-white/90 backdrop-blur-sm px-5 py-3 rounded-2xl shadow-lg text-sm text-gray-500 pointer-events-none select-none">
      {t('No markers found on map.')}
    </div>
  );
});

// ─── map view ──────────────────────────────────────────────────────────────────
interface MapViewProps {
  markers: MapMarker[];
  loading: boolean;
}

const MapView = memo(function MapView({ markers, loading }: MapViewProps) {
  useEffect(() => {
    injectSOSStyle();
  }, []);

  return (
    <div className="relative h-full w-full">
      {loading && <LoadingToast />}
      {!loading && markers.length === 0 && <EmptyState />}

      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full z-0"
        zoomControl
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MarkerList markers={markers} />
      </MapContainer>
    </div>
  );
});

export default MapView;
