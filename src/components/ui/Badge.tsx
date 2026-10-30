import React from "react";

export type BadgeVariant =
  | "primary"
  | "destructive"
  | "secondary"
  | "info"
  | "neutral";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "neutral",
  icon,
  className = "",
  ...props
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    primary:
      "bg-primary/15 text-emerald-800 dark:text-emerald-300 border-primary/30",
    destructive:
      "bg-destructive/15 text-red-800 dark:text-red-300 border-destructive/30",
    secondary:
      "bg-secondary/15 text-amber-800 dark:text-amber-300 border-secondary/30",
    info:
      "bg-chart-4/15 text-blue-800 dark:text-blue-300 border-chart-4/30",
    neutral: "bg-muted text-muted-foreground border-border",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap border backdrop-blur-xs ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {icon}
      <span>{children}</span>
    </span>
  );
};
