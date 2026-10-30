import React from "react";

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = "",
  children,
  ...props
}) => (
  <div
    className={`bg-card text-card-foreground border border-border/80 rounded-2xl shadow-sm overflow-hidden transition-all duration-200 ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = "",
  children,
  ...props
}) => (
  <div className={`p-4 pb-2 space-y-1.5 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className = "",
  children,
  ...props
}) => (
  <h3
    className={`text-base font-bold text-foreground tracking-tight leading-snug ${className}`}
    {...props}
  >
    {children}
  </h3>
);

export const CardDescription: React.FC<
  React.HTMLAttributes<HTMLParagraphElement>
> = ({ className = "", children, ...props }) => (
  <p
    className={`text-xs text-muted-foreground leading-relaxed ${className}`}
    {...props}
  >
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = "",
  children,
  ...props
}) => (
  <div className={`p-4 pt-2 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = "",
  children,
  ...props
}) => (
  <div
    className={`p-4 pt-0 border-t border-border/40 mt-2 flex items-center ${className}`}
    {...props}
  >
    {children}
  </div>
);
