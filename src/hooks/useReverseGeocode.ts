import { useState, useCallback } from "react";
import { formatCoordinates } from "../lib/geo";

export interface ReverseGeocodeResult {
  address: string;
  addressKn: string;
  areaEn: string;
  areaKn: string;
}

// In-memory cache by lat,lng rounded to 4 decimals
const geocodeCache = new Map<string, ReverseGeocodeResult>();

function formatAddressParts(data: any, defaultCity: string): { address: string; area: string } {
  if (!data || !data.display_name) {
    return { address: "", area: "" };
  }
  const addr = data.address || {};
  const areaPart = addr.suburb || addr.neighbourhood || addr.residential || addr.amenity || addr.road || defaultCity;
  const parts = [
    addr.amenity || addr.building || addr.road || addr.pedestrian,
    addr.suburb || addr.neighbourhood || addr.residential,
    addr.city || addr.town || defaultCity,
  ].filter(Boolean);

  const formatted = parts.length > 0 ? parts.join(", ") : data.display_name;
  return {
    address: formatted,
    area: areaPart,
  };
}

export function useReverseGeocode() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reverseGeocode = useCallback(
    async (lat: number, lng: number): Promise<ReverseGeocodeResult> => {
      const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
      if (geocodeCache.has(cacheKey)) {
        return geocodeCache.get(cacheKey)!;
      }

      setLoading(true);
      setError(null);

      const fetchLang = async (langCode: "kn" | "en") => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000);

          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=${langCode}`,
            {
              signal: controller.signal,
              headers: {
                "Accept-Language": langCode,
              },
            }
          );
          clearTimeout(timeoutId);

          if (!response.ok) return null;
          return await response.json();
        } catch {
          return null;
        }
      };

      try {
        // Fetch both Kannada and English in parallel
        const [knData, enData] = await Promise.all([
          fetchLang("kn"),
          fetchLang("en"),
        ]);

        const enResult = formatAddressParts(enData, "Bengaluru");
        const knResult = formatAddressParts(knData, "ಬೆಂಗಳೂರು");

        const addressEn =
          enResult.address || `GPS: ${formatCoordinates(lat, lng)}, Bengaluru`;
        const areaEn = enResult.area || "Bengaluru";

        // If Kannada call fails or returns empty, fallback to English
        const addressKn =
          knResult.address && knResult.address.trim().length > 0
            ? knResult.address
            : addressEn;
        const areaKn =
          knResult.area && knResult.area.trim().length > 0
            ? knResult.area
            : areaEn;

        const result: ReverseGeocodeResult = {
          address: addressEn,
          addressKn,
          areaEn,
          areaKn,
        };

        geocodeCache.set(cacheKey, result);
        setLoading(false);
        return result;
      } catch (err) {
        console.warn("Reverse geocode failed, using coordinates:", err);
        setError("Could not resolve street address, using exact coordinates.");
        setLoading(false);

        const fallbackCoord = formatCoordinates(lat, lng);
        const fallbackResult: ReverseGeocodeResult = {
          address: `GPS: ${fallbackCoord}, Bengaluru`,
          addressKn: `ಜಿಪಿಎಸ್: ${fallbackCoord}, ಬೆಂಗಳೂರು`,
          areaEn: "Bengaluru",
          areaKn: "ಬೆಂಗಳೂರು",
        };
        geocodeCache.set(cacheKey, fallbackResult);
        return fallbackResult;
      }
    },
    []
  );

  return { reverseGeocode, loading, error };
}
