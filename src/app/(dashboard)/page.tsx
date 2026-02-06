import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { formatNumber, formatPercentage, calculateRate } from "@/lib/utils"
import { DashboardOverviewClient } from "@/components/dashboard/dashboard-overview-client"
import type { Activity } from "@/components/dashboard/activity-feed"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OverviewStats {
  totalContacts: number
  emailsThisMonth: number
  openRate: number
  clickRate: number
  bounceRate: number
  unsubscribeRate: number
}

interface RecentCampaign {
  id: string
  name: string
  status: "draft" | "scheduled" | "sending" | "sent" | "paused"
  sending_completed_at: string | null
  scheduled_at: string | null
  stats: Record<string, unknown>
}

interface ActiveAutomation {
  id: string
  name: string
  status: "active" | "paused" | "draft"
  total_enrolled: number
  total_completed: number
  created_at: string
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function getOverviewData() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  // Get organization for this user
  const { data: membershipRow } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .single()

  const orgId = membershipRow?.organization_id

  if (!orgId) {
    return {
      stats: {
        totalContacts: 0,
        emailsThisMonth: 0,
        openRate: 0,
        clickRate: 0,
        bounceRate: 0,
        unsubscribeRate: 0,
      } satisfies OverviewStats,
      recentCampaigns: [] as RecentCampaign[],
      scheduledCampaigns: [] as RecentCampaign[],
      activities: [] as Activity[],
      automations: [] as ActiveAutomation[],
    }
  }

  // Run all queries in parallel
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [
    contactsResult,
    emailStatsResult,
    recentCampaignsResult,
    scheduledCampaignsResult,
    activitiesResult,
    automationsResult,
  ] = await Promise.all([
    // Total contacts
    supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId),

    // Email stats this month
    supabase
      .from("email_events")
      .select("event_type")
      .eq("organization_id", orgId)
      .gte("created_at", startOfMonth),

    // Recent campaigns (last 5 sent)
    supabase
      .from("campaigns")
      .select("id, name, status, sending_completed_at, scheduled_at, stats")
      .eq("organization_id", orgId)
      .in("status", ["sent", "sending"])
      .order("sending_completed_at", { ascending: false })
      .limit(5),

    // Upcoming scheduled campaigns
    supabase
      .from("campaigns")
      .select("id, name, status, sending_completed_at, scheduled_at, stats")
      .eq("organization_id", orgId)
      .eq("status", "scheduled")
      .order("scheduled_at", { ascending: true })
      .limit(5),

    // Recent activity events (audit_logs)
    supabase
      .from("audit_logs")
      .select("id, action, resource_type, description, created_at")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(10),

    // Active automations
    supabase
      .from("automations")
      .select("id, name, status, total_enrolled, total_completed, created_at")
      .eq("organization_id", orgId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(5),
  ])

  // Compute stats from email events
  const events = emailStatsResult.data ?? []
  const totalSent = events.filter((e) => e.event_type === "delivered").length
  const totalOpened = events.filter((e) => e.event_type === "opened").length
  const totalClicked = events.filter((e) => e.event_type === "clicked").length
  const totalBounced = events.filter((e) => e.event_type === "bounced").length
  const totalUnsubscribed = events.filter(
    (e) => e.event_type === "unsubscribed"
  ).length

  const stats: OverviewStats = {
    totalContacts: contactsResult.count ?? 0,
    emailsThisMonth: totalSent,
    openRate: calculateRate(totalOpened, totalSent),
    clickRate: calculateRate(totalClicked, totalSent),
    bounceRate: calculateRate(totalBounced, totalSent),
    unsubscribeRate: calculateRate(totalUnsubscribed, totalSent),
  }

  // Map activity log
  const activities: Activity[] = (activitiesResult.data ?? []).map((row) => ({
    id: row.id,
    type: row.action as Activity["type"],
    description: row.description ?? "",
    timestamp: row.created_at,
  }))

  return {
    stats,
    recentCampaigns: (recentCampaignsResult.data ?? []) as RecentCampaign[],
    scheduledCampaigns: (scheduledCampaignsResult.data ?? []) as RecentCampaign[],
    activities,
    automations: (automationsResult.data ?? []) as ActiveAutomation[],
  }
}

