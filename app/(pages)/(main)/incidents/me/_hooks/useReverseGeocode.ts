import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getAddressFromLatLng, type ReverseGeocodingAddress } from "@/libs/geocoding";

export const useReverseGeocode = (
  latitude: number | null,
  longitude: number | null,
) => {
  const { t } = useTranslation();
  const { data, isLoading, error } = useQuery<ReverseGeocodingAddress>({
    queryKey: ["reverse-geocode", latitude, longitude],
    queryFn: () =>
      latitude === null || longitude === null
        ? Promise.resolve({})
        : getAddressFromLatLng(latitude, longitude),
    enabled: latitude !== null && longitude !== null,
    staleTime: 1000 * 60 * 60, // 1 hour cache
    gcTime: 1000 * 60 * 60 * 24, // Keep in garbage collection for 24 hours
    retry: 1,
  });

  const address = data
    ? data.detailAddress || t("Unknown Location")
    : isLoading
      ? t("Fetching address...")
      : null;

  return {
    address: error ? t("Location Unavailable") : address,
    isLoading,
  };
};
