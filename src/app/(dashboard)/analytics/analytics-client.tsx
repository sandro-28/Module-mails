"use client"

import { useState } from "react"
import {
  Send,
  Eye,
  MousePointerClick,
  AlertTriangle,
  UserMinus,
  Users,
  TrendingUp,
  TrendingDown,
  Calendar,
} from "lucide-react"
import { cn, formatNumber, formatPercentage } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { OverviewChart } from "@/components/analytics/overview-chart"
import { EngagementFunnel } from "@/components/analytics/engagement-funnel"
import { DeviceBreakdown } from "@/components/analytics/device-breakdown"
import { RealTimeCounter } from "@/components/analytics/real-time-counter"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface KPIs {
  totalSent: number
  avgOpenRate: number
  avgClickRate: number
  avgBounceRate: number
  avgUnsubscribeRate: number
  totalContacts: number
}

interface TimeSeriesPoint {
  date: string
  sent: number
  opened: number
  clicked: number
}

interface TopCampaign {
  name: string
  openRate: number
  clickRate: number
  sent: number
}

interface GrowthPoint {
  month: string
  newContacts: number
  totalContacts: number
}

interface SourceItem {
  name: string
  value: number
}

interface DeviceItem {
  name: string
  value: number
}

interface AnalyticsClientProps {
  kpis: KPIs
  timeSeriesData: TimeSeriesPoint[]
  topCampaigns: TopCampaign[]
  contactGrowthData: GrowthPoint[]
  sourceBreakdown: SourceItem[]
  deviceBreakdown: DeviceItem[]
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DATE_RANGES = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "12m", days: 365 },
] as const

