"use client"

import { useState, useMemo } from "react"
import { Clock, Calendar, Globe, Send } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SchedulePickerProps {
  sendNow: boolean
  scheduledAt: string | null
  timezone: string
  onSendNowChange: (sendNow: boolean) => void
  onScheduledAtChange: (date: string | null) => void
  onTimezoneChange: (tz: string) => void
}

// ---------------------------------------------------------------------------
// Common timezones
// ---------------------------------------------------------------------------

const TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HT)" },
  { value: "UTC", label: "UTC" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Central European (CET)" },
  { value: "Europe/Berlin", label: "Berlin (CET)" },
  { value: "Asia/Tokyo", label: "Japan (JST)" },
  { value: "Asia/Shanghai", label: "China (CST)" },
  { value: "Asia/Kolkata", label: "India (IST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
  { value: "Pacific/Auckland", label: "New Zealand (NZST)" },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SchedulePicker({
  sendNow,
  scheduledAt,
  timezone,
  onSendNowChange,
  onScheduledAtChange,
  onTimezoneChange,
}: SchedulePickerProps) {
  const [dateValue, setDateValue] = useState(() => {
    if (!scheduledAt) return ""
    const d = new Date(scheduledAt)
    return d.toISOString().slice(0, 10)
  })

  const [timeValue, setTimeValue] = useState(() => {
    if (!scheduledAt) return ""
    const d = new Date(scheduledAt)
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
  })

  // Minimum date is today
  const minDate = useMemo(() => {
    return new Date().toISOString().slice(0, 10)
  }, [])

  const handleDateChange = (date: string) => {
    setDateValue(date)
    updateScheduledAt(date, timeValue)
  }

  const handleTimeChange = (time: string) => {
    setTimeValue(time)
    updateScheduledAt(dateValue, time)
  }

  const updateScheduledAt = (date: string, time: string) => {
    if (date && time) {
      const isoString = new Date(`${date}T${time}:00`).toISOString()
      onScheduledAtChange(isoString)
    } else {
      onScheduledAtChange(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Send Now / Schedule radio */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Send Now option */}
        <button
          type="button"
          onClick={() => {
            onSendNowChange(true)
            onScheduledAtChange(null)
          }}
          className={cn(
            "flex items-start gap-4 rounded-xl border-2 p-5 text-left transition-all",
            sendNow
              ? "border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600"
              : "border-gray-200 bg-white hover:border-gray-300"
          )}
        >
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
              sendNow
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-500"
            )}
          >
            <Send className="h-5 w-5" />
          </div>
          <div>
            <p
              className={cn(
                "text-sm font-semibold",
                sendNow ? "text-indigo-900" : "text-gray-900"
              )}
            >
              Send Now
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Start sending the campaign immediately after confirmation.
            </p>
          </div>
        </button>

        {/* Schedule option */}
        <button
          type="button"
          onClick={() => onSendNowChange(false)}
          className={cn(
            "flex items-start gap-4 rounded-xl border-2 p-5 text-left transition-all",
            !sendNow
              ? "border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600"
              : "border-gray-200 bg-white hover:border-gray-300"
          )}
        >
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
              !sendNow
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-500"
            )}
          >
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <p
              className={cn(
                "text-sm font-semibold",
                !sendNow ? "text-indigo-900" : "text-gray-900"
              )}
            >
              Schedule for Later
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Choose a specific date and time to send the campaign.
            </p>
          </div>
        </button>
      </div>

      {/* Date/Time/Timezone pickers (visible only when scheduling) */}
      {!sendNow && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Date picker */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
                <Calendar className="h-4 w-4" />
                Date
              </label>
              <Input
                type="date"
                value={dateValue}
                min={minDate}
                onChange={(e) => handleDateChange(e.target.value)}
              />
            </div>

            {/* Time picker */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
                <Clock className="h-4 w-4" />
                Time
              </label>
              <Input
                type="time"
                value={timeValue}
                onChange={(e) => handleTimeChange(e.target.value)}
              />
            </div>

            {/* Timezone */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
                <Globe className="h-4 w-4" />
                Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => onTimezoneChange(e.target.value)}
                className="flex h-9 w-full appearance-none rounded-md border border-gray-300 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Preview of the scheduled time */}
          {dateValue && timeValue && (
            <div className="mt-4 rounded-md bg-white p-3 text-sm text-gray-700">
              <span className="font-medium">Scheduled:</span>{" "}
              {new Date(`${dateValue}T${timeValue}:00`).toLocaleString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}{" "}
              ({timezone})
            </div>
          )}
        </div>
      )}
    </div>
  )
}