// ---------------------------------------------------------------------------
// Status badge colours
// ---------------------------------------------------------------------------

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  scheduled: "bg-blue-100 text-blue-700",
  sending: "bg-yellow-100 text-yellow-700",
  sent: "bg-emerald-100 text-emerald-700",
  paused: "bg-orange-100 text-orange-700",
  active: "bg-emerald-100 text-emerald-700",
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function DashboardPage() {
  const {
    stats,
    recentCampaigns,
    scheduledCampaigns,
    activities,
    automations,
  } = await getOverviewData()

  return (
    <div className="space-y-8">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back. Here is an overview of your email marketing performance.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Total Contacts"
          value={formatNumber(stats.totalContacts)}
        />
        <StatCard
          label="Emails This Month"
          value={formatNumber(stats.emailsThisMonth)}
        />
        <StatCard
          label="Open Rate"
          value={formatPercentage(stats.openRate)}
        />
        <StatCard
          label="Click Rate"
          value={formatPercentage(stats.clickRate)}
        />
        <StatCard
          label="Bounce Rate"
          value={formatPercentage(stats.bounceRate)}
          variant={stats.bounceRate > 5 ? "warning" : "default"}
        />
        <StatCard
          label="Unsubscribe Rate"
          value={formatPercentage(stats.unsubscribeRate)}
          variant={stats.unsubscribeRate > 2 ? "warning" : "default"}
        />
      </div>

      {/* Quick actions (client component) */}
      <DashboardOverviewClient activities={activities} />

      {/* Two-column layout for campaigns + automations */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent campaigns */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-900">
              Recent Campaigns
            </h2>
            <a
              href="/campaigns"
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
            >
              View all
            </a>
          </div>
          {recentCampaigns.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-500">
              No campaigns sent yet.
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recentCampaigns.map((campaign) => (
                <li key={campaign.id} className="px-5 py-3">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <a
                        href={`/campaigns/${campaign.id}`}
                        className="truncate text-sm font-medium text-gray-900 hover:text-indigo-600"
                      >
                        {campaign.name}
                      </a>
                      <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                            STATUS_STYLES[campaign.status] ?? STATUS_STYLES.draft
                          }`}
                        >
                          {campaign.status}
                        </span>
                        {campaign.sending_completed_at && (
                          <span>
                            Sent{" "}
                            {new Date(campaign.sending_completed_at).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric" }
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 flex items-center gap-4 text-xs text-gray-500">
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          {formatPercentage(
                            calculateRate(
                              (campaign.stats as Record<string, number>)?.opened ?? 0,
                              (campaign.stats as Record<string, number>)?.sent ?? 0
                            )
                          )}
                        </p>
                        <p>Opens</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          {formatPercentage(
                            calculateRate(
                              (campaign.stats as Record<string, number>)?.clicked ?? 0,
                              (campaign.stats as Record<string, number>)?.sent ?? 0
                            )
                          )}
                        </p>
                        <p>Clicks</p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Scheduled campaigns */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-900">
              Upcoming Scheduled
            </h2>
          </div>
          {scheduledCampaigns.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-500">
              No scheduled campaigns.
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {scheduledCampaigns.map((campaign) => (
                <li key={campaign.id} className="px-5 py-3">
                  <a
                    href={`/campaigns/${campaign.id}`}
                    className="text-sm font-medium text-gray-900 hover:text-indigo-600"
                  >
                    {campaign.name}
                  </a>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Scheduled for{" "}
                    {campaign.scheduled_at
                      ? new Date(campaign.scheduled_at).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          }
                        )
                      : "TBD"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Active automations summary */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-900">
            Active Automations
          </h2>
          <a
            href="/automations"
            className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
          >
            View all
          </a>
        </div>
        {automations.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-500">
            No active automations.
          </div>
        ) : (
          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
            {automations.map((auto) => (
              <a
                key={auto.id}
                href={`/automations/${auto.id}`}
                className="group rounded-lg border border-gray-200 p-4 transition-colors hover:border-indigo-200 hover:bg-indigo-50/30"
              >
                <div className="flex items-center justify-between">
                  <h3 className="truncate text-sm font-medium text-gray-900 group-hover:text-indigo-600">
                    {auto.name}
                  </h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      STATUS_STYLES[auto.status] ?? STATUS_STYLES.draft
                    }`}
                  >
                    {auto.status}
                  </span>
                </div>
                <div className="mt-2 flex gap-4 text-xs text-gray-500">
                  <span>
                    <span className="font-medium text-gray-700">
                      {formatNumber(auto.total_enrolled)}
                    </span>{" "}
                    enrolled
                  </span>
                  <span>
                    <span className="font-medium text-gray-700">
                      {formatNumber(auto.total_completed)}
                    </span>{" "}
                    completed
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Stat card (server component, inlined here for simplicity)
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  variant = "default",
}: {
  label: string
  value: string
  variant?: "default" | "warning"
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p
        className={`mt-2 text-2xl font-bold tracking-tight ${
          variant === "warning" ? "text-orange-600" : "text-gray-900"
        }`}
      >
        {value}
      </p>
    </div>
  )
}