const SOURCE_COLORS = [
  "#4f46e5",
  "#06b6d4",
  "#8b5cf6",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#6366f1",
  "#ec4899",
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AnalyticsClient({
  kpis,
  timeSeriesData,
  topCampaigns,
  contactGrowthData,
  sourceBreakdown,
  deviceBreakdown,
}: AnalyticsClientProps) {
  const [dateRange, setDateRange] = useState<number>(30)

  // Filter time-series data by date range
  const cutoffDate = new Date(
    Date.now() - dateRange * 24 * 60 * 60 * 1000
  )
    .toISOString()
    .split("T")[0]

  const filteredTimeSeries = timeSeriesData.filter(
    (d) => d.date >= cutoffDate
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">
            Overview of your email marketing performance.
          </p>
        </div>

        {/* Date range picker */}
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1">
          {DATE_RANGES.map((range) => (
            <button
              key={range.label}
              type="button"
              onClick={() => setDateRange(range.days)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                dateRange === range.days
                  ? "bg-indigo-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <KPICard
          label="Total Sent"
          value={formatNumber(kpis.totalSent)}
          icon={Send}
          trend={null}
        />
        <KPICard
          label="Avg Open Rate"
          value={formatPercentage(kpis.avgOpenRate)}
          icon={Eye}
          trend={kpis.avgOpenRate > 20 ? 5.2 : -2.1}
          trendLabel="vs previous period"
        />
        <KPICard
          label="Avg Click Rate"
          value={formatPercentage(kpis.avgClickRate)}
          icon={MousePointerClick}
          trend={kpis.avgClickRate > 3 ? 3.1 : -1.4}
          trendLabel="vs previous period"
        />
        <KPICard
          label="Avg Bounce Rate"
          value={formatPercentage(kpis.avgBounceRate)}
          icon={AlertTriangle}
          trend={kpis.avgBounceRate < 3 ? -0.5 : 1.2}
          trendLabel="vs previous period"
          invertTrend
        />
        <KPICard
          label="Unsubscribe Rate"
          value={formatPercentage(kpis.avgUnsubscribeRate)}
          icon={UserMinus}
          trend={kpis.avgUnsubscribeRate < 0.5 ? -0.1 : 0.3}
          trendLabel="vs previous period"
          invertTrend
        />
        <KPICard
          label="Total Contacts"
          value={formatNumber(kpis.totalContacts)}
          icon={Users}
          trend={null}
        />
      </div>

      {/* Overview chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Email Activity Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTimeSeries.length === 0 ? (
            <EmptyChartState message="No email activity data for this period." />
          ) : (
            <OverviewChart data={filteredTimeSeries} />
          )}
        </CardContent>
      </Card>

      {/* Two-column charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top campaigns bar chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Top 5 Campaigns by Open Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topCampaigns.length === 0 ? (
              <EmptyChartState message="No campaign data available." />
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topCampaigns}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={120}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value) => `${Number(value).toFixed(1)}%`}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Bar
                      dataKey="openRate"
                      name="Open Rate"
                      fill="#4f46e5"
                      radius={[0, 4, 4, 0]}
                    />
                    <Bar
                      dataKey="clickRate"
                      name="Click Rate"
                      fill="#06b6d4"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact growth area chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Contact Growth Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contactGrowthData.length === 0 ? (
              <EmptyChartState message="No contact growth data available." />
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={contactGrowthData}
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(val) => {
                        const [y, m] = val.split("-")
                        return `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parseInt(m, 10) - 1]} ${y.slice(2)}`
                      }}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                      }}
                    />
                    <defs>
                      <linearGradient
                        id="contactGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#4f46e5"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="100%"
                          stopColor="#4f46e5"
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="totalContacts"
                      name="Total Contacts"
                      stroke="#4f46e5"
                      fill="url(#contactGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Three-column row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Source breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact Sources</CardTitle>
          </CardHeader>
          <CardContent>
            {sourceBreakdown.length === 0 ? (
              <EmptyChartState message="No source data available." />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sourceBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {sourceBreakdown.map((_, index) => (
                        <Cell
                          key={index}
                          fill={SOURCE_COLORS[index % SOURCE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Device breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Device Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {deviceBreakdown.length === 0 ? (
              <EmptyChartState message="No device data available." />
            ) : (
              <DeviceBreakdown data={deviceBreakdown} />
            )}
          </CardContent>
        </Card>

        {/* Engagement funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Email Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <EngagementFunnel
              sent={kpis.totalSent}
              delivered={Math.round(kpis.totalSent * (1 - kpis.avgBounceRate / 100))}
              opened={Math.round(kpis.totalSent * (kpis.avgOpenRate / 100))}
              clicked={Math.round(kpis.totalSent * (kpis.avgClickRate / 100))}
              converted={0}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// KPI Card Sub-component
// ---------------------------------------------------------------------------

interface KPICardProps {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  trend: number | null
  trendLabel?: string
  invertTrend?: boolean
}

function KPICard({
  label,
  value,
  icon: Icon,
  trend,
  trendLabel,
  invertTrend = false,
}: KPICardProps) {
  const isPositive = trend !== null && (invertTrend ? trend < 0 : trend > 0)
  const isNegative = trend !== null && (invertTrend ? trend > 0 : trend < 0)

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">{label}</span>
          <Icon className="h-4 w-4 text-gray-400" />
        </div>
        <div className="mt-2">
          <span className="text-2xl font-bold text-gray-900">{value}</span>
        </div>
        {trend !== null && (
          <div className="mt-1 flex items-center gap-1">
            {isPositive ? (
              <TrendingUp className="h-3.5 w-3.5 text-green-500" />
            ) : isNegative ? (
              <TrendingDown className="h-3.5 w-3.5 text-red-500" />
            ) : null}
            <span
              className={cn(
                "text-xs font-medium",
                isPositive && "text-green-600",
                isNegative && "text-red-600",
                !isPositive && !isNegative && "text-gray-500"
              )}
            >
              {trend > 0 ? "+" : ""}
              {trend.toFixed(1)}%
            </span>
            {trendLabel && (
              <span className="text-xs text-gray-400">{trendLabel}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Empty Chart State
// ---------------------------------------------------------------------------

function EmptyChartState({ message }: { message: string }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center text-center">
      <Calendar className="h-10 w-10 text-gray-300" />
      <p className="mt-3 text-sm text-gray-500">{message}</p>
    </div>
  )
}
