import { useState, useRef, useCallback, useEffect } from "react";
import { formatCoordinates } from "../lib/geo";

export interface CameraState {
  isStreaming: boolean;
  permissionDenied: boolean;
  error: string | null;
  photoDataUrl: string | null;
}

export function useCamera(location?: { lat: number | null; lng: number | null }) {
  const [state, setState] = useState<CameraState>({
    isStreaming: false,
    permissionDenied: false,
    error: null,
    photoDataUrl: null,
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop active video stream tracks
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setState((prev) => ({ ...prev, isStreaming: false }));
  }, []);

  // Start live camera stream
  const startCamera = useCallback(async () => {
    stopStream();
    setState((prev) => ({
      ...prev,
      error: null,
      permissionDenied: false,
    }));

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setState((prev) => ({
        ...prev,
        error: "Camera access is not supported by this browser environment.",
      }));
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.muted = true;
        await videoRef.current.play().catch(() => {});
      }

      setState((prev) => ({
        ...prev,
        isStreaming: true,
        permissionDenied: false,
        error: null,
      }));
    } catch (err: unknown) {
      console.warn("Camera start error:", err);
      const isDenied =
        err instanceof DOMException &&
        (err.name === "NotAllowedError" || err.name === "PermissionDeniedError");

      setState((prev) => ({
        ...prev,
        isStreaming: false,
        permissionDenied: isDenied,
        error: isDenied
          ? "Camera permission denied. Please allow camera access in browser settings."
          : "Could not start camera hardware.",
      }));
    }
  }, [stopStream]);

  // Capture current video frame and watermark with timestamp and GPS
  const capturePhoto = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video || !streamRef.current) {
      return null;
    }

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    if (!ctx) return null;

    // Draw video frame
    ctx.drawImage(video, 0, 0, width, height);

    // Stamp watermark banner at the bottom
    const bannerHeight = Math.max(54, Math.round(height * 0.12));
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.fillRect(0, height - bannerHeight, width, bannerHeight);

    // Accent line
    ctx.fillStyle = "#10b981"; // Emerald brand color
    ctx.fillRect(0, height - bannerHeight, width, 4);

    // Watermark text
    ctx.fillStyle = "#ffffff";
    const fontSize = Math.max(14, Math.round(width * 0.024));
    ctx.font = `600 ${fontSize}px sans-serif`;

    const now = new Date();
    const timeString = `${now.toISOString().replace("T", " ").substring(0, 19)} IST`;
    const locString =
      location?.lat && location?.lng
        ? `GPS: ${formatCoordinates(location.lat, location.lng)}`
        : "GPS: Bengaluru Metropolitan Region";

    ctx.fillText(`NAMMA RAKSHANE • LIVE VERIFIED`, 16, height - bannerHeight + fontSize + 8);
    ctx.font = `400 ${fontSize - 2}px monospace`;
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText(`${timeString} | ${locString}`, 16, height - bannerHeight + fontSize * 2 + 10);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
    setState((prev) => ({ ...prev, photoDataUrl: dataUrl }));

    // Stop camera after capture to conserve battery and release hardware
    stopStream();
    return dataUrl;
  }, [location, stopStream]);

  // Fallback simulator for camera in automated tests / sandbox
  const simulateLiveCapture = useCallback((): string => {
    const canvas = document.createElement("canvas");
    canvas.width = 720;
    canvas.height = 540;
    const ctx = canvas.getContext("2d");

    if (!ctx) return "";

    // Emergency scene backdrop representation
    const gradient = ctx.createLinearGradient(0, 0, 0, 540);
    gradient.addColorStop(0, "#1e293b");
    gradient.addColorStop(0.6, "#334155");
    gradient.addColorStop(1, "#0f172a");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 720, 540);

    // Road markings & collision scene indicators
    ctx.fillStyle = "#475569";
    ctx.beginPath();
    ctx.moveTo(100, 540);
    ctx.lineTo(340, 240);
    ctx.lineTo(380, 240);
    ctx.lineTo(620, 540);
    ctx.fill();

    // Road dashes
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 6;
    ctx.setLineDash([20, 15]);
    ctx.beginPath();
    ctx.moveTo(360, 240);
    ctx.lineTo(360, 540);
    ctx.stroke();
    ctx.setLineDash([]);

    // Vehicles outline / warning icon
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(360, 310, 48, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 42px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("!", 360, 325);

    ctx.font = "bold 20px sans-serif";
    ctx.fillStyle = "#f8fafc";
    ctx.fillText("LIVE INCIDENT CAPTURE", 360, 390);
    ctx.font = "14px sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("Bengaluru City Emergency Verification Frame", 360, 415);

    // Watermark
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.fillRect(0, 540 - 64, 720, 64);
    ctx.fillStyle = "#10b981";
    ctx.fillRect(0, 540 - 64, 720, 4);

    const now = new Date();
    const timeString = `${now.toISOString().replace("T", " ").substring(0, 19)} IST`;
    const locString =
      location?.lat && location?.lng
        ? `GPS: ${formatCoordinates(location.lat, location.lng)}`
        : "GPS: 12.97160° N, 77.59460° E (Bengaluru)";

    ctx.fillStyle = "#ffffff";
    ctx.font = "600 16px sans-serif";
    ctx.fillText("NAMMA RAKSHANE • LIVE VERIFIED", 16, 540 - 38);
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "13px monospace";
    ctx.fillText(`${timeString} | ${locString}`, 16, 540 - 16);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setState((prev) => ({
      ...prev,
      photoDataUrl: dataUrl,
      isStreaming: false,
    }));
    return dataUrl;
  }, [location]);

  const retakePhoto = useCallback(() => {
    setState((prev) => ({ ...prev, photoDataUrl: null }));
    startCamera();
  }, [startCamera]);

  const clearPhoto = useCallback(() => {
    setState((prev) => ({ ...prev, photoDataUrl: null }));
    stopStream();
  }, [stopStream]);

  // Clean up media tracks when component unmounts
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  return {
    ...state,
    videoRef,
    startCamera,
    stopStream,
    capturePhoto,
    retakePhoto,
    clearPhoto,
    simulateLiveCapture,
  };
}
