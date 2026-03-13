import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface LegendItem {
  label: string;
  color: string;
}

interface LegendPillsProps {
  items: LegendItem[];
  className?: string;
}

export function LegendPills({ items, className }: LegendPillsProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {items.map((item) => (
        <span
          key={`${item.label}-${item.color}`}
          className="inline-flex min-w-0 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300"
        >
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
          <span className="truncate">{item.label}</span>
        </span>
      ))}
    </div>
  );
}

interface MetricCardProps {
  icon?: ReactNode;
  label: string;
  value: string;
  detail?: string;
  secondaryDetail?: string;
  badge?: ReactNode;
  emphasis?: "default" | "accent" | "warning";
  className?: string;
}

export function MetricCard({
  icon,
  label,
  value,
  detail,
  secondaryDetail,
  badge,
  emphasis = "default",
  className,
}: MetricCardProps) {
  return (
    <Card
      className={cn(
        "panel-card h-full border-slate-200/80 py-0 dark:border-slate-800",
        emphasis === "accent" &&
          "border-emerald-200/80 bg-gradient-to-br from-white to-emerald-50/70 dark:border-emerald-900/60 dark:from-slate-900 dark:to-emerald-950/20",
        emphasis === "warning" &&
          "border-amber-200/90 bg-gradient-to-br from-white to-amber-50/80 dark:border-amber-900/50 dark:from-slate-900 dark:to-amber-950/25",
        className,
      )}
    >
      <CardContent className="flex h-full min-w-0 flex-col gap-4 p-5 sm:p-6">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
              {icon ? <span className="shrink-0 text-slate-500 dark:text-slate-300">{icon}</span> : null}
              <span className="truncate">{label}</span>
            </div>
            <p className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-50 sm:text-[2rem]">
              {value}
            </p>
          </div>
          {badge ? <div className="shrink-0">{badge}</div> : null}
        </div>
        {detail ? <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">{detail}</p> : null}
        {secondaryDetail ? (
          <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">{secondaryDetail}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

interface ChartCardProps {
  title: string;
  description?: string;
  legend?: LegendItem[];
  action?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function ChartCard({
  title,
  description,
  legend,
  action,
  children,
  footer,
  className,
  contentClassName,
}: ChartCardProps) {
  return (
    <Card className={cn("panel-card py-0", className)}>
      <CardHeader className="gap-4 border-b border-slate-200/70 pb-5 dark:border-slate-800/80">
        <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-2">
            <CardTitle className="text-lg font-semibold text-slate-950 dark:text-slate-50">{title}</CardTitle>
            {description ? (
              <CardDescription className="copy-measure text-sm leading-6 text-slate-600 dark:text-slate-400">
                {description}
              </CardDescription>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
        {legend?.length ? <LegendPills items={legend} /> : null}
      </CardHeader>
      <CardContent className={cn("space-y-4 p-5 sm:p-6", contentClassName)}>{children}</CardContent>
      {footer ? (
        <div className="border-t border-slate-200/70 px-5 py-4 text-sm text-slate-500 dark:border-slate-800/80 dark:text-slate-400 sm:px-6">
          {footer}
        </div>
      ) : null}
    </Card>
  );
}

interface ChartFrameProps {
  children: ReactNode;
  className?: string;
}

export function ChartFrame({ children, className }: ChartFrameProps) {
  return (
    <div
      className={cn(
        "soft-surface h-[18rem] min-w-0 overflow-hidden p-2 sm:h-[20rem] sm:p-3 lg:h-[22rem]",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface SectionBannerProps {
  eyebrow?: string;
  title: string;
  description: string;
  badge?: ReactNode;
  className?: string;
}

export function SectionBanner({
  eyebrow,
  title,
  description,
  badge,
  className,
}: SectionBannerProps) {
  return (
    <Card className={cn("panel-card py-0", className)}>
      <CardContent className="flex min-w-0 flex-col gap-4 p-5 sm:p-6">
        <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 space-y-2">
            {eyebrow ? <p className="section-eyebrow">{eyebrow}</p> : null}
            <h2 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">{title}</h2>
            <p className="copy-measure text-sm leading-6 text-slate-600 dark:text-slate-400">{description}</p>
          </div>
          {badge ? <div className="shrink-0">{badge}</div> : null}
        </div>
      </CardContent>
    </Card>
  );
}

interface DetailPillProps {
  label: string;
  value: string;
  className?: string;
}

export function DetailPill({ label, value, className }: DetailPillProps) {
  return (
    <div
      className={cn(
        "inline-flex min-w-0 max-w-full items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300",
        className,
      )}
    >
      <span className="font-medium text-slate-500 dark:text-slate-400">{label}</span>
      <span className="truncate">{value}</span>
    </div>
  );
}

export function SourceBadge({ source }: { source: "ml" | "dmi" }) {
  return <Badge variant={source === "ml" ? "default" : "secondary"}>{source === "ml" ? "ML" : "DMI"}</Badge>;
}
