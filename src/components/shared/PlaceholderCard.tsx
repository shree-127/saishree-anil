import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Clock, Sparkles } from "lucide-react";
import { Button } from "../ui/Button";
import { Card, CardContent } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { useI18n } from "../../hooks/useI18n";

interface PlaceholderCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  badgeText?: string;
}

export const PlaceholderCard: React.FC<PlaceholderCardProps> = ({
  title,
  description,
  icon,
  badgeText,
}) => {
  const { t } = useI18n();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <Card className="max-w-sm w-full p-6 space-y-4 border-border shadow-lg bg-card/90 backdrop-blur-md">
        <CardContent className="p-0 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-inner">
            {icon}
          </div>

          <div className="space-y-1.5">
            <Badge variant="secondary" icon={<Clock className="w-3 h-3" />}>
              {badgeText || t("comingSoonBadge")}
            </Badge>
            <h2 className="text-lg font-bold text-foreground mt-2">{title}</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-muted/60 border border-border text-xs text-muted-foreground text-left space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-foreground text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Coming in the next step (Round 2)</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              {t("comingSoonNotice")}
            </p>
          </div>

          <div className="pt-2">
            <Link to="/">
              <Button
                variant="primary"
                size="default"
                className="w-full"
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                {t("backToReport")}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
