import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: {
    text: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
  };
  action?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
    variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  };
  children?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  badge,
  action,
  children,
  className
}: PageHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {badge && (
            <Badge variant={badge.variant || "secondary"}>
              {badge.text}
            </Badge>
          )}
        </div>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>
      
      <div className="flex items-center gap-3">
        {children}
        {action && (
          <Button 
            onClick={action.onClick}
            variant={action.variant || "default"}
            className="gap-2"
          >
            {action.icon}
            {action.label}
          </Button>
        )}
      </div>
    </div>
  );
}
