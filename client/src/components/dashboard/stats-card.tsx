import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    type: "positive" | "negative" | "neutral";
  };
  icon?: LucideIcon;
  iconColor?: string;
  description?: string;
  className?: string;
}

export function StatsCard({
  title,
  value,
  change,
  icon: Icon,
  iconColor = "text-blue-500",
  description,
  className
}: StatsCardProps) {
  return (
    <Card className={cn("hover:shadow-md transition-all duration-200", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && <Icon className={cn("w-5 h-5", iconColor)} />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {change && (
          <div className="flex items-center gap-1 mt-2">
            {change.type === "positive" ? (
              <TrendingUp className="w-3 h-3 text-green-500" />
            ) : change.type === "negative" ? (
              <TrendingDown className="w-3 h-3 text-red-500" />
            ) : (
              <div className="w-3 h-3 rounded-full bg-gray-400" />
            )}
            <span className={cn(
              "text-xs font-medium",
              change.type === "positive" ? "text-green-600" :
              change.type === "negative" ? "text-red-600" : "text-gray-600"
            )}>
              {change.value}
            </span>
            <span className="text-xs text-muted-foreground">from last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
