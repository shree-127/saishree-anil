import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import {
  List,
  Map as MapIcon,
  AlertTriangle,
  Flame,
  HelpCircle,
  Clock,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Info,
  Radio,
  CheckCircle2,
} from "lucide-react";
import { useI18n } from "../../hooks/useI18n";
import { getLiveReports } from "../../lib/api";
import { getAddress, getArea } from "../../lib/format";
import { Category, Report, Status } from "../../types";
import { Badge } from "../../components/ui/Badge";
import { Card, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import L from "leaflet";

type FilterType = "all" | Category;
type ViewMode = "list" | "map";

export const LiveFeedPage: React.FC = () => {
  const { t, language } = useI18n();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Map container reference
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Fetch live reports
  const fetchReports = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    try {
      const data = await getLiveReports();
      setReports(data);
      setError(null);
    } catch (err) {
      console.error("Live feed fetch error:", err);
      setError("Failed to load live reports. Please check connectivity.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // Auto-refresh every 15 seconds
    const interval = setInterval(() => {
      fetchReports(true);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  // Filtered reports
  const filteredReports = useMemo(() => {
    if (activeFilter === "all") return reports;
    return reports.filter((r) => r.category === activeFilter);
  }, [reports, activeFilter]);

  // Format relative minutes ago
  const formatTimeAgo = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.max(1, Math.floor(diffMs / 60000));
    if (diffMins < 2) return t("justNow");
    return `${diffMins} ${t("minAgo")}`;
  };

  // Status badge helper
  const getStatusBadge = (status: Status) => {
    switch (status) {
      case "accepted":
        return <Badge variant="primary" icon={<CheckCircle2 className="w-3 h-3" />}>{t("statusAccepted")}</Badge>;
      case "en_route":
      case "on_scene":
        return <Badge variant="info" icon={<Radio className="w-3 h-3 animate-pulse" />}>{t("statusEnRoute")}</Badge>;
      case "resolved":
        return <Badge variant="neutral">{t("statusResolved")}</Badge>;
      default:
        return <Badge variant="secondary" icon={<Clock className="w-3 h-3" />}>{t("statusReported")}</Badge>;
    }
  };

  // Category Icon & label
  const getCategoryMeta = (category: Category) => {
    switch (category) {
      case "fire":
        return {
          icon: <Flame className="w-4 h-4 text-red-500" />,
          label: t("catFire"),
          variant: "destructive" as const,
        };
      case "not_sure":
        return {
          icon: <HelpCircle className="w-4 h-4 text-amber-500" />,
          label: t("catNotSure"),
          variant: "secondary" as const,
        };
      default:
        return {
          icon: <AlertTriangle className="w-4 h-4 text-red-500" />,
          label: t("catRoadAccident"),
          variant: "destructive" as const,
        };
    }
  };

  // Initialize and update Map View when viewMode is 'map'
  useEffect(() => {
    if (viewMode !== "map" || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [12.9716, 77.5946], // Bengaluru center
        zoom: 12,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
      markersLayerRef.current = markersGroup;
    }

    const markersGroup = markersLayerRef.current;
    if (markersGroup) {
      markersGroup.clearLayers();

      filteredReports.forEach((rep) => {
        const isFire = rep.category === "fire";
        const isAccident = rep.category === "road_accident";
        const pinColor = isFire ? "bg-red-600" : isAccident ? "bg-red-500" : "bg-amber-500";

        const icon = L.divIcon({
          className: "custom-incident-pin",
          html: `
            <div class="relative flex items-center justify-center w-7 h-7">
              <div class="absolute w-7 h-7 rounded-full ${pinColor} opacity-75 pulse-marker-ring"></div>
              <div class="relative w-4 h-4 rounded-full ${pinColor} border-2 border-white shadow-md"></div>
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const catTitle = isFire
          ? (language === "kn" ? "ಬೆಂಕಿ ಅವಘಡ" : "Fire")
          : isAccident
          ? (language === "kn" ? "ರಸ್ತೆ ಅಪಘಾತ" : "Road Accident")
          : (language === "kn" ? "ಪರಿಶೀಲನೆ ಅಗತ್ಯ" : "Needs Review");
        const marker = L.marker([rep.lat, rep.lng], { icon });
        marker.bindPopup(`
          <div class="p-1 space-y-1 font-sans">
            <p class="font-bold text-xs text-slate-900">${catTitle}</p>
            <p class="text-[11px] text-slate-600">${getAddress(rep, language)}</p>
            <p class="text-[10px] text-emerald-700 font-semibold">${rep.status.toUpperCase()}</p>
            <a href="/status/${rep.id}" class="text-[11px] text-emerald-600 underline font-bold block pt-1">${language === "kn" ? "ಸ್ಥಿತಿ ಪರಿಶೀಲಿಸಿ" : "Track Live Status"} &rarr;</a>
          </div>
        `);
        markersGroup.addLayer(marker);
      });
    }

    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 200);

    return () => clearTimeout(timer);
  }, [viewMode, filteredReports]);

  return (
    <div className="flex-1 flex flex-col p-4 space-y-3 pb-8 max-w-lg mx-auto w-full">
      {/* Header & Controls */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-1.5">
              <span>{t("liveTitle")}</span>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            </h2>
            <p className="text-xs text-muted-foreground">{t("liveDesc")}</p>
          </div>

          {/* Toggle List | Map */}
          <div className="flex items-center p-1 rounded-xl bg-muted border border-border shrink-0">
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === "list"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>{t("viewList")}</span>
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === "map"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>{t("viewMap")}</span>
            </button>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeFilter === "all"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted text-muted-foreground hover:text-foreground border border-border"
            }`}
          >
            {t("filterAll")} ({reports.length})
          </button>
          <button
            onClick={() => setActiveFilter("road_accident")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeFilter === "road_accident"
                ? "bg-red-500 text-white shadow-xs"
                : "bg-muted text-muted-foreground hover:text-foreground border border-border"
            }`}
          >
            {t("filterAccident")}
          </button>
          <button
            onClick={() => setActiveFilter("fire")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeFilter === "fire"
                ? "bg-red-600 text-white shadow-xs"
                : "bg-muted text-muted-foreground hover:text-foreground border border-border"
            }`}
          >
            {t("filterFire")}
          </button>
          <button
            onClick={() => setActiveFilter("not_sure")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeFilter === "not_sure"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-muted text-muted-foreground hover:text-foreground border border-border"
            }`}
          >
            {t("filterNotSure")}
          </button>
        </div>

        {/* Privacy Note: Photos not shown to public */}
        <div className="p-2.5 rounded-xl bg-muted/40 border border-border/80 flex items-start gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="w-4 h-4 text-emerald-800 dark:text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">{t("privacyNotice")}</p>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-3">
          <RefreshCw className="w-7 h-7 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground">{t("loading")}</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-center space-y-3">
          <p className="text-xs text-red-400">{error}</p>
          <Button variant="outline" size="sm" onClick={() => fetchReports()}>
            {t("retry")}
          </Button>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
          <Info className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="text-xs text-muted-foreground">{t("noIncidentsFound")}</p>
        </div>
      ) : viewMode === "map" ? (
        /* Map View Container */
        <div className="flex-1 min-h-[420px] rounded-2xl overflow-hidden border border-border relative">
          <div ref={mapContainerRef} className="w-full h-full min-h-[420px]" />
          <div className="absolute top-2 right-2 z-20 bg-card/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-border text-[10px] font-semibold text-foreground">
            {filteredReports.length} {t("liveTitle")}
          </div>
        </div>
      ) : (
        /* List View */
        <div className="space-y-2.5">
          {filteredReports.map((report) => {
            const meta = getCategoryMeta(report.category);
            return (
              <Link
                key={report.id}
                to={`/status/${report.id}`}
                className="block group"
              >
                <Card className="hover:border-primary/50 transition-all shadow-xs hover:shadow-md cursor-pointer">
                  <CardContent className="p-3.5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Badge variant={meta.variant} icon={meta.icon}>
                          {meta.label}
                        </Badge>
                        {report.isDuplicate && (
                          <Badge variant="secondary">{t("duplicateBadge")}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
                        <Clock className="w-3 h-3" />
                        <span>{formatTimeAgo(report.createdAt)}</span>
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <h3 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-1">
                        {getAddress(report, language)}
                      </h3>
                      <p className="text-[11px] text-muted-foreground line-clamp-1 leading-relaxed">
                        {language === "kn" ? report.aiSummaryKn : report.aiSummaryEn}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-border/50">
                      <div>{getStatusBadge(report.status)}</div>
                      <span className="text-[11px] font-semibold text-primary flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                        <span>{report.id}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Auto-refresh indicator */}
      <div className="pt-2 text-center">
        <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
          <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
          <span>{t("refreshingFeed")}</span>
        </span>
      </div>
    </div>
  );
};
