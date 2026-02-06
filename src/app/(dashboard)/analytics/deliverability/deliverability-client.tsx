"use client"

import Link from "next/link"
import {
  ArrowLeft,
  Shield,
  ShieldCheck,
  ShieldX,
  AlertTriangle,
  Globe,
  TrendingDown,
} from "lucide-react"
import { cn, formatNumber, formatPercentage } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DeliverabilityGauge } from "@/components/analytics/deliverability-gauge"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from "recharts"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DomainAuth {
  domain: string | null
  domainVerified: boolean
  spf: boolean
  dkim: boolean
  dmarc: boolean
}

interface Stats {
  sent: number
  delivered: number
  bounced: number
  complaints: number
}

interface BounceTrendPoint {
  week: string
  hard: number
  soft: number
  complaints: number
}

interface TopDomain {
  domain: string
  count: number
}

interface DeliverabilityClientProps {
  score: number
  domainAuth: DomainAuth
  stats: Stats
  bounceTrend: BounceTrendPoint[]
  topBouncingDomains: TopDomain[]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DeliverabilityClient({
  score,
  domainAuth,
  stats,
  bounceTrend,
  topBouncingDomains,
}: DeliverabilityClientProps) {
  const bounceRate =
    stats.sent > 0 ? (stats.bounced / stats.sent) * 100 : 0
  const complaintRate =
    stats.sent > 0 ? (stats.complaints / stats.sent) * 100 : 0
  const deliveryRate =
    stats.sent > 0 ? (stats.delivered / stats.sent) * 100 : 0

  const authChecks = [
    {
      name: "SPF",
      description: "Sender Policy Framework",
      verified: domainAuth.spf,
    },
    {
      name: "DKIM",
      description: "DomainKeys Identified Mail",
      verified: domainAuth.dkim,
    },
    {
      name: "DMARC",
      description: "Domain-based Message Authentication",
      verified: domainAuth.dmarc,
    },
    {
      name: "Domain",
      description: "Custom sending domain",
      verified: domainAuth.domainVerified,
    },
  ]

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
        <h1 className="text-2xl font-bold text-gray-900">Deliverability</h1>
        <p className="mt-1 text-sm text-gray-500">
          Monitor your email deliverability health and domain authentication.
        </p>
      </div>

      {/* Score + Stats row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Deliverability Score Gauge */}
        <Card className="lg:row-span-2">
          <CardHeader>
            <CardTitle className="text-base">Deliverability Score</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <DeliverabilityGauge score={score} />
            <p className="mt-4 text-sm text-gray-500">
              Based on delivery rate, bounce rate, and complaint rate over the
              last 90 days.
            </p>
          </CardContent>
        </Card>

        {/* Stats cards */}
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-medium text-gray-500">Delivery Rate</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">
              {formatPercentage(deliveryRate)}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {formatNumber(stats.delivered)} of {formatNumber(stats.sent)}{" "}
              delivered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-medium text-gray-500">Bounce Rate</p>
            <p
              className={cn(
                "mt-1 text-3xl font-bold",
                bounceRate < 2
                  ? "text-green-600"
                  : bounceRate < 5
                    ? "text-amber-600"
                    : "text-red-600"
              )}
            >
              {formatPercentage(bounceRate)}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {formatNumber(stats.bounced)} total bounces
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-medium text-gray-500">Complaint Rate</p>
            <p
              className={cn(
                "mt-1 text-3xl font-bold",
                complaintRate < 0.1
                  ? "text-green-600"
                  : complaintRate < 0.3
                    ? "text-amber-600"
                    : "text-red-600"
              )}
            >
              {formatPercentage(complaintRate, 3)}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {formatNumber(stats.complaints)} complaints
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Domain Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" />
            Domain Authentication
          </CardTitle>
        </CardHeader>
        <CardContent>
          {domainAuth.domain ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">
                  {domainAuth.domain}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {authChecks.map((check) => (
                  <div
                    key={check.name}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3",
                      check.verified
                        ? "border-green-200 bg-green-50"
                        : "border-red-200 bg-red-50"
                    )}
                  >
                    {check.verified ? (
                      <ShieldCheck className="h-5 w-5 text-green-600" />
                    ) : (
                      <ShieldX className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <p
                        className={cn(
                          "text-sm font-semibold",
                          check.verified ? "text-green-700" : "text-red-700"
                        )}
                      >
                        {check.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {check.verified ? "Verified" : "Not verified"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  No custom domain configured
                </p>
                <p className="text-xs text-amber-600">
                  Set up a custom sending domain to improve deliverability.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bounce trend chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Bounce &amp; Complaint Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bounceTrend.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <TrendingDown className="h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm text-gray-500">
                No bounce data for this period.
              </p>
            </div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={bounceTrend}
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f0f0f0"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="week"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => {
                      const d = new Date(v)
                      return `${d.getMonth() + 1}/${d.getDate()}`
                    }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="hard"
                    name="Hard Bounces"
                    fill="#ef4444"
                    stackId="bounces"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="soft"
                    name="Soft Bounces"
                    fill="#f59e0b"
                    stackId="bounces"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="complaints"
                    name="Complaints"
                    fill="#8b5cf6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top bouncing domains */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Bouncing Domains</CardTitle>
        </CardHeader>
        <CardContent>
          {topBouncingDomains.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <ShieldCheck className="h-10 w-10 text-green-300" />
              <p className="mt-3 text-sm text-gray-500">
                No significant bouncing domains detected.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Domain
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Bounces/Complaints
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Impact
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {topBouncingDomains.map((domain, idx) => {
                    const total = topBouncingDomains.reduce(
                      (sum, d) => sum + d.count,
                      0
                    )
                    const pct = total > 0 ? (domain.count / total) * 100 : 0
                    return (
                      <tr
                        key={domain.domain}
                        className="transition-colors hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {domain.domain}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700">
                          {domain.count.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <div className="h-2 w-16 rounded-full bg-gray-100">
                              <div
                                className="h-2 rounded-full bg-red-400"
                                style={{
                                  width: `${Math.min(pct, 100)}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">
                              {formatPercentage(pct)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
