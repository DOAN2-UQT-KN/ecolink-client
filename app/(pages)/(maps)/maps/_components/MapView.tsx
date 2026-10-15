import { memo, useEffect, useMemo, useState } from 'react';
import MapGL, { Marker, NavigationControl, Popup } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useTranslation } from 'react-i18next';
import type { MapMarker } from './MapPage';
import { Pill } from '@/components/ui/Pill';
import type { SosType } from '@/apis/sos/models/sos';
import { SOS_TYPE_META } from '@/constants/sos';
import { SosTypeBadge } from '@/components/sos/SosTypeBadge';
import { GOONG_STYLE_URL } from '@/libs/goong';
import { MapUnavailable } from '@/modules/AddressMap';

// Vietnam geographic center
const DEFAULT_CENTER = { latitude: 16.047, longitude: 108.206 };
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

// ─── custom SVG pin icons (static internal markup, no user data) ───────────────
type PinIcon = { html: string; popupOffset: number };

function buildPinIcon(fill: string): PinIcon {
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

  return { html: svg, popupOffset: 46 };
}

/** One pin per SOS type, in the type's colour token, with a pulsing ring. */
function buildSOSIcon(type: SosType): PinIcon {
  const color = SOS_TYPE_META[type].color;
  const glyph = type === 'medical' ? '+' : type === 'hazard' ? '!' : '?';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 44" width="32" height="44">
      <path
        d="M16 0C7.163 0 0 7.163 0 16c0 11.25 14 28 16 28s16-16.75 16-28C32 7.163 24.837 0 16 0z"
        style="fill:${color}"
      />
      <circle cx="16" cy="16" r="8" fill="white" opacity="0.95"/>
      <text x="16" y="${type === 'medical' ? 21 : 20}" text-anchor="middle" font-size="${type === 'medical' ? 15 : 11}" font-weight="bold" style="fill:${color}">${glyph}</text>
    </svg>`.trim();

  const html = `
    <div style="position:relative;width:48px;height:48px;display:flex;align-items:center;justify-content:flex-end;flex-direction:column;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.35));">
      <div class="sos-ring" style="width:44px;height:44px;background:${color};opacity:0.35;"></div>
      ${type === 'medical' ? `<div class="sos-ring sos-ring-delay" style="width:44px;height:44px;background:${color};opacity:0.35;"></div>` : ''}
      <div style="position:relative;z-index:1;">${svg}</div>
    </div>
  `.trim();

  return { html, popupOffset: 62 };
}

/** Medical always on top, then hazard, then manpower, then the other layers. */
const SOS_Z_INDEX: Record<SosType, number> = { medical: 3000, hazard: 2000, manpower: 1000 };

// ─── marker list (memoised) ────────────────────────────────────────────────────
const MarkerList = memo(function MarkerList({ markers }: { markers: MapMarker[] }) {
  const { t } = useTranslation();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const icons = useMemo(
    () => ({
      CAMPAIGN: buildPinIcon('#2563eb'),
      INCIDENT: buildPinIcon('#eab308'),
      SOS_manpower: buildSOSIcon('manpower'),
      SOS_hazard: buildSOSIcon('hazard'),
      SOS_medical: buildSOSIcon('medical'),
    }),
    [],
  );

  const iconOf = (m: MapMarker) =>
    m.type === 'SOS' ? icons[`SOS_${m.sosType ?? 'manpower'}`] : icons[m.type];
  const selected = markers.find((m) => `${m.type}-${m.id}` === selectedKey);

  return (
    <>
      {markers.map((m) => (
        <Marker
          key={`${m.type}-${m.id}`}
          latitude={m.lat}
          longitude={m.lng}
          anchor="bottom"
          style={{ zIndex: m.type === 'SOS' ? SOS_Z_INDEX[m.sosType ?? 'manpower'] : 0 }}
          onClick={(e) => {
            e.originalEvent.stopPropagation();
            setSelectedKey(`${m.type}-${m.id}`);
          }}
        >
          <div className="cursor-pointer" dangerouslySetInnerHTML={{ __html: iconOf(m).html }} />
        </Marker>
      ))}

      {selected && (
        <Popup
          latitude={selected.lat}
          longitude={selected.lng}
          anchor="bottom"
          offset={iconOf(selected).popupOffset}
          maxWidth="280px"
          className="map-popup"
          onClose={() => setSelectedKey(null)}
        >
          <div className="min-w-[200px]">
            {selected.type === 'SOS' ? (
              // Public map: type and a link only, no reporter or medical details.
              <div className="py-1 space-y-2">
                <SosTypeBadge type={selected.sosType ?? 'manpower'} />
                <div className="flex justify-end">
                  <a href={`/sos/${selected.id}`} className="text-xs text-blue-700 underline text-right">
                    {t('View details')}
                  </a>
                </div>
              </div>
            ) : (
            <div className="py-1 space-y-1.5">
              {/* Badge */}
              <Pill tone={selected.type === 'CAMPAIGN' ? 'blue' : 'amber'}>
                {selected.type === 'CAMPAIGN' ? t('Campaign') : t('Incident')}
              </Pill>

              <p className="font-semibold text-gray-900 text-sm leading-snug">{selected.title}</p>

              {selected.wasteType && <p className="text-xs text-gray-500 capitalize">{selected.wasteType}</p>}

              {selected.address && (
                <p className="text-xs text-gray-400 leading-snug line-clamp-2">📍 {selected.address}</p>
              )}

              {selected.type == 'CAMPAIGN' && (
                <div className="flex justify-end">
                  <a
                    href={`/campaigns/${selected.id}`}
                    className="text-xs text-blue-700 underline text-right"
                    target="_blank"
                  >
                    {t('View more')}
                  </a>
                </div>
              )}
            </div>
            )}
          </div>
        </Popup>
      )}
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

      {GOONG_STYLE_URL ? (
        <MapGL
          mapStyle={GOONG_STYLE_URL}
          initialViewState={{ ...DEFAULT_CENTER, zoom: DEFAULT_ZOOM }}
          style={{ width: '100%', height: '100%' }}
        >
          <NavigationControl showCompass={false} />
          <MarkerList markers={markers} />
        </MapGL>
      ) : (
        <MapUnavailable />
      )}
    </div>
  );
});

export default MapView;
