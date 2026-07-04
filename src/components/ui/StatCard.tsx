import { type ReactNode } from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "./Card";

type StatCardProps = {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  trend?: ReactNode;
  progress?: number;
  className?: string;
};

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  progress,
  className,
}: StatCardProps) {
  const normalizedProgress =
    typeof progress === "number" ? Math.max(0, Math.min(100, progress)) : null;

  return (
    <Card padding="md" className={cn("space-y-4", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-container/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        {trend ? (
          <div className="text-sm font-semibold text-primary">{trend}</div>
        ) : null}
      </div>
      <div>
        <p className="text-label-sm font-medium uppercase tracking-wider text-on-surface-variant">
          {label}
        </p>
        <div className="mt-1 font-headline text-headline-md font-bold tabular-nums text-on-surface">
          {value}
        </div>
      </div>
      {normalizedProgress !== null ? (
        <div className="h-2 overflow-hidden rounded-full bg-surface-container-high">
          <div
            className="h-full rounded-full bg-primary-container"
            style={{ width: `${normalizedProgress}%` }}
          />
        </div>
      ) : null}
    </Card>
  );
}
