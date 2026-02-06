"use client"

import * as React from "react"
import {
  subDays,
  subMonths,
  format,
  startOfDay,
  endOfDay,
} from "date-fns"
import { Calendar, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export interface DateRange {
  from: Date
  to: Date
}

export interface DateRangePreset {
  label: string
  range: DateRange
}

export interface DateRangePickerProps {
  /** Current date range */
  value: DateRange | null
  /** Called when the range changes */
  onChange: (range: DateRange) => void
  /** Optional presets (defaults provided if omitted) */
  presets?: DateRangePreset[]
  /** Additional class */
  className?: string
}

/* -------------------------------------------------------------------------- */
/*  Default presets                                                           */
/* -------------------------------------------------------------------------- */

function defaultPresets(): DateRangePreset[] {
  const now = new Date()
  return [
    {
      label: "Last 7 days",
      range: { from: startOfDay(subDays(now, 7)), to: endOfDay(now) },
    },
    {
      label: "Last 30 days",
      range: { from: startOfDay(subDays(now, 30)), to: endOfDay(now) },
    },
    {
      label: "Last 90 days",
      range: { from: startOfDay(subDays(now, 90)), to: endOfDay(now) },
    },
    {
      label: "Last 12 months",
      range: { from: startOfDay(subMonths(now, 12)), to: endOfDay(now) },
    },
  ]
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export function DateRangePicker({
  value,
  onChange,
  presets,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [activePreset, setActivePreset] = React.useState<string | null>(null)
  const [customFrom, setCustomFrom] = React.useState("")
  const [customTo, setCustomTo] = React.useState("")
  const [showCustom, setShowCustom] = React.useState(false)

  const containerRef = React.useRef<HTMLDivElement>(null)
  const resolvedPresets = presets ?? defaultPresets()

  // Close on outside click
  React.useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  // Close on Escape
  React.useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open])

  function selectPreset(preset: DateRangePreset) {
    setActivePreset(preset.label)
    setShowCustom(false)
    onChange(preset.range)
    setOpen(false)
  }

  function handleCustomApply() {
    if (!customFrom || !customTo) return
    const from = startOfDay(new Date(customFrom))
    const to = endOfDay(new Date(customTo))
    if (from > to) return
    setActivePreset("Custom")
    onChange({ from, to })
    setOpen(false)
  }

  // Display label
  const displayLabel = value
    ? activePreset && activePreset !== "Custom"
      ? activePreset
      : `${format(value.from, "MMM d, yyyy")} - ${format(value.to, "MMM d, yyyy")}`
    : "Select date range"

  return (
    <div ref={containerRef} className={cn("relative inline-block", className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-md border border-gray-300 bg-white px-3 text-sm shadow-sm transition-colors",
          "hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1"
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Calendar className="h-4 w-4 text-gray-500" aria-hidden="true" />
        <span className="text-gray-700">{displayLabel}</span>
        <ChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className={cn(
            "absolute right-0 z-50 mt-1 w-72 rounded-md border border-gray-200 bg-white p-3 shadow-lg",
            "animate-in fade-in zoom-in-95 duration-100"
          )}
        >
          {/* Preset buttons */}
          <div className="space-y-1">
            {resolvedPresets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className={cn(
                  "w-full rounded-md px-3 py-2 text-left text-sm transition-colors",
                  activePreset === preset.label
                    ? "bg-indigo-50 font-medium text-indigo-700"
                    : "text-gray-700 hover:bg-gray-100"
                )}
                onClick={() => selectPreset(preset)}
              >
                {preset.label}
              </button>
            ))}

            {/* Custom toggle */}
            <button
              type="button"
              className={cn(
                "w-full rounded-md px-3 py-2 text-left text-sm transition-colors",
                showCustom
                  ? "bg-indigo-50 font-medium text-indigo-700"
                  : "text-gray-700 hover:bg-gray-100"
              )}
              onClick={() => setShowCustom((prev) => !prev)}
            >
              Custom
            </button>
          </div>

          {/* Custom date inputs */}
          {showCustom && (
            <div className="mt-3 border-t border-gray-200 pt-3">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label
                    htmlFor="drp-from"
                    className="mb-1 block text-xs font-medium text-gray-600"
                  >
                    From
                  </label>
                  <input
                    id="drp-from"
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex-1">
                  <label
                    htmlFor="drp-to"
                    className="mb-1 block text-xs font-medium text-gray-600"
                  >
                    To
                  </label>
                  <input
                    id="drp-to"
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleCustomApply}
                disabled={!customFrom || !customTo}
                className={cn(
                  "mt-2 w-full rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition-colors",
                  "hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                  "disabled:cursor-not-allowed disabled:opacity-50"
                )}
              >
                Apply
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
