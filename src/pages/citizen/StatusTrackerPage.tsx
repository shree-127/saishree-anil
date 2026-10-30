import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Check,
  Clock,
  Radio,
  Volume2,
  Truck,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  MapPin,
  RefreshCw,
  PhoneCall,
  ShieldAlert,
  Flame,
  HelpCircle,
} from "lucide-react";
import { useI18n } from "../../hooks/useI18n";
import { getReport } from "../../lib/api";
import { getAddress } from "../../lib/format";
import { Report, Status } from "../../types";
import { Card, CardContent } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { LeafletMap } from "../../components/shared/LeafletMap";

export const StatusTrackerPage: React.FC = () => {
  const { t, language } = useI18n();
  const { id } = useParams<{ id: string }>();

  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  // Fetch report function
  const fetchReport = async (isBackground = false) => {
    if (!id) return;
    if (isBackground) setIsPolling(true);

    try {
      const data = await getReport(id);
      if (data) {
        setReport(data);
        setIsNotFound(false);
      } else {
        if (!isBackground) setIsNotFound(true);
      }
    } catch (err) {
      console.error("Status fetch error:", err);
      if (!isBackground) setIsNotFound(true);
    } finally {
      setIsLoading(false);
      setIsPolling(false);
    }
  };

  useEffect(() => {
    fetchReport();

    // Poll mock API every 5 seconds as requested
    const interval = setInterval(() => {
      fetchReport(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-3">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <p className="text-xs text-muted-foreground">{t("loading")}</p>
      </div>
    );
  }

  if (isNotFound || !report) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <Card className="max-w-sm w-full p-6 space-y-4 border-border shadow-lg">
          <CardContent className="p-0 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-base font-bold text-foreground">
              {t("reportNotFound")}
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("reportNotFoundDesc")}
            </p>
            <div className="pt-2">
              <Link to="/">
                <Button
                  variant="primary"
                  size="default"
                  className="w-full"
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                >
                  {t("backToHomeBtn")}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate current step index (0 to 5)
  // Step 0: Reported
  // Step 1: AI analyzed
  // Step 2: Kannada voice call placed
  // Step 3: Responder accepted
  // Step 4: On the way / on scene
  // Step 5: Resolved
  const getStepIndex = (status: Status): number => {
    switch (status) {
      case "reported":
        return 0;
      case "ai_analyzed":
        return 1;
      case "call_queued":
      case "call_delivered":
      case "call_failed":
        return 2;
      case "accepted":
        return 3;
      case "en_route":
      case "on_scene":
        return 4;
      case "resolved":
        return 5;
      default:
        return 0;
    }
  };

  const currentStep = getStepIndex(report.status);

  // Call status badge
  const renderCallBadge = () => {
    switch (report.callStatus) {
      case "calling":
        return (
          <Badge variant="info" icon={<Radio className="w-3 h-3 animate-pulse" />}>
            {t("callCalling")}
          </Badge>
        );
      case "delivered":
        return (
          <Badge variant="primary" icon={<Check className="w-3 h-3 stroke-[3]" />}>
            {t("callDelivered")}
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive" icon={<AlertTriangle className="w-3 h-3" />}>
            {t("callFailed")}
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" icon={<Clock className="w-3 h-3" />}>
            {t("callQueued")}
          </Badge>
        );
    }
  };

  const timelineSteps = [
    {
      title: t("stepReported"),
      desc: getAddress(report, language),
      isDone: currentStep >= 0,
      isCurrent: currentStep === 0,
    },
    {
      title: t("stepAiAnalyzed"),
      desc: language === "kn" ? report.aiSummaryKn : report.aiSummaryEn,
      isDone: currentStep >= 1,
      isCurrent: currentStep === 1,
    },
    {
      title: t("stepCallPlaced"),
      badge: renderCallBadge(),
      isDone: currentStep >= 2,
      isCurrent: currentStep === 2,
    },
    {
      title: t("stepAccepted"),
      desc: report.responder
        ? `${report.responder.name} • ETA ~${report.responder.etaMin ?? 5} min`
        : "Awaiting hospital / ambulance response unit",
      isDone: currentStep >= 3,
      isCurrent: currentStep === 3,
    },
    {
      title: t("stepEnRouteProgress"),
      desc: "Emergency lights active • Telemetry synchronized",
      isDone: currentStep >= 4,
      isCurrent: currentStep === 4,
    },
    {
      title: t("stepResolvedProgress"),
      desc: "First aid rendered & scene cleared safely",
      isDone: currentStep >= 5,
      isCurrent: currentStep === 5,
    },
  ];

  return (
    <div className="flex-1 flex flex-col p-4 space-y-4 max-w-lg mx-auto w-full pb-8">
      {/* Top Header Card */}
      <div className="flex items-center justify-between gap-2">
        <Link
          to="/"
          className="p-2 rounded-xl bg-muted/80 hover:bg-muted text-foreground flex items-center gap-1.5 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Home</span>
        </Link>
        <div className="text-right">
          <span className="font-mono text-xs font-bold text-primary px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
            {report.id}
          </span>
        </div>
      </div>

      {/* Mini Incident Map */}
      <Card className="overflow-hidden border-border/80 shadow-md">
        <div className="h-32 w-full relative">
          <LeafletMap
            lat={report.lat}
            lng={report.lng}
            zoom={15}
            markerType="emergency"
            popupText={getAddress(report, language)}
            className="h-32 w-full"
          />
        </div>
        <CardContent className="p-3.5 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-bold text-foreground truncate">
              {getAddress(report, language)}
            </h2>
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              {new Date(report.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-1">
            {language === "kn" ? report.aiSummaryKn : report.aiSummaryEn}
          </p>
        </CardContent>
      </Card>

      {/* Vertical Timeline Card */}
      <Card className="border-border/80 shadow-md">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              {t("statusTimelineTitle")}
            </h3>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <RefreshCw
                className={`w-3 h-3 ${isPolling ? "animate-spin text-primary" : ""}`}
              />
              <span>{t("autoPollingNotice")}</span>
            </span>
          </div>

          {/* Stepper Vertical List */}
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
            {timelineSteps.map((step, idx) => {
              const isPast = step.isDone && !step.isCurrent;
              const isCurrent = step.isCurrent;

              return (
                <div key={idx} className="relative">
                  {/* Step Dot */}
                  <div
                    className={`absolute -left-6 top-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] transition-all ${
                      isPast
                        ? "bg-emerald-500 text-white"
                        : isCurrent
                        ? "bg-primary text-primary-foreground ring-4 ring-primary/30 animate-pulse shadow-md"
                        : "bg-muted text-muted-foreground border border-border"
                    }`}
                  >
                    {isPast ? (
                      <Check className="w-3 h-3 stroke-[3]" />
                    ) : isCurrent ? (
                      <Radio className="w-3 h-3" />
                    ) : (
                      idx + 1
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`text-xs font-bold ${
                          isCurrent
                            ? "text-primary"
                            : isPast
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {step.title}
                      </p>
                      {step.badge}
                    </div>

                    {step.desc && (
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {step.desc}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Responder Card if assigned */}
      {report.responder && (
        <Card className="border-emerald-500/30 bg-emerald-500/5 shadow-xs">
          <CardContent className="p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">
                  {t("assignedResponder")}
                </p>
                <p className="text-xs font-bold text-foreground">
                  {report.responder.name}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg">
                ~{report.responder.etaMin ?? 5} min ETA
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Emergency Hotline Escalation Link */}
      <div className="pt-1">
        <a
          href="tel:112"
          className="w-full min-h-[48px] rounded-2xl bg-destructive hover:bg-red-700 text-destructive-foreground text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors active:scale-98"
        >
          <PhoneCall className="w-4 h-4" />
          <span>Call Emergency 112 for Direct Assistance</span>
        </a>
      </div>
    </div>
  );
};
