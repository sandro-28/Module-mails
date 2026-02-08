"use client"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RealTimeCounterProps {
  /** The target value to animate to */
  value: number
  /** Label displayed beneath the number */
  label: string
  /** Icon component */
  icon: React.ComponentType<{ className?: string }>
  /** Duration of animation in milliseconds */
  duration?: number
  /** Number of decimal places */
  decimals?: number
  /** Prefix to display before the number (e.g. "$") */
  prefix?: string
  /** Suffix to display after the number (e.g. "%") */
  suffix?: string
  /** Additional CSS classes for the container */
  className?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RealTimeCounter({
  value,
  label,
  icon: Icon,
  duration = 1500,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
}: RealTimeCounterProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const previousValueRef = useRef(0)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    const startValue = previousValueRef.current
    const endValue = value
    const startTime = performance.now()

    // Easing function (ease-out cubic)
    function easeOutCubic(t: number): number {
      return 1 - Math.pow(1 - t, 3)
    }

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easeOutCubic(progress)

      const current = startValue + (endValue - startValue) * easedProgress
      setDisplayValue(current)

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        setDisplayValue(endValue)
        previousValueRef.current = endValue
      }
    }

    // Cancel any existing animation
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [value, duration])

  const formattedValue = decimals > 0
    ? displayValue.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : Math.round(displayValue).toLocaleString()

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg bg-white p-6",
        className
      )}
    >
      <Icon className="h-8 w-8 text-indigo-500" />
      <div className="mt-3 text-3xl font-bold tabular-nums text-gray-900">
        {prefix}
        {formattedValue}
        {suffix}
      </div>
      <p className="mt-1 text-sm text-gray-500">{label}</p>
    </div>
  )
}
