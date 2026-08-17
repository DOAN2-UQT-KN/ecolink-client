import { memo, useEffect, useMemo, useState } from "react";
import type { LatLngLiteral } from "leaflet";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER: LatLngLiteral = { lat: 10.7769, lng: 106.7009 };
const DEFAULT_ZOOM = 13;

/** Inline SVG pin — Leaflet's default PNG paths break under Next.js bundling. */
function buildPinIcon(): L.DivIcon {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 44" width="32" height="44">
      <filter id="shadow-pin" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.35)"/>
      </filter>
      <path
        d="M16 0C7.163 0 0 7.163 0 16c0 11.25 14 28 16 28s16-16.75 16-28C32 7.163 24.837 0 16 0z"
        fill="#2563eb"
        filter="url(#shadow-pin)"
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

type LeafletAddressMapProps = {
  position: LatLngLiteral | null;
  setPosition: (position: LatLngLiteral) => void;
  popupText: string;
};

const LocationMarker = memo(function LocationMarker({ setPosition }: Pick<LeafletAddressMapProps, "setPosition">) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return null;
});

/** Recenters the map when `position` is set or changes (e.g. GPS). */
const FlyToPosition = memo(function FlyToPosition({ position }: { position: LatLngLiteral | null }) {
  const map = useMap();
  const lat = position?.lat;
  const lng = position?.lng;
  useEffect(() => {
    if (lat == null || lng == null) return;
    const z = map.getZoom();
    map.flyTo({ lat, lng }, z < 14 ? 14 : z, { duration: 0.6 });
  }, [map, lat, lng]);
  return null;
});

const MapContent = memo(function MapContent({
  position,
  setPosition,
  popupText,
}: {
  position: LatLngLiteral | null;
  setPosition: (position: LatLngLiteral) => void;
  popupText: string;
}) {
  const map = useMap();
  const [ready, setReady] = useState(false);
  const pinIcon = useMemo(() => buildPinIcon(), []);

  useEffect(() => {
    if (map) {
      setReady(true);
    }
  }, [map]);

  if (!ready) return null;

  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FlyToPosition position={position} />
      <LocationMarker setPosition={setPosition} />
      {position && (
        <Marker position={position} icon={pinIcon}>
          <Popup>{popupText}</Popup>
        </Marker>
      )}
    </>
  );
});

const LeafletAddressMap = memo(function LeafletAddressMap({
  position,
  setPosition,
  popupText,
}: LeafletAddressMapProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || typeof window === "undefined") return null;

  return (
    <MapContainer
      center={position ?? DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      className="relative z-0 h-full w-full"
    >
      <MapContent
        position={position}
        setPosition={setPosition}
        popupText={popupText}
      />
    </MapContainer>
  );
});

export default LeafletAddressMap;
