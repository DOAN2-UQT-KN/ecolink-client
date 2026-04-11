import { useQuery } from "@tanstack/react-query";

interface AddressParts {
  road?: string;
  suburb?: string;
  city_district?: string;
  district?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
}

interface GeocodeResponse {
  address?: AddressParts;
  display_name?: string;
  error?: string;
}

export const useReverseGeocode = (
  latitude: number | null,
  longitude: number | null,
) => {
  const { data, isLoading, error } = useQuery<GeocodeResponse>({
    queryKey: ["reverse-geocode", latitude, longitude],
    queryFn: async () => {
      if (latitude === null || longitude === null) return {};

      const response = await fetch(
        `/api/reverse-geocode?lat=${latitude}&lon=${longitude}`,
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch address");
      }

      return response.json();
    },
    enabled: latitude !== null && longitude !== null,
    staleTime: 1000 * 60 * 60, // 1 hour cache
    gcTime: 1000 * 60 * 60 * 24, // Keep in garbage collection for 24 hours
    retry: 1,
  });

  const formatAddress = (result: GeocodeResponse): string => {
    if (!result || result.error) return "Location Unavailable";
    
    const addr = result.address || {};
    const parts = [
      addr.road,
      addr.suburb || addr.city_district || addr.district,
      addr.city || addr.town || addr.village || addr.municipality,
    ].filter(Boolean);

    if (parts.length > 0) {
      return parts.join(", ");
    }

    return result.display_name?.split(",")[0] || "Unknown Location";
  };

  const address = data ? formatAddress(data) : (isLoading ? "Fetching address..." : null);

  return { 
    address: error ? "Location Unavailable" : address, 
    isLoading 
  };
};
