import React from "react";
import { Loader2 } from "lucide-react";

export type ButtonVariant =
  | "primary"
  | "destructive"
  | "secondary"
  | "outline"
  | "ghost";

export type ButtonSize = "default" | "cta" | "sm" | "icon";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = "",
      variant = "primary",
      size = "default",
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "relative inline-flex items-center justify-center gap-2 font-sans font-medium transition-all duration-200 cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

    const variantStyles: Record<ButtonVariant, string> = {
      primary:
        "bg-primary text-primary-foreground hover:brightness-110 shadow-sm active:bg-emerald-700",
      destructive:
        "bg-destructive text-destructive-foreground hover:brightness-110 shadow-sm active:bg-red-700",
      secondary:
        "bg-secondary text-secondary-foreground hover:brightness-105 shadow-sm active:bg-amber-600",
      outline:
        "border border-border bg-card/70 hover:bg-muted text-foreground active:bg-muted/80 backdrop-blur-xs",
      ghost:
        "bg-transparent hover:bg-muted text-foreground active:bg-muted/60",
    };

    const sizeStyles: Record<ButtonSize, string> = {
      default: "min-h-[48px] px-4 py-2.5 text-sm rounded-xl",
      cta: "min-h-[56px] w-full px-6 py-3.5 text-base font-semibold rounded-2xl shadow-md",
      sm: "min-h-[40px] px-3 py-1.5 text-xs font-medium rounded-lg",
      icon: "w-12 h-12 min-w-[48px] min-h-[48px] p-0 rounded-full flex items-center justify-center",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin text-current" />
        ) : (
          leftIcon
        )}
        <span className="truncate">{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";
