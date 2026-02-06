"use client"

import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EngagementBadgeProps {
  score: number
  /** Show numeric value alongside label */
  showValue?: boolean
  /** Render as a compact inline badge or a larger gauge */
  variant?: "badge" | "gauge"
  className?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getEngagementLevel(score: number): {
  label: string
  color: string
  bgColor: string
  barColor: string
  ringColor: string
} {
  if (score < 20) {
    return {
      label: "Inactive",
      color: "text-red-700",
      bgColor: "bg-red-50",
      barColor: "bg-red-500",
      ringColor: "ring-red-500/30",
    }
  }
  if (score < 50) {
    return {
      label: "Low",
      color: "text-orange-700",
      bgColor: "bg-orange-50",
      barColor: "bg-orange-500",
      ringColor: "ring-orange-500/30",
    }
  }
  if (score < 70) {
    return {
      label: "Medium",
      color: "text-yellow-700",
      bgColor: "bg-yellow-50",
      barColor: "bg-yellow-500",
      ringColor: "ring-yellow-500/30",
    }
  }
  return {
    label: "High",
    color: "text-green-700",
    bgColor: "bg-green-50",
    barColor: "bg-green-500",
    ringColor: "ring-green-500/30",
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EngagementBadge({
  score,
  showValue = true,
  variant = "badge",
  className,
}: EngagementBadgeProps) {
  const clamped = Math.max(0, Math.min(100, score))
  const { label, color, bgColor, barColor, ringColor } =
    getEngagementLevel(clamped)

  if (variant === "gauge") {
    return (
      <div className={cn("flex flex-col items-center gap-1.5", className)}>
        {/* Circular gauge */}
        <div className="relative h-20 w-20">
          <svg
            className="h-20 w-20 -rotate-90"
            viewBox="0 0 36 36"
            aria-label={`Engagement score: ${clamped}`}
          >
            <path
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="3"
            />
            <path
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              className={barColor.replace("bg-", "stroke-")}
              strokeWidth="3"
              strokeDasharray={`${clamped}, 100`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn("text-lg font-bold", color)}>{clamped}</span>
          </div>
        </div>
        <span className={cn("text-xs font-medium", color)}>{label}</span>
      </div>
    )
  }

  // Default: compact badge with inline bar
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium ring-1",
        bgColor,
        color,
        ringColor,
        className
      )}
      title={`Engagement: ${clamped}/100 (${label})`}
    >
      {showValue && <span className="font-semibold tabular-nums">{clamped}</span>}
      <div className="h-1.5 w-12 overflow-hidden rounded-full bg-gray-200">
        <div
          className={cn("h-full rounded-full transition-all", barColor)}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span>{label}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Inline bar variant (for table cells)
// ---------------------------------------------------------------------------

export function EngagementBar({
  score,
  className,
}: {
  score: number
  className?: string
}) {
  const clamped = Math.max(0, Math.min(100, score))
  const { barColor, label, color } = getEngagementLevel(clamped)

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-2 w-16 overflow-hidden rounded-full bg-gray-200">
        <div
          className={cn("h-full rounded-full transition-all", barColor)}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className={cn("text-xs font-medium tabular-nums", color)}>
        {clamped}
      </span>
      <span className="sr-only">{label}</span>
    </div>
  )
}
