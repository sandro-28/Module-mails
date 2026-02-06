"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DeliverabilityGaugeProps {
  /** Score from 0-100 */
  score: number
  /** Size of the gauge in pixels */
  size?: number
}

// ---------------------------------------------------------------------------
// Score label and color helpers
// ---------------------------------------------------------------------------

function getScoreLabel(score: number): string {
  if (score >= 90) return "Excellent"
  if (score >= 70) return "Good"
  if (score >= 40) return "Fair"
  return "Poor"
}

function getScoreColor(score: number): string {
  if (score >= 70) return "#10b981" // green
  if (score >= 40) return "#f59e0b" // orange
  return "#ef4444" // red
}

function getScoreTextClass(score: number): string {
  if (score >= 70) return "text-green-600"
  if (score >= 40) return "text-amber-600"
  return "text-red-600"
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DeliverabilityGauge({
  score,
  size = 220,
}: DeliverabilityGaugeProps) {
  const clampedScore = Math.max(0, Math.min(100, score))

  // SVG arc calculations
  const centerX = size / 2
  const centerY = size / 2 + 10
  const radius = size / 2 - 20
  const strokeWidth = 16

  // We draw a semicircle from 180deg (left) to 0deg (right)
  const startAngle = Math.PI // left side
  const totalArc = Math.PI // 180 degrees

  // Score angle position
  const scoreAngle = startAngle - (clampedScore / 100) * totalArc

  // Arc path helper
  function describeArc(
    cx: number,
    cy: number,
    r: number,
    startA: number,
    endA: number
  ): string {
    const x1 = cx + r * Math.cos(startA)
    const y1 = cy - r * Math.sin(startA)
    const x2 = cx + r * Math.cos(endA)
    const y2 = cy - r * Math.sin(endA)
    const sweep = startA > endA ? 0 : 1
    const largeArc = Math.abs(startA - endA) > Math.PI ? 1 : 0
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} ${sweep} ${x2} ${y2}`
  }

  // Color zone backgrounds
  const zones = useMemo(() => {
    const endAngle = 0
    return [
      {
        start: startAngle,
        end: startAngle - (40 / 100) * totalArc,
        color: "#fee2e2", // red zone 0-40
      },
      {
        start: startAngle - (40 / 100) * totalArc,
        end: startAngle - (70 / 100) * totalArc,
        color: "#fef3c7", // orange zone 40-70
      },
      {
        start: startAngle - (70 / 100) * totalArc,
        end: endAngle,
        color: "#d1fae5", // green zone 70-100
      },
    ]
  }, [startAngle, totalArc])

  // Needle position
  const needleLength = radius - 8
  const needleX = centerX + needleLength * Math.cos(scoreAngle)
  const needleY = centerY - needleLength * Math.sin(scoreAngle)

  const scoreColor = getScoreColor(clampedScore)

  return (
    <div className="flex flex-col items-center">
      <svg
        width={size}
        height={size / 2 + 40}
        viewBox={`0 0 ${size} ${size / 2 + 40}`}
        className="overflow-visible"
      >
        {/* Background zone arcs */}
        {zones.map((zone, idx) => (
          <path
            key={idx}
            d={describeArc(centerX, centerY, radius, zone.start, zone.end)}
            fill="none"
            stroke={zone.color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        ))}

        {/* Active arc (score progress) */}
        {clampedScore > 0 && (
          <path
            d={describeArc(centerX, centerY, radius, startAngle, scoreAngle)}
            fill="none"
            stroke={scoreColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        )}

        {/* Needle */}
        <line
          x1={centerX}
          y1={centerY}
          x2={needleX}
          y2={needleY}
          stroke={scoreColor}
          strokeWidth={3}
          strokeLinecap="round"
        />

        {/* Needle center dot */}
        <circle cx={centerX} cy={centerY} r={6} fill={scoreColor} />
        <circle cx={centerX} cy={centerY} r={3} fill="white" />

        {/* Scale labels */}
        <text
          x={centerX - radius - 5}
          y={centerY + 20}
          textAnchor="middle"
          fill="#9ca3af"
          fontSize="11"
        >
          0
        </text>
        <text
          x={centerX + radius + 5}
          y={centerY + 20}
          textAnchor="middle"
          fill="#9ca3af"
          fontSize="11"
        >
          100
        </text>
        <text
          x={centerX}
          y={centerY - radius - 5}
          textAnchor="middle"
          fill="#9ca3af"
          fontSize="11"
        >
          50
        </text>
      </svg>

      {/* Score display */}
      <div className="-mt-2 text-center">
        <div className={cn("text-4xl font-bold", getScoreTextClass(clampedScore))}>
          {clampedScore}
        </div>
        <div
          className={cn(
            "mt-1 text-sm font-medium",
            getScoreTextClass(clampedScore)
          )}
        >
          {getScoreLabel(clampedScore)}
        </div>
      </div>
    </div>
  )
}
