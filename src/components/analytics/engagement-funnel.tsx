"use client"

import { cn, formatNumber, formatPercentage } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EngagementFunnelProps {
  sent: number
  delivered: number
  opened: number
  clicked: number
  converted: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FUNNEL_COLORS = [
  { bg: "bg-blue-100", bar: "bg-blue-500", text: "text-blue-700" },
  { bg: "bg-cyan-100", bar: "bg-cyan-500", text: "text-cyan-700" },
  { bg: "bg-green-100", bar: "bg-green-500", text: "text-green-700" },
  { bg: "bg-indigo-100", bar: "bg-indigo-500", text: "text-indigo-700" },
  { bg: "bg-violet-100", bar: "bg-violet-500", text: "text-violet-700" },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EngagementFunnel({
  sent,
  delivered,
  opened,
  clicked,
  converted,
}: EngagementFunnelProps) {
  const steps = [
    { label: "Sent", value: sent },
    { label: "Delivered", value: delivered },
    { label: "Opened", value: opened },
    { label: "Clicked", value: clicked },
    { label: "Converted", value: converted },
  ]

  const maxValue = Math.max(sent, 1)

  if (sent === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center text-center">
        <p className="text-sm text-gray-500">No email data available yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {steps.map((step, index) => {
        const widthPct = (step.value / maxValue) * 100
        const rate = sent > 0 ? (step.value / sent) * 100 : 0
        const colors = FUNNEL_COLORS[index]

        return (
          <div key={step.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className={cn("font-medium", colors.text)}>
                {step.label}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">
                  {formatNumber(step.value)}
                </span>
                {index > 0 && (
                  <span className="text-gray-400">
                    ({formatPercentage(rate)})
                  </span>
                )}
              </div>
            </div>
            <div className={cn("h-6 w-full rounded", colors.bg)}>
              <div
                className={cn(
                  "h-6 rounded transition-all duration-500",
                  colors.bar
                )}
                style={{
                  width: `${Math.max(widthPct, 2)}%`,
                  opacity: 0.7 + index * 0.06,
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
