import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { AlertTriangle, Radio, Activity, PhoneCall } from "lucide-react";
import { useI18n } from "../../hooks/useI18n";
import { useAppStore } from "../../store/useAppStore";

export const BottomNav: React.FC = () => {
  const { t } = useI18n();
  const location = useLocation();
  const lastSubmittedReport = useAppStore((state) => state.lastSubmittedReport);

  const statusPath = lastSubmittedReport
    ? `/status/${lastSubmittedReport.id}`
    : "/status/NR-2026-1042";

  const navItems = [
    {
      to: "/",
      label: t("navReport"),
      icon: AlertTriangle,
      exact: true,
      isActive: location.pathname === "/" || location.pathname === "/details",
    },
    {
      to: "/live",
      label: t("navLive"),
      icon: Radio,
      exact: false,
      isActive: location.pathname.startsWith("/live"),
    },
    {
      to: statusPath,
      label: t("navStatus"),
      icon: Activity,
      exact: false,
      isActive: location.pathname.startsWith("/status"),
    },
    {
      to: "/helpline",
      label: t("navHelpline"),
      icon: PhoneCall,
      exact: false,
      isActive: location.pathname.startsWith("/helpline"),
    },
  ];

  return (
    <nav
      aria-label="Citizen bottom navigation"
      className="sticky bottom-0 z-40 bg-card/95 backdrop-blur-lg border-t border-border px-2 py-1.5 transition-colors"
      style={{ paddingBottom: "max(0.375rem, env(safe-area-inset-bottom))" }}
    >
      <div className="grid grid-cols-4 items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-200 select-none ${
                active
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              <div
                className={`relative p-1 rounded-xl transition-transform ${
                  active ? "bg-primary/10 scale-110" : ""
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
                {item.to === "/live" && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                )}
              </div>
              <span className="text-[11px] leading-tight mt-0.5 tracking-tight truncate max-w-full">
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
