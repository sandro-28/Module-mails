"use client"

import { QuickActions } from "@/components/dashboard/quick-actions"
import { ActivityFeed, type Activity } from "@/components/dashboard/activity-feed"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DashboardOverviewClientProps {
  activities: Activity[]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DashboardOverviewClient({
  activities,
}: DashboardOverviewClientProps) {
  return (
    <div className="space-y-6">
      {/* Quick actions */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-900">
          Quick Actions
        </h2>
        <QuickActions />
      </div>

      {/* Activity feed */}
      <ActivityFeed activities={activities} />
    </div>
  )
}
