"use client";

import { memo } from "react";
import { useReverseGeocode } from "../_hooks/useReverseGeocode";

interface AddressDisplayProps {
  latitude: number | null;
  longitude: number | null;
}

const AddressDisplay = memo(function AddressDisplay({
  latitude,
  longitude,
}: AddressDisplayProps) {
  const { address, isLoading } = useReverseGeocode(latitude, longitude);

  if (!latitude || !longitude) return null;

  return (
    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/80 min-w-0 max-w-full">
      <span className="truncate" title={address || "Loading location..."}>
        {isLoading ? "Loading..." : address || "Locating..."}
      </span>
    </div>
  );
});

export default AddressDisplay;
