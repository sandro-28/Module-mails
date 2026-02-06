"use client"

import { useState, useMemo } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  FunnelChart,
  Funnel,
  LabelList,
} from "recharts"
import {
  Download,
  ExternalLink,
  Filter,
  TrendingUp,
} from "lucide-react"
import { cn, formatNumber, formatPercentage, calculateRate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type {
  Campaign,
  CampaignStats,
  TrackedLink,
  CampaignEmail,
  EmailEvent,
} from "@/types/database"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReportClientProps {
  campaign: Campaign
  trackedLinks: TrackedLink[]
  campaignEmails: CampaignEmail[]
  events: EmailEvent[]
}

type TimePeriod = "24h" | "48h" | "72h" | "7d" | "all"

const DEVICE_COLORS = ["#6366f1", "#06b6d4", "#f59e0b", "#94a3b8"]
const EMAIL_CLIENT_COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#94a3b8"]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReportClient({
  campaign,
  trackedLinks,
  campaignEmails,
  events,
}: ReportClientProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("72h")
  const [recipientFilter, setRecipientFilter] = useState<string>("all")
  const stats = campaign.stats

  // ---------------------------------------------------------------------------
  // Derived data: Opens/clicks over time
  // ---------------------------------------------------------------------------

  const timeSeriesData = useMemo(() => {
    if (events.length === 0) return []

    const startTime = campaign.sending_started_at
      ? new Date(campaign.sending_started_at).getTime()
      : new Date(campaign.created_at).getTime()

    const periodHours =
      timePeriod === "24h" ? 24
        : timePeriod === "48h" ? 48
          : timePeriod === "72h" ? 72
            : timePeriod === "7d" ? 168
              : 168

    const bucketCount = Math.min(periodHours, 48)
    const bucketSize = (periodHours * 3600 * 1000) / bucketCount
    const buckets: { time: string; opens: number; clicks: number }[] = []

    for (let i = 0; i < bucketCount; i++) {
      const bucketStart = startTime + i * bucketSize
      const bucketEnd = bucketStart + bucketSize

      const opens = events.filter(
        (e) =>
          e.event_type === "opened" &&
          new Date(e.timestamp).getTime() >= bucketStart &&
          new Date(e.timestamp).getTime() < bucketEnd
      ).length

      const clicks = events.filter(
        (e) =>
          e.event_type === "clicked" &&
          new Date(e.timestamp).getTime() >= bucketStart &&
          new Date(e.timestamp).getTime() < bucketEnd
      ).length

      const d = new Date(bucketStart)
      const label =
        periodHours <= 72
          ? `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:00`
          : `${d.getMonth() + 1}/${d.getDate()}`

      buckets.push({ time: label, opens, clicks })
    }

    return buckets
  }, [events, campaign, timePeriod])

  // ---------------------------------------------------------------------------
  // Derived data: Funnel
  // ---------------------------------------------------------------------------

  const funnelData = useMemo(() => {
    if (!stats) return []
    return [
      { name: "Sent", value: stats.sent, fill: "#6366f1" },
      { name: "Delivered", value: stats.delivered, fill: "#8b5cf6" },
      { name: "Opened", value: stats.unique_opens, fill: "#06b6d4" },
      { name: "Clicked", value: stats.unique_clicks, fill: "#10b981" },
    ]
  }, [stats])

  // ---------------------------------------------------------------------------
  // Derived data: Device breakdown
  // ---------------------------------------------------------------------------

  const deviceData = useMemo(() => {
    const counts: Record<string, number> = { Desktop: 0, Mobile: 0, Tablet: 0, Unknown: 0 }
    for (const email of campaignEmails) {
      const device = email.device_type ?? "unknown"
      const key = device.charAt(0).toUpperCase() + device.slice(1)
      counts[key] = (counts[key] || 0) + 1
    }
    return Object.entries(counts)
      .filter(([, count]) => count > 0)
      .map(([name, value]) => ({ name, value }))
  }, [campaignEmails])

  // ---------------------------------------------------------------------------
  // Derived data: Email client breakdown
  // ---------------------------------------------------------------------------

  const emailClientData = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const email of campaignEmails) {
      const client = email.email_client ?? "Unknown"
      counts[client] = (counts[client] || 0) + 1
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7)
      .map(([name, value]) => ({ name, value }))
  }, [campaignEmails])

  // ---------------------------------------------------------------------------
  // Filtered recipients
  // ---------------------------------------------------------------------------

  const filteredEmails = useMemo(() => {
    if (recipientFilter === "all") return campaignEmails
    return campaignEmails.filter((e) => e.status === recipientFilter)
  }, [campaignEmails, recipientFilter])

  // ---------------------------------------------------------------------------
  // CSV Export
  // ---------------------------------------------------------------------------

  const handleExportCSV = () => {
    const headers = ["Email", "Status", "Sent At", "Opened At", "Clicked At", "Bounced At"]
    const rows = campaignEmails.map((e) => [
      e.email_address,
      e.status,
      e.sent_at ?? "",
      e.first_opened_at ?? "",
      e.first_clicked_at ?? "",
      e.bounced_at ?? "",
    ])
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `campaign-report-${campaign.id}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-8">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Time period:</span>
          <div className="flex gap-1 rounded-lg border border-gray-200 p-0.5">
            {(["24h", "48h", "72h", "7d", "all"] as TimePeriod[]).map(
              (period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => setTimePeriod(period)}
                  className={cn(
                    "rounded-md px-3 py-1 text-xs font-medium uppercase transition-colors",
                    timePeriod === period
                      ? "bg-gray-900 text-white"
                      : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  {period}
                </button>
              )
            )}
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Charts row 1: Opens/Clicks over time + Funnel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Opens/Clicks line chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-indigo-500" />
              Opens &amp; Clicks Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            {timeSeriesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="time"
                    fontSize={11}
                    tickLine={false}
                    stroke="#94a3b8"
                  />
                  <YAxis fontSize={11} tickLine={false} stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      fontSize: "12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="opens"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={false}
                    name="Opens"
                  />
                  <Line
                    type="monotone"
                    dataKey="clicks"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    name="Clicks"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-64 items-center justify-center text-sm text-gray-400">
                No event data available yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Funnel chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Engagement Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            {funnelData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <FunnelChart>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      fontSize: "12px",
                    }}
                  />
                  <Funnel dataKey="value" data={funnelData} isAnimationActive>
                    <LabelList
                      position="right"
                      fill="#374151"
                      fontSize={12}
                      formatter={(value: unknown) => formatNumber(Number(value))}
                    />
                    <LabelList
                      position="left"
                      dataKey="name"
                      fill="#6b7280"
                      fontSize={11}
                    />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-64 items-center justify-center text-sm text-gray-400">
                No stats data available yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2: Device breakdown + Email client */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Device breakdown pie chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Device Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {deviceData.length > 0 ? (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={220}>
                  <PieChart>
                    <Pie
                      data={deviceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {deviceData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={DEVICE_COLORS[i % DEVICE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {deviceData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2 text-sm">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{
                          backgroundColor:
                            DEVICE_COLORS[i % DEVICE_COLORS.length],
                        }}
                      />
                      <span className="text-gray-700">{d.name}</span>
                      <span className="font-medium text-gray-900">
                        {formatNumber(d.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center text-sm text-gray-400">
                No device data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email client breakdown bar chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Email Client Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {emailClientData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={emailClientData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" fontSize={11} tickLine={false} stroke="#94a3b8" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    fontSize={11}
                    tickLine={false}
                    stroke="#94a3b8"
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="value" name="Count" radius={[0, 4, 4, 0]}>
                    {emailClientData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={EMAIL_CLIENT_COLORS[i % EMAIL_CLIENT_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-48 items-center justify-center text-sm text-gray-400">
                No email client data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Links table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Tracked Links</CardTitle>
        </CardHeader>
        <CardContent>
          {trackedLinks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="pb-3 pr-4 text-left font-medium text-gray-500">
                      URL
                    </th>
                    <th className="pb-3 pr-4 text-right font-medium text-gray-500">
                      Total Clicks
                    </th>
                    <th className="pb-3 pr-4 text-right font-medium text-gray-500">
                      Unique Clicks
                    </th>
                    <th className="pb-3 text-right font-medium text-gray-500">
                      CTR
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {trackedLinks.map((link) => (
                    <tr
                      key={link.id}
                      className="border-b border-gray-100 last:border-0"
                    >
                      <td className="py-3 pr-4">
                        <a
                          href={link.original_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700"
                        >
                          <span className="max-w-xs truncate">
                            {link.original_url}
                          </span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      </td>
                      <td className="py-3 pr-4 text-right font-medium text-gray-900">
                        {formatNumber(link.total_clicks)}
                      </td>
                      <td className="py-3 pr-4 text-right font-medium text-gray-900">
                        {formatNumber(link.unique_clicks)}
                      </td>
                      <td className="py-3 text-right font-medium text-gray-900">
                        {formatPercentage(
                          calculateRate(link.unique_clicks, stats?.delivered ?? 0)
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">
              No tracked links found
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recipients table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Recipients</CardTitle>
          <div className="flex gap-1">
            {["all", "delivered", "opened", "clicked", "bounced", "complained"].map(
              (f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setRecipientFilter(f)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                    recipientFilter === f
                      ? "bg-gray-900 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  {f}
                </button>
              )
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredEmails.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="pb-3 pr-4 text-left font-medium text-gray-500">
                      Email
                    </th>
                    <th className="pb-3 pr-4 text-left font-medium text-gray-500">
                      Status
                    </th>
                    <th className="pb-3 pr-4 text-left font-medium text-gray-500">
                      Sent
                    </th>
                    <th className="pb-3 pr-4 text-left font-medium text-gray-500">
                      Opened
                    </th>
                    <th className="pb-3 text-left font-medium text-gray-500">
                      Clicked
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmails.slice(0, 50).map((email) => (
                    <tr
                      key={email.id}
                      className="border-b border-gray-100 last:border-0"
                    >
                      <td className="py-2.5 pr-4 font-medium text-gray-900">
                        {email.email_address}
                      </td>
                      <td className="py-2.5 pr-4">
                        <Badge
                          variant={
                            email.status === "delivered" || email.status === "opened" || email.status === "clicked"
                              ? "success"
                              : email.status === "bounced" || email.status === "complained" || email.status === "failed"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {email.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 pr-4 text-gray-500">
                        {email.sent_at
                          ? new Date(email.sent_at).toLocaleString()
                          : "---"}
                      </td>
                      <td className="py-2.5 pr-4 text-gray-500">
                        {email.first_opened_at
                          ? new Date(email.first_opened_at).toLocaleString()
                          : "---"}
                      </td>
                      <td className="py-2.5 text-gray-500">
                        {email.first_clicked_at
                          ? new Date(email.first_clicked_at).toLocaleString()
                          : "---"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredEmails.length > 50 && (
                <p className="mt-3 text-center text-xs text-gray-400">
                  Showing 50 of {formatNumber(filteredEmails.length)} recipients
                </p>
              )}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">
              No recipients match the current filter
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
