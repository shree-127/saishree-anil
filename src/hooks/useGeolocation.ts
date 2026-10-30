import { useState, useEffect, useCallback } from "react";
import { useReverseGeocode } from "./useReverseGeocode";

export type GeolocationStatus =
  | "idle"
  | "requesting"
  | "granted"
  | "denied"
  | "unavailable";

export interface GeoLocationState {
  status: GeolocationStatus;
  lat: number | null;
  lng: number | null;
  accuracyM: number | null;
  address: string;
  addressKn: string;
  areaEn: string;
  areaKn: string;
  error: string | null;
}

// Bengaluru default coordinates for demo/fallback (Near Cubbon Park / Vidhana Soudha)
const BENGALURU_DEFAULT = {
  lat: 12.9763,
  lng: 77.5929,
  accuracyM: 8,
  address: "Dr Ambedkar Veedhi, Sampangi Rama Nagar, Bengaluru, Karnataka 560001",
  addressKn: "ಡಾ. ಅಂಬೇಡ್ಕರ್ ವೀಧಿ, ಸಂಪಂಗಿ ರಾಮನಗರ, ಬೆಂಗಳೂರು, ಕರ್ನಾಟಕ 560001",
  areaEn: "Sampangi Rama Nagar",
  areaKn: "ಸಂಪಂಗಿ ರಾಮನಗರ",
};

export function useGeolocation(autoStart = true) {
  const [state, setState] = useState<GeoLocationState>({
    status: "idle",
    lat: null,
    lng: null,
    accuracyM: null,
    address: "",
    addressKn: "",
    areaEn: "",
    areaKn: "",
    error: null,
  });

  const { reverseGeocode } = useReverseGeocode();

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        status: "unavailable",
        error: "Geolocation is not supported by your browser environment.",
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      status: "requesting",
      error: null,
    }));

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracyM = Math.round(position.coords.accuracy);

        setState((prev) => ({
          ...prev,
          status: "granted",
          lat,
          lng,
          accuracyM,
          error: null,
        }));

        const geoResult = await reverseGeocode(lat, lng);
        setState((prev) => ({
          ...prev,
          address: geoResult.address,
          addressKn: geoResult.addressKn,
          areaEn: geoResult.areaEn,
          areaKn: geoResult.areaKn,
        }));
      },
      (geoError) => {
        let status: GeolocationStatus = "unavailable";
        let message = "Unable to retrieve device location.";

        if (geoError.code === geoError.PERMISSION_DENIED) {
          status = "denied";
          message = "Location permission was denied.";
        } else if (geoError.code === geoError.POSITION_UNAVAILABLE) {
          status = "unavailable";
          message = "GPS satellite or network signal unavailable.";
        } else if (geoError.code === geoError.TIMEOUT) {
          status = "unavailable";
          message = "Location request timed out.";
        }

        setState((prev) => ({
          ...prev,
          status,
          error: message,
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [reverseGeocode]);

  // Fallback helper for demos/iframes where GPS permissions might be restricted
  const useBengaluruFallback = useCallback(async () => {
    setState({
      status: "granted",
      lat: BENGALURU_DEFAULT.lat,
      lng: BENGALURU_DEFAULT.lng,
      accuracyM: BENGALURU_DEFAULT.accuracyM,
      address: BENGALURU_DEFAULT.address,
      addressKn: BENGALURU_DEFAULT.addressKn,
      areaEn: BENGALURU_DEFAULT.areaEn,
      areaKn: BENGALURU_DEFAULT.areaKn,
      error: null,
    });
  }, []);

  const updateManualAddress = useCallback((newAddress: string) => {
    setState((prev) => ({
      ...prev,
      address: newAddress,
      addressKn: newAddress,
    }));
  }, []);

  useEffect(() => {
    if (autoStart) {
      requestLocation();
    }
  }, [autoStart, requestLocation]);

  return {
    ...state,
    refreshLocation: requestLocation,
    useBengaluruFallback,
    updateManualAddress,
  };
}
