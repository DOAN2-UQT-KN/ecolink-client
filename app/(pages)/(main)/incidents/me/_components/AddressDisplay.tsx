"use client";

import { memo } from "react";
import { useReverseGeocode } from "../_hooks/useReverseGeocode";

interface AddressDisplayProps {
  latitude: number | null;
  longitude: number | null;
  address?: string;
}

const AddressDisplay = memo(function AddressDisplay({
  latitude,
  longitude,
  address: providedAddress,
}: AddressDisplayProps) {
  const { address: geocodedAddress, isLoading } = useReverseGeocode(
    providedAddress ? null : latitude,
    providedAddress ? null : longitude,
  );

  const displayAddress = providedAddress || geocodedAddress;

  if (!providedAddress && (!latitude || !longitude)) return null;

  return (
    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/80 min-w-0 max-w-full">
      <span
        className="truncate"
        title={displayAddress || "Loading location..."}
      >
        {providedAddress
          ? providedAddress
          : isLoading
          ? "Loading..."
          : displayAddress || "Locating..."}
      </span>
    </div>
  );
});

export default AddressDisplay;
