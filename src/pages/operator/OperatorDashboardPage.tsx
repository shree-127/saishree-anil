import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ShieldAlert,
  PhoneCall,
  RefreshCw,
  Sun,
  Moon,
  Globe,
  Radio,
  Flame,
  AlertTriangle,
  HelpCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Filter,
  Eye,
  Check,
  Split,
  Merge,
  Search,
  ArrowLeft,
  ChevronRight,
  Sparkles,
  MapPin,
  Volume2,
} from "lucide-react";
import { useI18n } from "../../hooks/useI18n";
import { useAppStore } from "../../store/useAppStore";
import {
  getReports,
  updateIncidentStatus,
  retryCall,
} from "../../lib/api";
import { getAddress } from "../../lib/format";
import { Category, Report, Status } from "../../types";
import { Card, CardContent } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import L from "leaflet";

export const OperatorDashboardPage: React.FC = () => {
  const { t, language, toggleLanguage } = useI18n();
  const theme = useAppStore((state) => state.theme);
  const toggleTheme = useAppStore((state) => state.toggleTheme);

  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRetryingCall, setIsRetryingCall] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | Category>("all");
  const [duplicatesOnly, setDuplicatesOnly] = useState(false);
  const [needsReviewOnly, setNeedsReviewOnly] = useState(false);

  // Map references
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Fetch reports
  const fetchReports = async (isBackground = false) => {
    if (isBackground) setIsRefreshing(true);
    try {
      const data = await getReports();
      setReports(data);
      if (!selectedReportId && data.length > 0) {
        setSelectedReportId(data[0].id);
      }
    } catch (err) {
      console.error("Operator data fetch error:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // Auto-refresh every 10 seconds as specified
    const interval = setInterval(() => {
      fetchReports(true);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((rep) => {
      if (categoryFilter !== "all" && rep.category !== categoryFilter) return false;
      if (duplicatesOnly && !rep.isDuplicate) return false;
      if (needsReviewOnly && !rep.needsReview) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchAddress = (rep.address + " " + (rep.addressKn || "") + " " + (rep.areaEn || "") + " " + (rep.areaKn || "")).toLowerCase().includes(query);
        const matchId = rep.id.toLowerCase().includes(query);
        const matchSummary = (rep.aiSummaryEn + rep.aiSummaryKn).toLowerCase().includes(query);
        if (!matchAddress && !matchId && !matchSummary) return false;
      }
      return true;
    });
  }, [reports, categoryFilter, duplicatesOnly, needsReviewOnly, searchQuery]);

  // Selected report object
  const selectedReport = useMemo(() => {
    return reports.find((r) => r.id === selectedReportId) || null;
  }, [reports, selectedReportId]);

  // KPIs
  const activeCount = reports.filter((r) => r.status !== "resolved").length;
  const awaitingCount = reports.filter(
    (r) => r.status === "reported" || r.status === "call_queued" || r.status === "call_failed"
  ).length;
  const duplicatesCount = reports.filter((r) => r.isDuplicate).length;
  const callsDelivered = reports.filter((r) => r.callStatus === "delivered").length;
  const callsFailed = reports.filter((r) => r.callStatus === "failed").length;

  // Initialize and update Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [12.9716, 77.5946],
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
        const isSelected = rep.id === selectedReportId;
        const isFire = rep.category === "fire";
        const isAccident = rep.category === "road_accident";
        const pinColor = isFire ? "bg-red-600" : isAccident ? "bg-red-500" : "bg-amber-500";
        const sizeClass = isSelected ? "w-8 h-8 scale-125" : "w-6 h-6";

        const icon = L.divIcon({
          className: "custom-operator-pin",
          html: `
            <div class="relative flex items-center justify-center ${sizeClass} transition-transform">
              <div class="absolute inset-0 rounded-full ${pinColor} opacity-75 pulse-marker-ring"></div>
              <div class="relative w-4 h-4 rounded-full ${pinColor} border-2 border-white shadow-md flex items-center justify-center text-[8px] text-white font-bold">
                ${isFire ? "F" : isAccident ? "A" : "?"}
              </div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([rep.lat, rep.lng], { icon });
        marker.on("click", () => {
          setSelectedReportId(rep.id);
        });

        markersGroup.addLayer(marker);
      });
    }

    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 200);

    return () => clearTimeout(timer);
  }, [filteredReports, selectedReportId]);

  // Center map on selected report if available
  useEffect(() => {
    if (selectedReport && mapInstanceRef.current) {
      mapInstanceRef.current.panTo([selectedReport.lat, selectedReport.lng], {
        animate: true,
      });
    }
  }, [selectedReport]);

  const handleRetryCall = async () => {
    if (!selectedReport) return;
    setIsRetryingCall(true);
    try {
      const updated = await retryCall(selectedReport.id);
      setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } catch (err) {
      console.error("Retry call error:", err);
    } finally {
      setIsRetryingCall(false);
    }
  };

  const handleUpdateStatus = async (newStatus: Status) => {
    if (!selectedReport) return;
    try {
      const updated = await updateIncidentStatus(selectedReport.id, newStatus);
      setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } catch (err) {
      console.error("Status update error:", err);
    }
  };

  const handleToggleDuplicate = (isDup: boolean) => {
    if (!selectedReport) return;
    setReports((prev) =>
      prev.map((r) =>
        r.id === selectedReport.id
          ? {
              ...r,
              isDuplicate: isDup,
              duplicateOf: isDup ? r.duplicateOf || "NR-2026-1042" : undefined,
            }
          : r
      )
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Demo Mode Notice Banner */}
      <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-900 dark:text-amber-200 px-4 py-2 text-xs font-semibold flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
          <span>{t("demoModeBanner")}</span>
        </div>
        <span className="text-[11px] font-mono opacity-80">
          Node: BLR-CENTRAL-01
        </span>
      </div>

      {/* Top Header */}
      <header className="bg-card border-b border-border px-6 py-3.5 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-foreground leading-tight">
                {t("operatorTitle")}
              </h1>
              <span className="text-[10px] font-bold bg-primary/10 text-primary border border-primary/25 px-2 py-0.5 rounded-full">
                LIVE OPS
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("operatorSubtitle")}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Refresh status */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground mr-2 font-mono">
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
            <span>{t("operatorRefreshNotice")}</span>
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="w-9 h-9 rounded-xl bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* Language toggle */}
          <button
            onClick={toggleLanguage}
            className="h-9 px-3 rounded-xl bg-muted/80 hover:bg-muted border border-border text-foreground text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-primary" />
            <span>{language === "kn" ? "EN" : "ಕನ್ನಡ"}</span>
          </button>

          {/* Link to citizen app */}
          <Link to="/">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            >
              Citizen View
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Container with Sidebar + Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Rail / Sidebar Navigation */}
        <aside className="w-full lg:w-64 bg-sidebar text-sidebar-foreground border-r border-border/40 p-4 space-y-4 shrink-0 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Emergency Dispatch Rail
              </span>
              <div className="p-3 rounded-xl bg-muted/10 border border-border/20 space-y-1 text-xs">
                <p className="font-bold text-sidebar-foreground">Bengaluru 112 Hub</p>
                <p className="text-[11px] text-muted-foreground">Connected to BBMP & Traffic Police</p>
              </div>
            </div>

            {/* Quick Filters */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Active Filter Triage
              </span>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setCategoryFilter("all");
                    setDuplicatesOnly(false);
                    setNeedsReviewOnly(false);
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                    categoryFilter === "all" && !duplicatesOnly && !needsReviewOnly
                      ? "bg-primary text-primary-foreground"
                      : "text-sidebar-foreground hover:bg-muted/10"
                  }`}
                >
                  <span>All Incidents</span>
                  <span className="font-mono">{reports.length}</span>
                </button>
                <button
                  onClick={() => setDuplicatesOnly(!duplicatesOnly)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                    duplicatesOnly
                      ? "bg-amber-500 text-white"
                      : "text-sidebar-foreground hover:bg-muted/10"
                  }`}
                >
                  <span>Flagged Duplicates</span>
                  <span className="font-mono">{duplicatesCount}</span>
                </button>
                <button
                  onClick={() => setNeedsReviewOnly(!needsReviewOnly)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                    needsReviewOnly
                      ? "bg-blue-500 text-white"
                      : "text-sidebar-foreground hover:bg-muted/10"
                  }`}
                >
                  <span>Needs Human Review</span>
                  <span className="font-mono">
                    {reports.filter((r) => r.needsReview).length}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border/20 text-[11px] text-muted-foreground">
            <p>Namma Rakshane C&C v2.4</p>
            <p className="text-[10px]">FastAPI AI Grounding Active</p>
          </div>
        </aside>

        {/* Main Dashboard Space */}
        <main className="flex-1 flex flex-col overflow-y-auto p-4 lg:p-6 space-y-5">
          {/* Top KPI Row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card className="p-3.5 border-border shadow-xs bg-card">
              <p className="text-[11px] font-bold text-muted-foreground uppercase">
                {t("kpiActive")}
              </p>
              <p className="text-xl font-bold text-foreground mt-1">
                {activeCount}
              </p>
              <span className="text-[10px] text-emerald-800 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                <Radio className="w-2.5 h-2.5 animate-pulse" /> Live in Bengaluru
              </span>
            </Card>

            <Card className="p-3.5 border-border shadow-xs bg-card">
              <p className="text-[11px] font-bold text-muted-foreground uppercase">
                {t("kpiAwaiting")}
              </p>
              <p className="text-xl font-bold text-amber-500 mt-1">
                {awaitingCount}
              </p>
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Pending acceptance
              </span>
            </Card>

            <Card className="p-3.5 border-border shadow-xs bg-card">
              <p className="text-[11px] font-bold text-muted-foreground uppercase">
                {t("kpiDuplicates")}
              </p>
              <p className="text-xl font-bold text-foreground mt-1">
                {duplicatesCount}
              </p>
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Merged automatically
              </span>
            </Card>

            <Card className="p-3.5 border-border shadow-xs bg-card">
              <p className="text-[11px] font-bold text-muted-foreground uppercase">
                {t("kpiAvgTime")}
              </p>
              <p className="text-xl font-bold text-primary mt-1">
                3.8 min
              </p>
              <span className="text-[10px] text-emerald-800 dark:text-emerald-400 mt-0.5 block">
                AI + Voice Dispatch
              </span>
            </Card>

            <Card className="p-3.5 border-border shadow-xs bg-card col-span-2 md:col-span-1">
              <p className="text-[11px] font-bold text-muted-foreground uppercase">
                {t("kpiCalls")}
              </p>
              <p className="text-xl font-bold text-foreground mt-1 font-mono">
                {callsDelivered} / {callsFailed}
              </p>
              <span className="text-[10px] text-emerald-800 dark:text-emerald-400 mt-0.5 block">
                Kannada synthesis
              </span>
            </Card>
          </div>

          {/* Middle Layout: Map + Detail Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Map & Table (Left/Center: 7 or 8 cols) */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-4">
              {/* Geospatial Incident Map */}
              <Card className="border-border overflow-hidden shadow-md">
                <div className="p-3 bg-muted/40 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <h3 className="text-xs font-bold text-foreground">
                      Bengaluru Metropolitan Incident Map
                    </h3>
                  </div>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {filteredReports.length} pins active
                  </span>
                </div>
                <div className="h-80 w-full relative">
                  <div ref={mapContainerRef} className="w-full h-full" />
                </div>
              </Card>

              {/* Incidents Table */}
              <Card className="border-border overflow-hidden shadow-xs">
                <div className="p-3.5 bg-muted/40 border-b border-border flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="relative w-full sm:w-64">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search landmark, ID, or summary..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-card border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-2.5" />
                  </div>

                  {/* Category filters */}
                  <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                    {(["all", "road_accident", "fire", "not_sure"] as const).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                          categoryFilter === cat
                            ? "bg-primary text-primary-foreground"
                            : "bg-card hover:bg-muted text-muted-foreground border border-border"
                        }`}
                      >
                        {cat === "all" ? "All" : cat === "road_accident" ? "Accidents" : cat === "fire" ? "Fire" : "Review"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Table Data */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/60 text-muted-foreground text-[10px] uppercase font-bold border-b border-border">
                      <tr>
                        <th className="p-3">Incident ID</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Location</th>
                        <th className="p-3">Call Status</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {filteredReports.slice(0, 8).map((rep) => {
                        const isSelected = rep.id === selectedReportId;
                        return (
                          <tr
                            key={rep.id}
                            onClick={() => setSelectedReportId(rep.id)}
                            className={`hover:bg-muted/40 transition-colors cursor-pointer ${
                              isSelected ? "bg-primary/10" : ""
                            }`}
                          >
                            <td className="p-3 font-mono font-bold text-foreground">
                              {rep.id}
                            </td>
                            <td className="p-3">
                              <Badge
                                variant={
                                  rep.category === "fire"
                                    ? "destructive"
                                    : rep.category === "road_accident"
                                    ? "destructive"
                                    : "secondary"
                                }
                              >
                                {rep.category === "road_accident"
                                  ? "Accident"
                                  : rep.category === "fire"
                                  ? "Fire"
                                  : "Unsure"}
                              </Badge>
                            </td>
                            <td className="p-3 max-w-[200px] truncate text-foreground">
                              {getAddress(rep, language)}
                            </td>
                            <td className="p-3">
                              <span
                                className={`text-[11px] font-semibold ${
                                  rep.callStatus === "delivered"
                                    ? "text-emerald-800 dark:text-emerald-400"
                                    : rep.callStatus === "failed"
                                    ? "text-red-500"
                                    : "text-amber-500"
                                }`}
                              >
                                {rep.callStatus.toUpperCase()}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className="text-[11px] font-semibold text-foreground">
                                {rep.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedReportId(rep.id);
                                }}
                                className="p-1 rounded-lg hover:bg-muted text-primary cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            {/* Right Side Detail Panel: 5 or 4 cols */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-4">
              {selectedReport ? (
                <Card className="border-border shadow-md">
                  <CardContent className="p-4 space-y-4">
                    {/* Header ID & Status */}
                    <div className="flex items-center justify-between pb-2 border-b border-border">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-foreground">
                            {selectedReport.id}
                          </h3>
                          {selectedReport.isDuplicate && (
                            <Badge variant="secondary">DUPLICATE</Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground font-mono">
                          {new Date(selectedReport.createdAt).toLocaleString()}
                        </p>
                      </div>

                      {/* Status Dropdown */}
                      <select
                        value={selectedReport.status}
                        onChange={(e) => handleUpdateStatus(e.target.value as Status)}
                        className="px-2.5 py-1 rounded-xl bg-muted border border-border text-xs font-bold text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                      >
                        <option value="reported">Reported</option>
                        <option value="accepted">Accepted</option>
                        <option value="en_route">En Route</option>
                        <option value="on_scene">On Scene</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </div>

                    {/* Verified Photo if available */}
                    {selectedReport.photoDataUrl ? (
                      <div className="rounded-xl overflow-hidden border border-border bg-slate-950 aspect-[16/10] relative">
                        <img
                          src={selectedReport.photoDataUrl}
                          alt="Incident frame"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2">
                          <span className="bg-emerald-600/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                            LIVE VERIFIED FRAME
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-muted/40 border border-border text-center text-xs text-muted-foreground">
                        Live frame stored in secure memory buffer
                      </div>
                    )}

                    {/* Location */}
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">
                        Location Coordinates
                      </p>
                      <p className="text-xs font-semibold text-foreground">
                        {getAddress(selectedReport, language)}
                      </p>
                      <p className="text-[11px] font-mono text-muted-foreground">
                        Lat: {selectedReport.lat.toFixed(5)}, Lng: {selectedReport.lng.toFixed(5)} (±{selectedReport.accuracyM}m)
                      </p>
                    </div>

                    {/* AI Summary in Kannada + English */}
                    <div className="space-y-1.5 p-3 rounded-xl bg-muted/50 border border-border">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Vision AI Triage
                        </span>
                        <Badge variant="primary">{selectedReport.aiConfidence.toUpperCase()} CONFIDENCE</Badge>
                      </div>
                      <p className="text-xs font-semibold text-foreground">
                        KN: {selectedReport.aiSummaryKn}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        EN: {selectedReport.aiSummaryEn}
                      </p>
                    </div>

                    {/* Witness Intelligence */}
                    {(selectedReport.witness.bleeding ||
                      selectedReport.witness.conscious ||
                      selectedReport.witness.trapped ||
                      selectedReport.witness.note) && (
                      <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs space-y-1">
                        <p className="font-bold text-foreground text-[10px] uppercase">
                          Citizen Witness Answers
                        </p>
                        <div className="grid grid-cols-2 gap-1 text-[11px] text-muted-foreground">
                          <span>Bleeding: <strong className="text-foreground">{selectedReport.witness.bleeding || "None reported"}</strong></span>
                          <span>Conscious: <strong className="text-foreground">{selectedReport.witness.conscious || "Unsure"}</strong></span>
                          <span>Trapped: <strong className="text-foreground">{selectedReport.witness.trapped || "No"}</strong></span>
                        </div>
                        {selectedReport.witness.note && (
                          <p className="text-muted-foreground italic pt-1">
                            "{selectedReport.witness.note}"
                          </p>
                        )}
                      </div>
                    )}

                    {/* Kannada Voice Call Telemetry + Retry Call Button */}
                    <div className="p-3 rounded-xl bg-muted/50 border border-border space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Volume2 className="w-4 h-4 text-primary" />
                          <span className="text-xs font-bold text-foreground">
                            Kannada Auto Voice Call
                          </span>
                        </div>
                        <Badge
                          variant={
                            selectedReport.callStatus === "delivered"
                              ? "primary"
                              : selectedReport.callStatus === "failed"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {selectedReport.callStatus.toUpperCase()}
                        </Badge>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        isLoading={isRetryingCall}
                        onClick={handleRetryCall}
                        className="w-full"
                        leftIcon={<PhoneCall className="w-3.5 h-3.5" />}
                      >
                        {t("retryVoiceCall")}
                      </Button>
                    </div>

                    {/* Duplicate Merge / Separate controls */}
                    <div className="space-y-1.5 pt-1 border-t border-border">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">
                        Duplicate Triage Actions
                      </span>
                      <div className="flex items-center gap-2">
                        {selectedReport.isDuplicate ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleDuplicate(false)}
                            className="flex-1"
                            leftIcon={<Split className="w-3.5 h-3.5" />}
                          >
                            {t("markAsSeparate")}
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleToggleDuplicate(true)}
                            className="flex-1"
                            leftIcon={<Merge className="w-3.5 h-3.5" />}
                          >
                            {t("mergeAsDuplicate")}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-2xl">
                  {t("selectIncidentHint")}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
