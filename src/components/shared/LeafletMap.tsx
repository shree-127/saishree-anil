import React, { useEffect, useRef } from "react";
import L from "leaflet";

interface LeafletMapProps {
  lat: number;
  lng: number;
  zoom?: number;
  markerType?: "user" | "emergency" | "incident";
  popupText?: string;
  className?: string;
  interactive?: boolean;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  lat,
  lng,
  zoom = 15,
  markerType = "user",
  popupText,
  className = "h-40 w-full rounded-xl overflow-hidden",
  interactive = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Cleanup previous map instance if it exists
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Initialize Leaflet map
    const map = L.map(mapContainerRef.current, {
      center: [lat, lng],
      zoom,
      zoomControl: interactive,
      dragging: interactive,
      scrollWheelZoom: false,
      attributionControl: false,
    });

    // Add OpenStreetMap raster tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    // Custom divIcon marker to avoid Vite asset bundling issues with Leaflet's default PNGs
    const isUser = markerType === "user";
    const markerColor = isUser ? "bg-emerald-500" : "bg-red-500";
    const ringColor = isUser ? "border-emerald-300" : "border-red-300";

    const customIcon = L.divIcon({
      className: "custom-leaflet-marker",
      html: `
        <div class="relative flex items-center justify-center w-7 h-7">
          <div class="absolute w-7 h-7 rounded-full ${markerColor} opacity-75 pulse-marker-ring"></div>
          <div class="relative w-4 h-4 rounded-full ${markerColor} border-2 border-white shadow-md"></div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
    if (popupText) {
      marker.bindPopup(`<div class="text-xs font-sans font-semibold">${popupText}</div>`);
    }

    mapInstanceRef.current = map;
    markerRef.current = marker;

    // Force map to invalidate size once DOM renders
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update view when coordinates change
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([lat, lng], zoom);
      markerRef.current.setLatLng([lat, lng]);
      if (popupText) {
        markerRef.current.setPopupContent(
          `<div class="text-xs font-sans font-semibold">${popupText}</div>`
        );
      }
    }
  }, [lat, lng, zoom, popupText]);

  return (
    <div
      ref={mapContainerRef}
      className={`relative border border-border shadow-inner z-0 ${className}`}
      aria-label="Map displaying location"
      role="region"
    />
  );
};
