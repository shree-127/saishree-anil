/**
 * Geographical helper utilities for Bengaluru coordinates & proximity detection.
 */

// Approximate radius of the Earth in meters
const EARTH_RADIUS_METERS = 6371000;

export function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculates the great-circle distance between two points in meters using Haversine formula.
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = degreesToRadians(lat2 - lat1);
  const dLon = degreesToRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degreesToRadians(lat1)) *
      Math.cos(degreesToRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_METERS * c);
}

/**
 * Checks if a coordinate is within Bengaluru metropolitan region boundaries.
 */
export function isWithinBengaluruBounds(lat: number, lng: number): boolean {
  return lat >= 12.75 && lat <= 13.25 && lng >= 77.35 && lng <= 77.85;
}

/**
 * Formats lat/lng for display and camera stamping.
 */
export function formatCoordinates(lat: number, lng: number): string {
  const latDir = lat >= 0 ? "N" : "S";
  const lngDir = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(5)}° ${latDir}, ${Math.abs(lng).toFixed(5)}° ${lngDir}`;
}

/**
 * Generates an incident ID in standard format NR-2026-XXXX.
 */
export function generateIncidentId(): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `NR-2026-${randomNum}`;
}
