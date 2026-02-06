"use client"

import {
  UserPlus,
  UserMinus,
  Send,
  Upload,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ActivityType =
  | "new_contact"
  | "unsubscribe"
  | "campaign_sent"
  | "import_completed"
  | "bounce"

export interface Activity {
  id: string
  type: ActivityType
  description: string
  timestamp: string | Date
  meta?: Record<string, string | number>
}

interface ActivityFeedProps {
  activities: Activity[]
  className?: string
}

// ---------------------------------------------------------------------------
// Visual config per activity type
// ---------------------------------------------------------------------------

const ACTIVITY_CONFIG: Record<
  ActivityType,
  { icon: LucideIcon; iconColor: string; bgColor: string }
> = {
  new_contact: {
    icon: UserPlus,
    iconColor: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
  unsubscribe: {
    icon: UserMinus,
    iconColor: "text-orange-600",
    bgColor: "bg-orange-50",
  },
  campaign_sent: {
    icon: Send,
    iconColor: "text-indigo-600",
    bgColor: "bg-indigo-50",
  },
  import_completed: {
    icon: Upload,
    iconColor: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  bounce: {
    icon: AlertTriangle,
    iconColor: "text-red-600",
    bgColor: "bg-red-50",
  },
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ActivityFeed({ activities, className }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div
        className={cn(
          "rounded-xl border border-gray-200 bg-white p-6 text-center",
          className
        )}
      >
        <p className="text-sm text-gray-500">No recent activity.</p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200 bg-white shadow-sm",
        className
      )}
    >
      <div className="border-b border-gray-100 px-5 py-4">
        <h2 className="text-sm font-semibold text-gray-900">
          Recent Activity
        </h2>
      </div>

      <ul className="divide-y divide-gray-100">
        {activities.map((activity) => {
          const config = ACTIVITY_CONFIG[activity.type]
          const Icon = config.icon
          const relativeTime = formatDistanceToNow(
            new Date(activity.timestamp),
            { addSuffix: true }
          )

          return (
            <li key={activity.id} className="flex items-start gap-3 px-5 py-3">
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  config.bgColor
                )}
              >
                <Icon className={cn("h-4 w-4", config.iconColor)} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-700">{activity.description}</p>
                <p className="mt-0.5 text-xs text-gray-400">{relativeTime}</p>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
