"use client";

import { useEffect } from "react";
import type { LatLngLiteral } from "leaflet";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER: LatLngLiteral = { lat: 10.7769, lng: 106.7009 };
const DEFAULT_ZOOM = 13;

type LeafletAddressMapProps = {
  position: LatLngLiteral | null;
  setPosition: (position: LatLngLiteral) => void;
  popupText: string;
};

function LocationMarker({ setPosition }: Pick<LeafletAddressMapProps, "setPosition">) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return null;
}

export default function LeafletAddressMap({
  position,
  setPosition,
  popupText,
}: LeafletAddressMapProps) {
  useEffect(() => {
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);

  return (
    <MapContainer center={position ?? DEFAULT_CENTER} zoom={DEFAULT_ZOOM} className="h-full w-full">
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
    </MapContainer>
  );
}
