"use client";

import { memo, useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MapMarker } from "./MapPage";

// Vietnam geographic center
const DEFAULT_CENTER: [number, number] = [16.047, 108.206];
const DEFAULT_ZOOM = 6;

// ─── custom SVG pin icons ──────────────────────────────────────────────────────
function buildPinIcon(fill: string): L.DivIcon {
  // Drop-pin shape via SVG; white inner circle for contrast
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 44" width="32" height="44">
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.35)"/>
      </filter>
      <path
        d="M16 0C7.163 0 0 7.163 0 16c0 11.25 14 28 16 28s16-16.75 16-28C32 7.163 24.837 0 16 0z"
        fill="${fill}"
        filter="url(#shadow)"
      />
      <circle cx="16" cy="16" r="7" fill="white" opacity="0.95"/>
    </svg>`.trim();

  return L.divIcon({
    className: "",
    html: svg,
    iconSize: [32, 44],
    iconAnchor: [16, 44],
    popupAnchor: [0, -46],
  });
}

// ─── marker list (memoised) ────────────────────────────────────────────────────
const MarkerList = memo(function MarkerList({
  markers,
}: {
  markers: MapMarker[];
}) {
  const icons = useMemo(
    () => ({
      CAMPAIGN: buildPinIcon("#2563eb"),
      INCIDENT: buildPinIcon("#dc2626"),
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
        >
          <Popup minWidth={180} maxWidth={260} className="map-popup">
            <div className="py-1">
              <span
                className={`inline-block text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full mb-2 ${
                  m.type === "CAMPAIGN"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {m.type === "CAMPAIGN" ? "Campaign" : "Incident"}
              </span>
              <p className="font-semibold text-gray-900 text-sm leading-snug">
                {m.title}
              </p>
              {m.wasteType && (
                <p className="text-xs text-gray-500 mt-0.5 capitalize">
                  {m.wasteType}
                </p>
              )}
              {m.address && (
                <p className="text-xs text-gray-400 mt-1 leading-snug line-clamp-2">
                  {m.address}
                </p>
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
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg text-sm text-gray-600 pointer-events-none select-none">
      <span className="h-3 w-3 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      Refreshing…
    </div>
  );
});

// ─── empty state overlay ───────────────────────────────────────────────────────
const EmptyState = memo(function EmptyState() {
  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[999] bg-white/90 backdrop-blur-sm px-5 py-3 rounded-2xl shadow-lg text-sm text-gray-500 pointer-events-none select-none">
      No markers match the current filters.
    </div>
  );
});

// ─── map view ──────────────────────────────────────────────────────────────────
interface MapViewProps {
  markers: MapMarker[];
  loading: boolean;
}

const MapView = memo(function MapView({ markers, loading }: MapViewProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

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
