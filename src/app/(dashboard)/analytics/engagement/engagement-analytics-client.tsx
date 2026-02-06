"use client"

import Link from "next/link"
import {
  ArrowLeft,
  Zap,
  TrendingUp,
  TrendingDown,
  Users,
  Flame,
  ThermometerSun,
  Snowflake,
} from "lucide-react"
import { cn, formatNumber, formatPercentage } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EngagementSegments {
  veryEngaged: number
  engaged: number
  lukewarm: number
  inactive: number
}

interface HistogramBucket {
  range: string
  count: number
}

interface EngagementAnalyticsClientProps {
  segments: EngagementSegments
  histogram: HistogramBucket[]
  totalContacts: number
  averageScore: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SEGMENT_CONFIGS = [
  {
    key: "veryEngaged" as const,
    label: "Very Engaged",
    description: "Score > 80",
    color: "#10b981",
    bgColor: "bg-green-50",
    textColor: "text-green-700",
    borderColor: "border-green-200",
    icon: Flame,
  },
  {
    key: "engaged" as const,
    label: "Engaged",
    description: "Score 50-80",
    color: "#4f46e5",
    bgColor: "bg-indigo-50",
    textColor: "text-indigo-700",
    borderColor: "border-indigo-200",
    icon: TrendingUp,
  },
  {
    key: "lukewarm" as const,
    label: "Lukewarm",
    description: "Score 20-50",
    color: "#f59e0b",
    bgColor: "bg-amber-50",
    textColor: "text-amber-700",
    borderColor: "border-amber-200",
    icon: ThermometerSun,
  },
  {
    key: "inactive" as const,
    label: "Inactive",
    description: "Score < 20",
    color: "#6b7280",
    bgColor: "bg-gray-50",
    textColor: "text-gray-700",
    borderColor: "border-gray-200",
    icon: Snowflake,
  },
]

function getBarColor(range: string): string {
  const start = parseInt(range.split("-")[0], 10)
  if (start >= 80) return "#10b981"
  if (start >= 50) return "#4f46e5"
  if (start >= 20) return "#f59e0b"
  return "#9ca3af"
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EngagementAnalyticsClient({
  segments,
  histogram,
  totalContacts,
  averageScore,
}: EngagementAnalyticsClientProps) {
  return (
    <div className="space-y-6">
      {/* Back nav */}
      <Link
        href="/analytics"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Analytics
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Engagement Analytics
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Understand how engaged your contacts are with your emails.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">
                Total Contacts
              </span>
              <Users className="h-4 w-4 text-gray-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-gray-900">
              {formatNumber(totalContacts)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">
                Average Score
              </span>
              <Zap className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-gray-900">
              {averageScore.toFixed(1)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">
                Highly Engaged
              </span>
              <Flame className="h-4 w-4 text-green-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-gray-900">
              {totalContacts > 0
                ? formatPercentage(
                    (segments.veryEngaged / totalContacts) * 100
                  )
                : "0%"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">
                At Risk
              </span>
              <Snowflake className="h-4 w-4 text-gray-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-gray-900">
              {totalContacts > 0
                ? formatPercentage(
                    (segments.inactive / totalContacts) * 100
                  )
                : "0%"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Segment breakdown cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SEGMENT_CONFIGS.map((config) => {
          const count = segments[config.key]
          const percentage =
            totalContacts > 0 ? (count / totalContacts) * 100 : 0
          const Icon = config.icon

          return (
            <Card
              key={config.key}
              className={cn("border", config.borderColor)}
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg",
                      config.bgColor
                    )}
                  >
                    <Icon className={cn("h-5 w-5", config.textColor)} />
                  </div>
                  <div>
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        config.textColor
                      )}
                    >
                      {config.label}
                    </p>
                    <p className="text-xs text-gray-500">
                      {config.description}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-end justify-between">
                    <span className="text-2xl font-bold text-gray-900">
                      {count.toLocaleString()}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn("text-xs", config.textColor)}
                    >
                      {formatPercentage(percentage)}
                    </Badge>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2 h-2 w-full rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(percentage, 100)}%`,
                        backgroundColor: config.color,
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Histogram */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Engagement Score Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          {histogram.every((h) => h.count === 0) ? (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <Zap className="h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm text-gray-500">
                No engagement data available yet.
              </p>
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={histogram}
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f0f0f0"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="range"
                    tick={{ fontSize: 12 }}
                    label={{
                      value: "Engagement Score",
                      position: "insideBottom",
                      offset: -5,
                      fontSize: 12,
                      fill: "#9ca3af",
                    }}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    label={{
                      value: "Contacts",
                      angle: -90,
                      position: "insideLeft",
                      fontSize: 12,
                      fill: "#9ca3af",
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    }}
                    formatter={(value) => [
                      `${Number(value).toLocaleString()} contacts`,
                      "Count",
                    ]}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {histogram.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={getBarColor(entry.range)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
