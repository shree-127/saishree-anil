import React, { useEffect } from "react";
import { X } from "lucide-react";

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export const Sheet: React.FC<SheetProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
}) => {
  // Prevent background scrolling when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        className="relative z-10 w-full max-w-lg bg-card text-card-foreground rounded-t-3xl sm:rounded-3xl border border-border shadow-2xl p-6 max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out animate-in slide-in-from-bottom"
      >
        {/* Grab handle for mobile touch feel */}
        <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mb-4 sm:hidden" />

        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 id="sheet-title" className="text-lg font-bold text-foreground">
              {title}
            </h2>
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-full bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-2">{children}</div>
      </div>
    </div>
  );
};
