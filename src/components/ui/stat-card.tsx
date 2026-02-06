import * as React from "react"
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface StatCardProps {
  /** Label above the value */
  title: string
  /** The primary metric value */
  value: string | number
  /** Percentage or numeric change */
  change?: number
  /** Description of the change period (e.g., "vs last month") */
  changeLabel?: string
  /** Icon displayed on the card */
  icon?: LucideIcon
  /** Explicit trend direction */
  trend?: "up" | "down" | "neutral"
  /** Additional class */
  className?: string
}

export function StatCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  trend,
  className,
}: StatCardProps) {
  // Derive trend from change if not explicitly provided
  const resolvedTrend =
    trend ?? (change === undefined ? "neutral" : change > 0 ? "up" : change < 0 ? "down" : "neutral")

  const TrendIcon: LucideIcon =
    resolvedTrend === "up"
      ? TrendingUp
      : resolvedTrend === "down"
        ? TrendingDown
        : Minus

  const trendColor =
    resolvedTrend === "up"
      ? "text-green-600"
      : resolvedTrend === "down"
        ? "text-red-600"
        : "text-gray-500"

  return (
    <div
      className={cn(
        "rounded-lg border border-gray-200 bg-white p-6 shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        {Icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50">
            <Icon className="h-5 w-5 text-indigo-600" aria-hidden="true" />
          </div>
        )}
      </div>

      <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
        {value}
      </p>

      {change !== undefined && (
        <div className={cn("mt-2 flex items-center gap-1 text-sm", trendColor)}>
          <TrendIcon className="h-4 w-4" aria-hidden="true" />
          <span className="font-medium">
            {change > 0 ? "+" : ""}
            {typeof change === "number" ? change.toFixed(1) : change}%
          </span>
          {changeLabel && (
            <span className="text-gray-500">{changeLabel}</span>
          )}
        </div>
      )}
    </div>
  )
}
