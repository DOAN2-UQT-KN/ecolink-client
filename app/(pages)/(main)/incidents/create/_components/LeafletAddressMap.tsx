"use client";

import { memo, useEffect, useState } from "react";
import type { LatLngLiteral } from "leaflet";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER: LatLngLiteral = { lat: 10.7769, lng: 106.7009 };
const DEFAULT_ZOOM = 13;

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
      <LocationMarker setPosition={setPosition} />
      {position && (
        <Marker position={position}>
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
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);

  if (!isMounted || typeof window === "undefined") return null;

  return (
    <MapContainer
      center={position ?? DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      className="h-full w-full"
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
