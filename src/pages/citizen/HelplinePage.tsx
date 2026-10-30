import React from "react";
import { useNavigate } from "react-router-dom";
import {
  PhoneCall,
  ShieldCheck,
  Heart,
  LogOut,
  Info,
  Shield,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { useI18n } from "../../hooks/useI18n";
import { Card, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

/**
 * NOTE: These emergency helpline numbers (181, 112, 1091) must be officially
 * verified with Bengaluru City Police and Karnataka Women Development Corporation
 * before public production launch in Bengaluru.
 */
export const HelplinePage: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();

  // Instant quick exit to neutral home route for user safety & privacy
  const handleQuickExit = () => {
    navigate("/");
  };

  const helplineCards = [
    {
      number: "181",
      title: t("womenHelpline181"),
      desc: t("womenHelplineDesc"),
      icon: Heart,
      badge: "24x7 Toll-Free",
    },
    {
      number: "1091",
      title: t("womenPolice1091"),
      desc: t("womenPolice1091Desc"),
      icon: Shield,
      badge: "Police Women Cell",
    },
    {
      number: "112",
      title: t("police112"),
      desc: t("police112Desc"),
      icon: ShieldCheck,
      badge: "Immediate Dispatch",
    },
  ];

  const safetyGuidelines = [
    t("safetyTip1"),
    t("safetyTip2"),
    t("safetyTip3"),
    t("safetyTip4"),
  ];

  return (
    <div className="flex-1 flex flex-col p-4 space-y-4 max-w-lg mx-auto w-full pb-8">
      {/* Top Header with Quick Exit */}
      <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-accent border border-primary/20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/20 text-accent-foreground flex items-center justify-center">
            <Heart className="w-4 h-4 fill-current" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-accent-foreground leading-tight">
              {t("helplineCalmTitle")}
            </h2>
            <p className="text-[10px] text-accent-foreground/80">
              Confidential & Trauma-Informed Support
            </p>
          </div>
        </div>

        {/* Quick Exit Button (instant escape to home) */}
        <button
          onClick={handleQuickExit}
          aria-label={t("quickExit")}
          className="h-8 px-3 rounded-xl bg-card hover:bg-muted text-foreground border border-border text-xs font-bold flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer shrink-0"
        >
          <LogOut className="w-3.5 h-3.5 text-primary" />
          <span>{t("quickExit")}</span>
        </button>
      </div>

      {/* Supportive Banner */}
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground leading-relaxed">
          {t("helplineCalmSubtitle")}
        </p>
      </div>

      {/* Large Tap-to-Call Cards (Calm emerald/primary styling, NOT red) */}
      <div className="space-y-3">
        {helplineCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.number}
              className="border-primary/20 bg-card hover:border-primary/40 transition-all shadow-sm"
            >
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-foreground">
                        {card.number}
                      </span>
                      <span className="text-[10px] font-semibold bg-primary/15 text-primary border border-primary/25 px-2 py-0.2 rounded-full">
                        {card.badge}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-foreground truncate">
                      {card.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">
                      {card.desc}
                    </p>
                  </div>
                </div>

                <a
                  href={`tel:${card.number}`}
                  aria-label={`Call ${card.title} on ${card.number}`}
                  className="min-h-[44px] px-4 rounded-xl bg-primary hover:brightness-110 text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all shrink-0 cursor-pointer"
                >
                  <PhoneCall className="w-3.5 h-3.5 fill-current" />
                  <span>Call</span>
                </a>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* "You Are Not Alone / What To Do" Supportive Protocol */}
      <Card className="border-border shadow-xs bg-muted/30">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">
              {t("youAreNotAlone")}
            </h3>
          </div>

          <div className="space-y-2">
            {safetyGuidelines.map((tip, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <span className="text-muted-foreground leading-relaxed">
                  {tip}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-border/60 flex items-center gap-2 text-[11px] text-muted-foreground">
            <Lock className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>
              Your browser does not store camera photos or witness notes in local storage.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
