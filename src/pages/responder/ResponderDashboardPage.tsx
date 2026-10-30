import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  AlertTriangle,
  Flame,
  HelpCircle,
  Radio,
  ArrowRight,
  ShieldCheck,
  UserPlus,
  RefreshCw,
  Navigation,
} from "lucide-react";
import { useI18n } from "../../hooks/useI18n";
import {
  getReports,
  acceptIncident,
  updateIncidentStatus,
} from "../../lib/api";
import { getAddress } from "../../lib/format";
import { calculateDistanceMeters } from "../../lib/geo";
import { Category, Report, Status } from "../../types";
import { Card, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";

type TabType = "new" | "accepted" | "in_progress" | "completed";

// Default logged-in responder for hackathon demo
const DEFAULT_RESPONDER = {
  id: "RESP-001",
  name: "Victoria Hospital Trauma Center",
  lat: 12.9634,
  lng: 77.5755,
};

export const ResponderDashboardPage: React.FC = () => {
  const { t, language } = useI18n();

  const [activeTab, setActiveTab] = useState<TabType>("new");
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);

  const fetchIncidents = async () => {
    try {
      const all = await getReports();
      setReports(all);
    } catch (err) {
      console.error("Responder fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 6000);
    return () => clearInterval(interval);
  }, []);

  // Filter reports by tab
  const tabReports = reports.filter((rep) => {
    if (activeTab === "new") {
      return (
        rep.status === "reported" ||
        rep.status === "ai_analyzed" ||
        rep.status === "call_queued" ||
        rep.status === "call_delivered" ||
        rep.status === "call_failed"
      );
    }
    if (activeTab === "accepted") {
      return rep.status === "accepted";
    }
    if (activeTab === "in_progress") {
      return rep.status === "en_route" || rep.status === "on_scene";
    }
    if (activeTab === "completed") {
      return rep.status === "resolved";
    }
    return true;
  });

  const handleAccept = async (id: string) => {
    setIsUpdatingId(id);
    try {
      await acceptIncident(id, DEFAULT_RESPONDER.id);
      await fetchIncidents();
      setActiveTab("accepted");
    } catch (err) {
      console.error("Accept error:", err);
    } finally {
      setIsUpdatingId(null);
    }
  };

  const handleDecline = (id: string) => {
    // Hide or dismiss for this responder session
    setReports((prev) => prev.filter((r) => r.id !== id));
  };

  const handleAdvanceStatus = async (id: string, currentStatus: Status) => {
    setIsUpdatingId(id);
    let nextStatus: Status = "en_route";
    if (currentStatus === "accepted") nextStatus = "en_route";
    else if (currentStatus === "en_route") nextStatus = "on_scene";
    else if (currentStatus === "on_scene") nextStatus = "resolved";

    try {
      await updateIncidentStatus(id, nextStatus);
      await fetchIncidents();
      if (nextStatus === "resolved") {
        setActiveTab("completed");
      } else {
        setActiveTab("in_progress");
      }
    } catch (err) {
      console.error("Advance status error:", err);
    } finally {
      setIsUpdatingId(null);
    }
  };

  // Helper for category badge
  const getCategoryBadge = (cat: Category) => {
    switch (cat) {
      case "fire":
        return <Badge variant="destructive" icon={<Flame className="w-3 h-3" />}>{t("catFire")}</Badge>;
      case "not_sure":
        return <Badge variant="secondary" icon={<HelpCircle className="w-3 h-3" />}>{t("catNotSure")}</Badge>;
      default:
        return <Badge variant="destructive" icon={<AlertTriangle className="w-3 h-3" />}>{t("catRoadAccident")}</Badge>;
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 space-y-4 max-w-lg mx-auto w-full pb-8">
      {/* Top Banner with Logged In Responder Identity */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-foreground">
              {DEFAULT_RESPONDER.name}
            </h2>
            <p className="text-[10px] text-muted-foreground font-mono">
              ID: {DEFAULT_RESPONDER.id} • Trauma Unit #1
            </p>
          </div>
        </div>

        <Link
          to="/responder/register"
          className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
        >
          <UserPlus className="w-3 h-3" />
          <span>Register Fleet</span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-4 p-1 rounded-2xl bg-muted border border-border gap-1 text-center">
        {(
          [
            { id: "new", label: t("tabNew") },
            { id: "accepted", label: t("tabAccepted") },
            { id: "in_progress", label: t("tabInProgress") },
            { id: "completed", label: t("tabCompleted") },
          ] as const
        ).map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Incident Cards Queue */}
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-3">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground">{t("loading")}</p>
        </div>
      ) : tabReports.length === 0 ? (
        <Card className="border-border p-8 text-center bg-muted/20">
          <CardContent className="p-0 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-800 dark:text-emerald-400 mx-auto" />
            <p className="text-xs text-muted-foreground">{t("noIncidentsInTab")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tabReports.map((inc) => {
            const distM = calculateDistanceMeters(
              DEFAULT_RESPONDER.lat,
              DEFAULT_RESPONDER.lng,
              inc.lat,
              inc.lng
            );
            const distKm = (distM / 1000).toFixed(1);

            return (
              <Card
                key={inc.id}
                className="border-border shadow-xs hover:border-primary/40 transition-all"
              >
                <CardContent className="p-4 space-y-3">
                  {/* Category, Distance, Duplicate Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {getCategoryBadge(inc.category)}
                      {inc.isDuplicate && (
                        <Badge variant="secondary">{t("duplicateBadge")}</Badge>
                      )}
                    </div>
                    <span className="text-[11px] font-semibold text-primary font-mono flex items-center gap-1 shrink-0">
                      <Navigation className="w-3 h-3" />
                      {distKm} km away
                    </span>
                  </div>

                  {/* Address & Timestamp */}
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-foreground line-clamp-1">
                        {getAddress(inc, language)}
                      </h3>
                      <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                        {inc.id}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {language === "kn" ? inc.aiSummaryKn : inc.aiSummaryEn}
                    </p>
                  </div>

                  {/* Witness Answers Chip Bar */}
                  {(inc.witness.bleeding || inc.witness.conscious || inc.witness.trapped || inc.witness.note) && (
                    <div className="p-2.5 rounded-xl bg-muted/60 border border-border/80 text-[11px] space-y-1">
                      <p className="font-bold text-foreground text-[10px] uppercase tracking-wider">
                        Witness Intel
                      </p>
                      <div className="flex flex-wrap gap-2 text-muted-foreground">
                        {inc.witness.bleeding && (
                          <span>Bleeding: <strong className="text-foreground">{inc.witness.bleeding}</strong></span>
                        )}
                        {inc.witness.conscious && (
                          <span>• Conscious: <strong className="text-foreground">{inc.witness.conscious}</strong></span>
                        )}
                        {inc.witness.trapped && (
                          <span>• Trapped: <strong className="text-foreground">{inc.witness.trapped}</strong></span>
                        )}
                      </div>
                      {inc.witness.note && (
                        <p className="text-muted-foreground italic truncate">
                          "{inc.witness.note}"
                        </p>
                      )}
                    </div>
                  )}

                  {/* Action Controls depending on Tab */}
                  {activeTab === "new" ? (
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDecline(inc.id)}
                        className="flex-1"
                      >
                        {t("declineIncident")}
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        isLoading={isUpdatingId === inc.id}
                        onClick={() => handleAccept(inc.id)}
                        className="flex-1"
                      >
                        {t("acceptIncident")}
                      </Button>
                    </div>
                  ) : activeTab === "accepted" ? (
                    <div className="pt-1">
                      <Button
                        variant="primary"
                        size="default"
                        isLoading={isUpdatingId === inc.id}
                        onClick={() => handleAdvanceStatus(inc.id, inc.status)}
                        className="w-full"
                        rightIcon={<ArrowRight className="w-4 h-4" />}
                      >
                        {t("markEnRoute")}
                      </Button>
                    </div>
                  ) : activeTab === "in_progress" ? (
                    <div className="pt-1">
                      {inc.status === "en_route" ? (
                        <Button
                          variant="secondary"
                          size="default"
                          isLoading={isUpdatingId === inc.id}
                          onClick={() => handleAdvanceStatus(inc.id, inc.status)}
                          className="w-full"
                          rightIcon={<ArrowRight className="w-4 h-4" />}
                        >
                          {t("markOnScene")}
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="default"
                          isLoading={isUpdatingId === inc.id}
                          onClick={() => handleAdvanceStatus(inc.id, inc.status)}
                          className="w-full"
                          rightIcon={<CheckCircle2 className="w-4 h-4" />}
                        >
                          {t("markResolved")}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-[11px] text-emerald-800 dark:text-emerald-400 font-semibold pt-1">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Incident Resolved Safely
                      </span>
                      <Link
                        to={`/status/${inc.id}`}
                        className="text-primary hover:underline"
                      >
                        Telemetry &rarr;
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
