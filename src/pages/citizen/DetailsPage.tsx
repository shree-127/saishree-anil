import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  CheckCircle2,
  Sparkles,
  Bot,
  AlertTriangle,
  Flame,
  HelpCircle,
  Mic,
  Send,
  Loader2,
  MessageSquare,
  Volume2,
  Clock,
  Check,
  Radio,
  FileText,
  ShieldCheck,
  Edit2,
  ArrowLeft,
} from "lucide-react";
import { useI18n } from "../../hooks/useI18n";
import { useAppStore } from "../../store/useAppStore";
import { analyzePhoto, submitReport } from "../../lib/api";
import { getAddress } from "../../lib/format";
import { Category, Report, YesNoUnsure } from "../../types";
import { Stepper } from "../../components/ui/Stepper";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Sheet } from "../../components/ui/Sheet";

export const DetailsPage: React.FC = () => {
  const { t, language } = useI18n();
  const navigate = useNavigate();

  const draftReport = useAppStore((state) => state.draftReport);
  const updateDraft = useAppStore((state) => state.updateDraft);
  const updateWitness = useAppStore((state) => state.updateWitness);
  const setLastSubmittedReport = useAppStore(
    (state) => state.setLastSubmittedReport
  );
  const resetDraft = useAppStore((state) => state.resetDraft);

  // Flow states
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReport, setSubmittedReport] = useState<Report | null>(null);

  // Address editing sheet
  const [isAddressSheetOpen, setIsAddressSheetOpen] = useState(false);
  const [editedAddress, setEditedAddress] = useState(
    getAddress(draftReport, language) || ""
  );

  // Witness questions bottom sheet
  const [isWitnessSheetOpen, setIsWitnessSheetOpen] = useState(false);
  const [voiceNoteRecorded, setVoiceNoteRecorded] = useState(false);
  const [recordingAudio, setRecordingAudio] = useState(false);

  // Trigger Vision AI analysis on mount
  useEffect(() => {
    let isMounted = true;

    async function runAnalysis() {
      setIsAnalyzing(true);
      setAnalysisError(null);

      try {
        const photo = draftReport.photoDataUrl || "";
        const location =
          draftReport.lat && draftReport.lng
            ? { lat: draftReport.lat, lng: draftReport.lng }
            : undefined;

        const result = await analyzePhoto(photo, location);

        if (isMounted) {
          updateDraft({
            category: result.category,
            aiConfidence: result.confidence,
            aiSummaryEn: result.summaryEn,
            aiSummaryKn: result.summaryKn,
            needsReview: result.needsReview,
          });
          setIsAnalyzing(false);
        }
      } catch (err) {
        console.warn("AI analysis fallback:", err);
        if (isMounted) {
          updateDraft({
            category: "road_accident",
            aiConfidence: "medium",
            aiSummaryEn: "Traffic incident detected from image frame.",
            aiSummaryKn: "ಚಿತ್ರದ ಮೂಲಕ ಪತ್ತೆಯಾದ ರಸ್ತೆ ಸಂಚಾರ ಘಟನೆ.",
            needsReview: true,
          });
          setIsAnalyzing(false);
        }
      }
    }

    runAnalysis();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCategorySelect = (cat: Category) => {
    updateDraft({
      category: cat,
      needsReview: cat === "not_sure",
    });
  };

  const handleWitnessAnswer = (field: "bleeding" | "conscious" | "trapped", val: YesNoUnsure) => {
    updateWitness({ [field]: val });
  };

  const handleVoiceNoteToggle = () => {
    if (voiceNoteRecorded) {
      setVoiceNoteRecorded(false);
      return;
    }
    setRecordingAudio(true);
    setTimeout(() => {
      setRecordingAudio(false);
      setVoiceNoteRecorded(true);
      updateWitness({ note: (draftReport.witness.note || "") + " [Voice memo attached (10s)]" });
    }, 1500);
  };

  const handleSaveAddress = () => {
    if (editedAddress.trim()) {
      updateDraft({
        address: editedAddress.trim(),
        addressKn: editedAddress.trim(),
      });
    }
    setIsAddressSheetOpen(false);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const report = await submitReport(draftReport);
      setSubmittedReport(report);
      setLastSubmittedReport(report);
      setIsSubmitting(false);
    } catch (err) {
      console.error("Submit error:", err);
      setIsSubmitting(false);
    }
  };

  const currentCategory = draftReport.category || "road_accident";
  const confidence = draftReport.aiConfidence || "high";

  // Category chip metadata
  const categoriesList: Array<{
    id: Category;
    label: string;
    icon: React.ReactNode;
    color: string;
  }> = [
    {
      id: "road_accident",
      label: t("catRoadAccident"),
      icon: <AlertTriangle className="w-4 h-4" />,
      color: "destructive",
    },
    {
      id: "fire",
      label: t("catFire"),
      icon: <Flame className="w-4 h-4" />,
      color: "destructive",
    },
    {
      id: "not_sure",
      label: t("catNotSure"),
      icon: <HelpCircle className="w-4 h-4" />,
      color: "secondary",
    },
  ];

  return (
    <div className="flex-1 flex flex-col pb-8">
      {/* 2-Step Stepper */}
      <Stepper currentStep={2} />

      <div className="p-4 space-y-4 max-w-lg mx-auto w-full">
        {/* Navigation & Thumbnail summary bar */}
        <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-card border border-border shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            {draftReport.photoDataUrl ? (
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-border relative">
                <img
                  src={draftReport.photoDataUrl}
                  alt="Incident frame"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-0 inset-x-0 bg-emerald-600/90 text-white text-[8px] text-center font-bold py-0.5">
                  LIVE
                </span>
              </div>
            ) : (
              <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center shrink-0 border border-border">
                <FileText className="w-6 h-6 text-muted-foreground" />
              </div>
            )}

            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="truncate">
                  {getAddress(draftReport, language) ||
                    (language === "kn" ? "ಬೆಂಗಳೂರು, ಕರ್ನಾಟಕ" : "Bengaluru, Karnataka")}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground truncate">
                {draftReport.anonymous ? "🕶️ " + t("anonymousLabel") : "Identified Citizen"}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setEditedAddress(getAddress(draftReport, language) || "");
              setIsAddressSheetOpen(true);
            }}
            aria-label="Edit address"
            className="p-2 rounded-xl bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 border border-border transition-colors cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* AI Analysis State / Card */}
        {isAnalyzing ? (
          <Card className="border-border/80 shadow-md">
            <CardContent className="p-6 text-center space-y-4">
              <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md">
                  <Bot className="w-7 h-7 animate-pulse" />
                </div>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-foreground">
                  {t("analyzingWithAi")}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
                  {t("analyzingSub")}
                </p>
              </div>

              {/* Shimmer progress steps */}
              <div className="space-y-2 pt-2 text-left max-w-xs mx-auto">
                <div className="flex items-center gap-2 text-xs text-foreground font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-800 dark:text-emerald-400" />
                  <span>Visual hazard feature extraction</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-foreground font-medium animate-pulse">
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  <span>Checking Bengaluru duplicate registry...</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* AI Result Card */
          <Card className="border-border/80 shadow-md">
            <CardContent className="p-4 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground leading-none">
                      {t("aiCardTitle")}
                    </h3>
                    <span className="text-[10px] text-muted-foreground">
                      Vision Classifier v2.4 (FastAPI Mock)
                    </span>
                  </div>
                </div>

                <Badge
                  variant={
                    confidence === "high"
                      ? "primary"
                      : confidence === "medium"
                      ? "secondary"
                      : "neutral"
                  }
                >
                  {confidence === "high"
                    ? t("confidenceHigh")
                    : confidence === "medium"
                    ? t("confidenceMedium")
                    : t("confidenceLow")}
                </Badge>
              </div>

              {/* AI Summary Banner */}
              <div className="p-3 rounded-xl bg-muted/60 border border-border/80 space-y-1">
                <p className="text-xs font-semibold text-foreground leading-relaxed">
                  {language === "kn"
                    ? draftReport.aiSummaryKn || draftReport.aiSummaryEn
                    : draftReport.aiSummaryEn || draftReport.aiSummaryKn}
                </p>
                <p className="text-[10px] text-muted-foreground italic">
                  * {t("aiDisclaimer")}
                </p>
              </div>

              {/* Category Override Selection Chips */}
              <div className="space-y-2 pt-1">
                <p className="text-xs font-bold text-foreground">
                  {t("overrideCategoryNotice")}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {categoriesList.map((cat) => {
                    const isSelected = currentCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleCategorySelect(cat.id)}
                        className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          isSelected
                            ? cat.color === "destructive"
                              ? "bg-red-500/15 border-red-500 text-red-700 dark:text-red-300 ring-2 ring-red-500/30"
                              : "bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/30"
                            : "bg-muted/40 border-border text-foreground hover:bg-muted"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          {cat.icon}
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <span className="text-xs font-bold leading-tight">
                          {cat.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {currentCategory === "not_sure" && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                    ⚠️ {t("needsHumanReview")}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 3. Optional Witness Questions (Chat / Sheet trigger) */}
        <Card className="border-border/80 shadow-md">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-400 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    {t("witnessHeader")}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    {t("witnessSub")}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsWitnessSheetOpen(true)}
                className="text-xs font-semibold text-primary hover:underline cursor-pointer"
              >
                Expand
              </button>
            </div>

            {/* Quick 3 Inline Pills */}
            <div className="space-y-2.5 pt-1">
              {/* Question 1: Bleeding */}
              <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-muted/40 border border-border/60">
                <span className="text-xs font-medium text-foreground">
                  {t("bleedingQ")}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  {(["yes", "no", "unsure"] as YesNoUnsure[]).map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleWitnessAnswer("bleeding", val)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                        draftReport.witness.bleeding === val
                          ? val === "yes"
                            ? "bg-red-500 text-white"
                            : "bg-primary text-white"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {val === "yes" ? t("yes") : val === "no" ? t("no") : t("unsure")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 2: Conscious */}
              <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-muted/40 border border-border/60">
                <span className="text-xs font-medium text-foreground">
                  {t("consciousQ")}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  {(["yes", "no", "unsure"] as YesNoUnsure[]).map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleWitnessAnswer("conscious", val)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                        draftReport.witness.conscious === val
                          ? val === "yes"
                            ? "bg-primary text-white"
                            : "bg-amber-600 text-white"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {val === "yes" ? t("yes") : val === "no" ? t("no") : t("unsure")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 3: Trapped / Fire */}
              <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-muted/40 border border-border/60">
                <span className="text-xs font-medium text-foreground">
                  {t("trappedQ")}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  {(["yes", "no", "unsure"] as YesNoUnsure[]).map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleWitnessAnswer("trapped", val)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                        draftReport.witness.trapped === val
                          ? val === "yes"
                            ? "bg-red-500 text-white"
                            : "bg-primary text-white"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {val === "yes" ? t("yes") : val === "no" ? t("no") : t("unsure")}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Note & Voice Memo */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={draftReport.witness.note || ""}
                onChange={(e) => updateWitness({ note: e.target.value })}
                placeholder={t("notePlaceholder")}
                className="flex-1 px-3 py-2 rounded-xl bg-muted/60 border border-border text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="button"
                onClick={handleVoiceNoteToggle}
                aria-label={t("voiceNoteBtn")}
                className={`p-2.5 rounded-xl border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                  voiceNoteRecorded
                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-800 dark:text-emerald-400"
                    : recordingAudio
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground border-border"
                }`}
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>

            {voiceNoteRecorded && (
              <p className="text-[11px] text-emerald-800 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-800 dark:text-emerald-400" />
                {t("voiceNoteActive")}
              </p>
            )}
          </CardContent>
        </Card>

        {/* 4. Primary CTA: Send Report */}
        <div className="pt-2">
          <Button
            variant="destructive"
            size="cta"
            disabled={isAnalyzing || isSubmitting}
            isLoading={isSubmitting}
            onClick={handleSubmit}
            rightIcon={<Send className="w-5 h-5 fill-current" />}
          >
            {isSubmitting ? t("submitting") : t("submitReport")}
          </Button>
        </div>
      </div>

      {/* Edit Address Bottom Sheet */}
      <Sheet
        isOpen={isAddressSheetOpen}
        onClose={() => setIsAddressSheetOpen(false)}
        title={t("locationEditAddress")}
        description="Provide a recognizable landmark to assist emergency services."
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

      {/* Expanded Witness Questions Sheet */}
      <Sheet
        isOpen={isWitnessSheetOpen}
        onClose={() => setIsWitnessSheetOpen(false)}
        title={t("witnessHeader")}
        description={t("witnessSub")}
      >
        <div className="space-y-4 pt-1">
          {/* Question 1 */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-foreground">{t("bleedingQ")}</p>
            <div className="grid grid-cols-3 gap-2">
              {(["yes", "no", "unsure"] as YesNoUnsure[]).map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleWitnessAnswer("bleeding", val)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    draftReport.witness.bleeding === val
                      ? "bg-red-500 text-white border-red-500"
                      : "bg-muted/60 text-foreground border-border hover:bg-muted"
                  }`}
                >
                  {val === "yes" ? t("yes") : val === "no" ? t("no") : t("unsure")}
                </button>
              ))}
            </div>
          </div>

          {/* Question 2 */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-foreground">{t("consciousQ")}</p>
            <div className="grid grid-cols-3 gap-2">
              {(["yes", "no", "unsure"] as YesNoUnsure[]).map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleWitnessAnswer("conscious", val)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    draftReport.witness.conscious === val
                      ? "bg-primary text-white border-primary"
                      : "bg-muted/60 text-foreground border-border hover:bg-muted"
                  }`}
                >
                  {val === "yes" ? t("yes") : val === "no" ? t("no") : t("unsure")}
                </button>
              ))}
            </div>
          </div>

          {/* Question 3 */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-foreground">{t("trappedQ")}</p>
            <div className="grid grid-cols-3 gap-2">
              {(["yes", "no", "unsure"] as YesNoUnsure[]).map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleWitnessAnswer("trapped", val)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    draftReport.witness.trapped === val
                      ? "bg-red-500 text-white border-red-500"
                      : "bg-muted/60 text-foreground border-border hover:bg-muted"
                  }`}
                >
                  {val === "yes" ? t("yes") : val === "no" ? t("no") : t("unsure")}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="outline"
              size="default"
              onClick={() => setIsWitnessSheetOpen(false)}
              className="w-full"
            >
              Done
            </Button>
          </div>
        </div>
      </Sheet>

      {/* Submission Success & Duplicate Notice Modal */}
      {submittedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-card text-card-foreground rounded-3xl border border-border p-5 shadow-2xl space-y-4 animate-in zoom-in-95">
            {/* Header Icon */}
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div className="text-center space-y-1">
              <h2 className="text-base font-bold text-foreground">
                {t("successTitle")}
              </h2>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted border border-border font-mono text-xs font-bold text-primary">
                <span>{submittedReport.id}</span>
              </div>
            </div>

            {/* Duplicate Notice if triggered */}
            {submittedReport.isDuplicate && (
              <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  {t("duplicateDetectedTitle")}
                </p>
                <p className="text-[11px] leading-relaxed">
                  {t("duplicateDetectedMsg")}
                </p>
              </div>
            )}

            {/* Live Response Timeline Preview */}
            <div className="p-3 rounded-2xl bg-muted/50 border border-border space-y-2">
              <p className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                {t("timelineTitle")}
              </p>
              <div className="space-y-2 text-xs">
                {/* Step 1 */}
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>{t("timelineStep1")}</span>
                </div>
                {/* Step 2 */}
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>{t("timelineStep2")}</span>
                </div>
                {/* Step 3 */}
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">
                    <Volume2 className="w-3 h-3" />
                  </div>
                  <span>{t("timelineStep3")}</span>
                </div>
                {/* Step 4 */}
                <div className="flex items-center gap-2 text-muted-foreground font-medium">
                  <div className="w-5 h-5 rounded-full bg-muted border border-border text-muted-foreground flex items-center justify-center text-[10px]">
                    <Clock className="w-3 h-3" />
                  </div>
                  <span>{t("timelineStep4")}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <Button
                variant="primary"
                size="default"
                className="w-full"
                onClick={() => {
                  navigate(`/status/${submittedReport.id}`);
                }}
              >
                {t("trackReportBtn")}
              </Button>
              <Button
                variant="outline"
                size="default"
                className="w-full"
                onClick={() => {
                  resetDraft();
                  navigate("/");
                }}
              >
                {t("backToHomeBtn")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
