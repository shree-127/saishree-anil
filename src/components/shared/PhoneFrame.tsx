import React from "react";
import { Link, useLocation } from "react-router-dom";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { ShieldAlert, LayoutDashboard, Truck } from "lucide-react";

interface PhoneFrameProps {
  children: React.ReactNode;
  showNav?: boolean;
}

export const PhoneFrame: React.FC<PhoneFrameProps> = ({
  children,
  showNav = true,
}) => {
  const location = useLocation();
  const isOperatorRoute = location.pathname.startsWith("/operator");

  // Operator route can expand to full width on desktop as per instructions
  if (isOperatorRoute) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center lg:py-6 lg:px-4 font-sans selection:bg-emerald-500/20 selection:text-emerald-700">
      {/* Subtle background ambient glows for desktop demo presentation */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-red-600/15 rounded-full blur-3xl" />
      </div>

      {/* Desktop navigation banner for operator & responder links */}
      <aside
        aria-label="Demo role selector"
        className="hidden lg:flex items-center justify-between w-full max-w-[430px] mb-3 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-slate-400 backdrop-blur-md z-30"
      >
        <div className="flex items-center gap-1.5 font-medium text-slate-300">
          <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
          <span>Demo Navigation</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/responder"
            className="hover:text-emerald-400 flex items-center gap-1 transition-colors"
          >
            <Truck className="w-3 h-3" />
            <span>Responder</span>
          </Link>
          <span className="text-slate-700">•</span>
          <Link
            to="/operator"
            className="hover:text-emerald-400 flex items-center gap-1 transition-colors"
          >
            <LayoutDashboard className="w-3 h-3" />
            <span>Operator</span>
          </Link>
        </div>
      </aside>

      {/* Phone container */}
      <main
        className="relative w-full max-w-full sm:max-w-[430px] h-screen sm:h-[844px] bg-background text-foreground flex flex-col overflow-hidden sm:rounded-[2.5rem] sm:border-[8px] sm:border-slate-800 sm:shadow-2xl z-20"
      >
        {/* Phone Speaker & Camera Notch (desktop only) */}
        <div className="hidden sm:flex absolute top-0 left-1/2 -translate-x-1/2 w-36 h-4 bg-slate-800 rounded-b-xl z-50 items-center justify-center pointer-events-none">
          <div className="w-12 h-1 bg-slate-700 rounded-full" />
        </div>

        {/* Top App Bar */}
        <TopBar />

        {/* Scrollable Viewport Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col scroll-smooth">
          {children}
        </div>

        {/* Sticky Bottom Navigation */}
        {showNav && <BottomNav />}
      </main>
    </div>
  );
};
