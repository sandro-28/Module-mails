"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Search, ArrowUpDown, Filter } from "lucide-react"
import { cn, formatPercentage } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CampaignStats, CampaignStatus } from "@/types/database"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CampaignRow {
  id: string
  name: string
  status: CampaignStatus
  type: string
  stats: CampaignStats | null
  total_recipients: number
  sending_completed_at: string | null
  created_at: string
}

type SortKey =
  | "name"
  | "sent"
  | "openRate"
  | "clickRate"
  | "bounceRate"
  | "unsubscribeRate"
  | "date"

interface CampaignAnalyticsClientProps {
  campaigns: CampaignRow[]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CampaignAnalyticsClient({
  campaigns,
}: CampaignAnalyticsClientProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortKey, setSortKey] = useState<SortKey>("date")
  const [sortAsc, setSortAsc] = useState(false)

  // Process campaigns into displayable rows
  const rows = useMemo(() => {
    return campaigns.map((c) => {
      const stats = c.stats as CampaignStats | null
      const sent = stats?.sent ?? 0
      return {
        id: c.id,
        name: c.name,
        status: c.status,
        type: c.type,
        sent,
        openRate: sent > 0 ? ((stats?.unique_opens ?? 0) / sent) * 100 : 0,
        clickRate: sent > 0 ? ((stats?.unique_clicks ?? 0) / sent) * 100 : 0,
        bounceRate: sent > 0 ? ((stats?.bounced ?? 0) / sent) * 100 : 0,
        unsubscribeRate:
          sent > 0 ? ((stats?.unsubscribed ?? 0) / sent) * 100 : 0,
        date: c.sending_completed_at ?? c.created_at,
      }
    })
  }, [campaigns])

  // Filter
  const filtered = useMemo(() => {
    let result = rows
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((r) => r.name.toLowerCase().includes(q))
    }
    if (statusFilter !== "all") {
      result = result.filter((r) => r.status === statusFilter)
    }
    return result
  }, [rows, search, statusFilter])

  // Sort
  const sorted = useMemo(() => {
    const list = [...filtered]
    list.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case "name":
          cmp = a.name.localeCompare(b.name)
          break
        case "sent":
          cmp = a.sent - b.sent
          break
        case "openRate":
          cmp = a.openRate - b.openRate
          break
        case "clickRate":
          cmp = a.clickRate - b.clickRate
          break
        case "bounceRate":
          cmp = a.bounceRate - b.bounceRate
          break
        case "unsubscribeRate":
          cmp = a.unsubscribeRate - b.unsubscribeRate
          break
        case "date":
          cmp = new Date(a.date).getTime() - new Date(b.date).getTime()
          break
      }
      return sortAsc ? cmp : -cmp
    })
    return list
  }, [filtered, sortKey, sortAsc])

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(false)
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const statusBadgeVariant = (status: string) => {
    switch (status) {
      case "sent":
        return "success"
      case "sending":
        return "default"
      case "draft":
        return "secondary"
      case "scheduled":
        return "warning"
      case "failed":
      case "cancelled":
        return "destructive"
      default:
        return "secondary"
    }
  }

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
          Campaign Analytics
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Compare performance across all your campaigns.
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: "all", label: "All statuses" },
            { value: "sent", label: "Sent" },
            { value: "sending", label: "Sending" },
            { value: "scheduled", label: "Scheduled" },
            { value: "draft", label: "Draft" },
          ]}
          className="w-40"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Filter className="h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm font-medium text-gray-900">
                No campaigns found
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <SortableHeader
                      label="Campaign"
                      sortKey="name"
                      currentSort={sortKey}
                      asc={sortAsc}
                      onClick={handleSort}
                    />
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <SortableHeader
                      label="Sent"
                      sortKey="sent"
                      currentSort={sortKey}
                      asc={sortAsc}
                      onClick={handleSort}
                    />
                    <SortableHeader
                      label="Open Rate"
                      sortKey="openRate"
                      currentSort={sortKey}
                      asc={sortAsc}
                      onClick={handleSort}
                    />
                    <SortableHeader
                      label="Click Rate"
                      sortKey="clickRate"
                      currentSort={sortKey}
                      asc={sortAsc}
                      onClick={handleSort}
                    />
                    <SortableHeader
                      label="Bounce Rate"
                      sortKey="bounceRate"
                      currentSort={sortKey}
                      asc={sortAsc}
                      onClick={handleSort}
                    />
                    <SortableHeader
                      label="Unsub Rate"
                      sortKey="unsubscribeRate"
                      currentSort={sortKey}
                      asc={sortAsc}
                      onClick={handleSort}
                    />
                    <SortableHeader
                      label="Date"
                      sortKey="date"
                      currentSort={sortKey}
                      asc={sortAsc}
                      onClick={handleSort}
                    />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sorted.map((row) => (
                    <tr
                      key={row.id}
                      className="transition-colors hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">
                        <span className="max-w-[200px] truncate block">
                          {row.name}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            statusBadgeVariant(row.status) as
                              | "default"
                              | "secondary"
                              | "success"
                              | "warning"
                              | "destructive"
                          }
                        >
                          {row.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {row.sent.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <MetricCell value={row.openRate} good={20} warn={10} />
                      </td>
                      <td className="px-4 py-3">
                        <MetricCell value={row.clickRate} good={3} warn={1.5} />
                      </td>
                      <td className="px-4 py-3">
                        <MetricCell
                          value={row.bounceRate}
                          good={2}
                          warn={5}
                          invert
                        />
                      </td>
                      <td className="px-4 py-3">
                        <MetricCell
                          value={row.unsubscribeRate}
                          good={0.3}
                          warn={0.5}
                          invert
                        />
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {formatDate(row.date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sortable Header
// ---------------------------------------------------------------------------

function SortableHeader({
  label,
  sortKey,
  currentSort,
  asc,
  onClick,
}: {
  label: string
  sortKey: SortKey
  currentSort: SortKey
  asc: boolean
  onClick: (key: SortKey) => void
}) {
  return (
    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
      <button
        type="button"
        className="inline-flex items-center gap-1 hover:text-gray-700"
        onClick={() => onClick(sortKey)}
      >
        {label}
        <ArrowUpDown
          className={cn(
            "h-3.5 w-3.5",
            currentSort === sortKey && "text-indigo-600"
          )}
        />
      </button>
    </th>
  )
}

// ---------------------------------------------------------------------------
// Metric Cell
// ---------------------------------------------------------------------------

function MetricCell({
  value,
  good,
  warn,
  invert = false,
}: {
  value: number
  good: number
  warn: number
  invert?: boolean
}) {
  const isGood = invert ? value < good : value >= good
  const isWarn = invert
    ? value >= good && value < warn
    : value >= warn && value < good

  return (
    <span
      className={cn(
        "text-sm font-medium",
        isGood && "text-green-600",
        isWarn && "text-amber-600",
        !isGood && !isWarn && "text-red-600"
      )}
    >
      {formatPercentage(value)}
    </span>
  )
}
