import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Camera,
  RefreshCw,
  Edit2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { useI18n } from "../../hooks/useI18n";
import { useAppStore } from "../../store/useAppStore";
import { useGeolocation } from "../../hooks/useGeolocation";
import { useCamera } from "../../hooks/useCamera";
import { Stepper } from "../../components/ui/Stepper";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Sheet } from "../../components/ui/Sheet";
import { LeafletMap } from "../../components/shared/LeafletMap";
import { formatCoordinates } from "../../lib/geo";
import { getAddress } from "../../lib/format";

export const ReportPage: React.FC = () => {
  const { t, language } = useI18n();
  const navigate = useNavigate();

  const draftReport = useAppStore((state) => state.draftReport);
  const updateDraft = useAppStore((state) => state.updateDraft);

  // Address edit sheet state
  const [isAddressSheetOpen, setIsAddressSheetOpen] = useState(false);
  const [editedAddress, setEditedAddress] = useState("");
  const [flashActive, setFlashActive] = useState(false);

  // Geolocation
  const geo = useGeolocation(true);

  // Live Camera
  const camera = useCamera(
    geo.lat && geo.lng ? { lat: geo.lat, lng: geo.lng } : undefined
  );

  // Sync geolocation state into Zustand draft
  useEffect(() => {
    if (geo.status === "granted" && geo.lat && geo.lng) {
      updateDraft({
        lat: geo.lat,
        lng: geo.lng,
        accuracyM: geo.accuracyM,
        address: geo.address,
        addressKn: geo.addressKn,
        areaEn: geo.areaEn,
        areaKn: geo.areaKn,
      });
      setEditedAddress(getAddress(geo, language));
    }
  }, [geo.status, geo.lat, geo.lng, geo.accuracyM, geo.address, geo.addressKn, geo.areaEn, geo.areaKn, language, updateDraft]);

  // Sync photo into draft if already taken
  useEffect(() => {
    if (camera.photoDataUrl) {
      updateDraft({ photoDataUrl: camera.photoDataUrl });
    }
  }, [camera.photoDataUrl, updateDraft]);

  // Auto-start camera once on mount if no photo taken yet
  useEffect(() => {
    if (!draftReport.photoDataUrl && !camera.photoDataUrl) {
      camera.startCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCapture = () => {
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 350);

    const capturedUrl = camera.capturePhoto();
    if (capturedUrl) {
      updateDraft({ photoDataUrl: capturedUrl });
    }
  };

  const handleSimulateCapture = () => {
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 350);

    const simUrl = camera.simulateLiveCapture();
    updateDraft({ photoDataUrl: simUrl });
  };

  const handleRetake = () => {
    updateDraft({ photoDataUrl: null });
    camera.retakePhoto();
  };

  const handleSaveAddress = () => {
    if (editedAddress.trim()) {
      geo.updateManualAddress(editedAddress.trim());
      updateDraft({
        address: editedAddress.trim(),
        addressKn: editedAddress.trim(),
      });
    }
    setIsAddressSheetOpen(false);
  };

  const hasLocation = Boolean(draftReport.lat && draftReport.lng);
  const activePhoto = draftReport.photoDataUrl || camera.photoDataUrl;
  const hasPhoto = Boolean(activePhoto);
  const canContinue = hasLocation && hasPhoto;

  const handleContinue = () => {
    if (!canContinue) return;
    navigate("/details");
  };

  return (
    <div className="flex-1 flex flex-col pb-6">
      {/* 2-Step Stepper */}
      <Stepper currentStep={1} />

      <div className="p-4 space-y-4 max-w-lg mx-auto w-full">
        {/* 1. Location Card */}
        <Card className="border-border/80 shadow-md">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-foreground">
                  {t("locationTitle")}
                </h2>
              </div>

              {geo.status === "granted" && (
                <Badge variant="primary" icon={<CheckCircle2 className="w-3 h-3 text-emerald-800 dark:text-emerald-400" />}>
                  {t("locationAcquired")}
                </Badge>
              )}
            </div>

            {/* Geolocation Status Views */}
            {geo.status === "requesting" && (
              <div className="py-4 px-3 rounded-xl bg-muted/40 border border-border flex items-center gap-3 animate-pulse">
                <RefreshCw className="w-5 h-5 text-primary animate-spin" />
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    {t("locationLocating")}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    High accuracy satellite triangulation
                  </p>
                </div>
              </div>
            )}

            {geo.status === "granted" && geo.lat && geo.lng && (
              <div className="space-y-2.5">
                {/* Mini Leaflet Map */}
                <div className="rounded-xl overflow-hidden border border-border">
                  <LeafletMap
                    lat={geo.lat}
                    lng={geo.lng}
                    zoom={16}
                    markerType="user"
                    className="h-28 w-full"
                    popupText={getAddress(geo, language) || (language === "kn" ? "ಘಟನೆಯ ಸ್ಥಳ" : "Incident Location")}
                  />
                </div>

                {/* Address & Coordinates */}
                <div className="p-2.5 rounded-xl bg-muted/50 border border-border/60 flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-foreground leading-snug">
                      {getAddress(geo, language) || (language === "kn" ? "ಬೆಂಗಳೂರು ಮಹಾನಗರ ಪ್ರದೇಶ" : "Bengaluru Metropolitan Area")}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                      <span>{formatCoordinates(geo.lat, geo.lng)}</span>
                      <span>•</span>
                      <span>
                        ±{geo.accuracyM || 8} {t("locationMeters")}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setEditedAddress(getAddress(geo, language));
                      setIsAddressSheetOpen(true);
                    }}
                    aria-label={t("locationEditAddress")}
                    className="p-1.5 rounded-lg bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border text-xs flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {(geo.status === "denied" || geo.status === "unavailable") && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300 space-y-2.5">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed">
                    {geo.status === "denied"
                      ? t("locationDenied")
                      : t("locationUnavailable")}
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={geo.refreshLocation}
                    leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                  >
                    {t("locationTryAgain")}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={geo.useBengaluruFallback}
                    leftIcon={<MapPin className="w-3.5 h-3.5" />}
                  >
                    Use Bengaluru Central
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 2. Live Camera Card */}
        <Card className="border-border/80 shadow-md overflow-hidden relative">
          {/* Flash animation layer */}
          <div
            className={`absolute inset-0 bg-white pointer-events-none z-30 transition-opacity ${
              flashActive ? "flash-active" : "opacity-0"
            }`}
          />

          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-foreground">
                  {t("cameraTitle")}
                </h2>
              </div>

              {activePhoto && (
                <Badge variant="primary" icon={<CheckCircle2 className="w-3 h-3 text-emerald-800 dark:text-emerald-400" />}>
                  {t("cameraCaptured")}
                </Badge>
              )}
            </div>

            {/* Viewport for Camera / Captured Image */}
            <div className="relative w-full aspect-[4/3] bg-slate-950 rounded-2xl overflow-hidden border border-border flex items-center justify-center">
              {activePhoto ? (
                // Captured image preview
                <div className="relative w-full h-full">
                  <img
                    src={activePhoto}
                    alt="Captured Incident"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <span className="bg-emerald-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Live Verified
                    </span>
                  </div>
                </div>
              ) : camera.isStreaming ? (
                // Live camera feed
                <video
                  ref={camera.videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : camera.permissionDenied || camera.error ? (
                // Camera error / permission fallback
                <div className="p-4 text-center space-y-3 max-w-xs">
                  <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {camera.error || t("cameraDenied")}
                  </p>
                  <div className="flex flex-col gap-2 pt-1">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={camera.startCamera}
                      leftIcon={<Camera className="w-3.5 h-3.5" />}
                    >
                      {t("cameraRetry")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSimulateCapture}
                      leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                    >
                      Simulate Incident Photo (Demo)
                    </Button>
                  </div>
                </div>
              ) : (
                // Initial standby state
                <div className="text-center space-y-3">
                  <Camera className="w-10 h-10 text-slate-500 mx-auto" />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={camera.startCamera}
                    leftIcon={<Camera className="w-4 h-4" />}
                  >
                    {t("cameraTurnOn")}
                  </Button>
                </div>
              )}
            </div>

            {/* Shutter / Retake Controls */}
            {activePhoto ? (
              <div className="flex items-center gap-2 pt-1">
                <Button
                  variant="outline"
                  size="default"
                  onClick={handleRetake}
                  leftIcon={<RotateCcw className="w-4 h-4" />}
                  className="flex-1"
                >
                  {t("cameraRetake")}
                </Button>
                <div className="flex-1 flex items-center justify-center text-xs font-semibold text-emerald-800 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 py-3 rounded-xl gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  {t("cameraUse")}
                </div>
              </div>
            ) : camera.isStreaming ? (
              <div className="flex flex-col items-center justify-center pt-2 gap-2">
                <button
                  type="button"
                  onClick={handleCapture}
                  aria-label={t("cameraTake")}
                  className="w-16 h-16 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg active:scale-90 transition-transform ring-4 ring-destructive/30 hover:ring-destructive/50 cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-white" />
                  </div>
                </button>
                <span className="text-xs font-semibold text-foreground">
                  {t("cameraTake")}
                </span>
              </div>
            ) : null}

            {/* Live Camera Trust Note (strictly no file upload) */}
            <p className="text-[11px] text-muted-foreground text-center leading-relaxed px-2">
              🛡️ {t("cameraLiveOnlyNotice")}
            </p>
          </CardContent>
        </Card>

        {/* 3. Anonymous Toggle */}
        <div className="p-3.5 rounded-2xl bg-card border border-border/80 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <label
                htmlFor="anon-toggle"
                className="text-xs font-bold text-foreground cursor-pointer block"
              >
                {t("anonymousLabel")}
              </label>
              <p className="text-[11px] text-muted-foreground leading-tight">
                {t("anonymousHint")}
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              id="anon-toggle"
              type="checkbox"
              checked={draftReport.anonymous}
              onChange={(e) => updateDraft({ anonymous: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        {/* 4. Primary CTA: Continue to Details */}
        <div className="pt-2 space-y-2">
          <Button
            variant="primary"
            size="cta"
            disabled={!canContinue}
            onClick={handleContinue}
            rightIcon={<ChevronRight className="w-5 h-5" />}
          >
            {t("continueToDetails")}
          </Button>

          {!canContinue && (
            <p className="text-xs text-center text-amber-600 dark:text-amber-400 font-medium leading-relaxed">
              {!hasLocation && !hasPhoto
                ? t("missingBothNotice")
                : !hasLocation
                ? t("missingLocationNotice")
                : t("missingPhotoNotice")}
            </p>
          )}
        </div>
      </div>

      {/* Edit Address Bottom Sheet */}
      <Sheet
        isOpen={isAddressSheetOpen}
        onClose={() => setIsAddressSheetOpen(false)}
        title={t("locationEditAddress")}
        description="Provide a recognizable Bengaluru landmark to help ambulances navigate faster."
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-bold text-foreground block mb-1.5">
              Landmark / Road
            </label>
            <input
              type="text"
              value={editedAddress}
              onChange={(e) => setEditedAddress(e.target.value)}
              placeholder={t("locationAddressPlaceholder")}
              className="w-full px-3.5 py-3 rounded-xl bg-muted/60 border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="outline"
              size="default"
              onClick={() => setIsAddressSheetOpen(false)}
              className="flex-1"
            >
              {t("cancel")}
            </Button>
            <Button
              variant="primary"
              size="default"
              onClick={handleSaveAddress}
              className="flex-1"
            >
              {t("saveAddress")}
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
};
