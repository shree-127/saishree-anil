import React, { useState } from "react";
import {
  PhoneCall,
  ShieldAlert,
  Moon,
  Sun,
  Globe,
  Settings,
  Truck,
  LayoutDashboard,
  ShieldCheck,
  Check,
} from "lucide-react";
import { useI18n } from "../../hooks/useI18n";
import { useAppStore } from "../../store/useAppStore";
import { Link } from "react-router-dom";
import { Sheet } from "../ui/Sheet";
import { Button } from "../ui/Button";

export const TopBar: React.FC = () => {
  const { t, language, toggleLanguage } = useI18n();
  const theme = useAppStore((state) => state.theme);
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-md border-b border-border/80 px-4 py-2.5 transition-colors">
        <div className="flex items-center justify-between gap-2 max-w-full">
          {/* Brand / Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg py-1"
            aria-label="Namma Rakshane Home"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-sans font-bold text-sm tracking-tight text-foreground leading-none">
                  {language === "kn" ? "ನಮ್ಮ ರಕ್ಷಣೆ" : "Namma Rakshane"}
                </h1>
                <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded-full">
                  BLR
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-tight line-clamp-1">
                {t("appTagline")}
              </p>
            </div>
          </Link>

          {/* Right action controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Quick Language Toggle */}
            <button
              onClick={toggleLanguage}
              aria-label="Toggle language between Kannada and English"
              className="h-9 px-2.5 rounded-xl bg-muted/80 hover:bg-muted border border-border text-foreground text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer active:scale-95"
            >
              <Globe className="w-3.5 h-3.5 text-primary" />
              <span>{language === "kn" ? "EN" : "ಕನ್ನಡ"}</span>
            </button>

            {/* Settings Sheet trigger */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              aria-label={t("settingsTitle")}
              className="w-9 h-9 rounded-xl bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Persistent Red 112 SOS Button */}
            <a
              href="tel:112"
              aria-label="Call emergency 112 now"
              className="h-9 px-3 rounded-xl bg-destructive hover:bg-red-700 text-destructive-foreground text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all animate-pulse"
            >
              <PhoneCall className="w-3.5 h-3.5 fill-current" />
              <span>112</span>
            </a>
          </div>
        </div>
      </header>

      {/* Citizen Settings Sheet */}
      <Sheet
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title={t("settingsTitle")}
        description="Namma Rakshane • Bengaluru Public Safety AI Framework"
      >
        <div className="space-y-4 pt-2">
          {/* Dark Mode Row */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/50 border border-border">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-card text-foreground flex items-center justify-center shadow-xs">
                {theme === "dark" ? (
                  <Moon className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-500" />
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">
                  {t("themeLabel")}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {theme === "dark" ? "Dark emergency mode" : "Light mode"}
                </p>
              </div>
            </div>

            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-xl bg-card hover:bg-muted border border-border text-xs font-semibold text-foreground flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>{theme === "dark" ? "Light" : "Dark"}</span>
            </button>
          </div>

          {/* Language Preference Row */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/50 border border-border">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-card text-foreground flex items-center justify-center shadow-xs">
                <Globe className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">
                  {t("languageLabel")}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {language === "kn" ? "ಕನ್ನಡ (ಪ್ರಾಥಮಿಕ)" : "English (Primary)"}
                </p>
              </div>
            </div>

            <button
              onClick={toggleLanguage}
              className="px-3 py-1.5 rounded-xl bg-card hover:bg-muted border border-border text-xs font-bold text-primary transition-colors cursor-pointer"
            >
              {language === "kn" ? "Switch to English" : "ಕನ್ನಡಕ್ಕೆ ಬದಲಿಸಿ"}
            </button>
          </div>

          {/* Role Portal Navigation */}
          <div className="space-y-2 pt-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
              {t("settingsRoleNav")}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/responder"
                onClick={() => setIsSettingsOpen(false)}
                className="p-3 rounded-2xl bg-card hover:bg-muted border border-border flex items-center gap-2.5 text-left transition-colors"
              >
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">
                    {t("responderApp")}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Hospital/Fleet</p>
                </div>
              </Link>

              <Link
                to="/operator"
                onClick={() => setIsSettingsOpen(false)}
                className="p-3 rounded-2xl bg-card hover:bg-muted border border-border flex items-center gap-2.5 text-left transition-colors"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-chart-4 flex items-center justify-center shrink-0">
                  <LayoutDashboard className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">
                    {t("operatorApp")}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Full Desktop</p>
                </div>
              </Link>
            </div>
          </div>

          {/* About Tagline */}
          <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-center space-y-1 mt-2">
            <p className="text-xs font-bold text-foreground">
              ನಮ್ಮ ರಕ್ಷಣೆ • Namma Rakshane
            </p>
            <p className="text-[11px] text-muted-foreground">
              {t("appTagline")}
            </p>
          </div>

          <Button
            variant="outline"
            size="default"
            className="w-full mt-2"
            onClick={() => setIsSettingsOpen(false)}
          >
            {t("dismiss")}
          </Button>
        </div>
      </Sheet>
    </>
  );
};
