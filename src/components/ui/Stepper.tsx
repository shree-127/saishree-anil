import React from "react";
import { Check, Camera, FileText } from "lucide-react";
import { useI18n } from "../../hooks/useI18n";

interface StepperProps {
  currentStep: 1 | 2;
}

export const Stepper: React.FC<StepperProps> = ({ currentStep }) => {
  const { t } = useI18n();

  return (
    <div className="w-full px-4 py-2.5 bg-card/60 border-b border-border/70 backdrop-blur-md">
      <div className="flex items-center justify-between gap-3">
        {/* Step 1 */}
        <div className="flex items-center gap-2 flex-1">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              currentStep === 1
                ? "bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/30"
                : "bg-emerald-500/20 text-emerald-500 font-semibold"
            }`}
          >
            {currentStep > 1 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Camera className="w-3.5 h-3.5" />}
          </div>
          <div className="text-left">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
              Step 1
            </p>
            <p
              className={`text-xs font-medium truncate ${
                currentStep === 1 ? "text-foreground font-bold" : "text-muted-foreground"
              }`}
            >
              {t("step1")}
            </p>
          </div>
        </div>

        {/* Divider bar */}
        <div className="w-8 h-0.5 bg-border rounded-full overflow-hidden shrink-0">
          <div
            className={`h-full bg-primary transition-all duration-300 ${
              currentStep === 2 ? "w-full" : "w-0"
            }`}
          />
        </div>

        {/* Step 2 */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
              Step 2
            </p>
            <p
              className={`text-xs font-medium truncate ${
                currentStep === 2 ? "text-foreground font-bold" : "text-muted-foreground"
              }`}
            >
              {t("step2")}
            </p>
          </div>
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors shrink-0 ${
              currentStep === 2
                ? "bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/30"
                : "bg-muted text-muted-foreground border border-border"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
};
