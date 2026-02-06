"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Mail,
  MoreHorizontal,
  Pencil,
  Copy,
  BarChart3,
  Trash2,
  Inbox,
  ArrowUpDown,
} from "lucide-react"
import { cn, formatPercentage, formatNumber } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { deleteCampaign, duplicateCampaign } from "@/app/actions/campaigns"
import type { Campaign, CampaignStatus } from "@/types/database"

// ---------------------------------------------------------------------------
// Status badge config
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  CampaignStatus,
  { label: string; variant: "secondary" | "default" | "warning" | "success" | "destructive" }
> = {
  draft: { label: "Draft", variant: "secondary" },
  scheduled: { label: "Scheduled", variant: "default" },
  sending: { label: "Sending", variant: "warning" },
  sent: { label: "Sent", variant: "success" },
  paused: { label: "Paused", variant: "warning" },
  cancelled: { label: "Cancelled", variant: "destructive" },
  failed: { label: "Failed", variant: "destructive" },
}

type FilterTab = "all" | CampaignStatus

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "scheduled", label: "Scheduled" },
  { key: "sending", label: "Sending" },
  { key: "sent", label: "Sent" },
]

type SortField = "date" | "name" | "performance"

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface CampaignsClientProps {
  campaigns: Campaign[]
}

export function CampaignsClient({ campaigns }: CampaignsClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState<FilterTab>("all")
  const [sortField, setSortField] = useState<SortField>("date")
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  // Filter
  const filtered =
    activeTab === "all"
      ? campaigns
      : campaigns.filter((c) => c.status === activeTab)

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    switch (sortField) {
      case "name":
        return a.name.localeCompare(b.name)
      case "performance":
        return (b.stats?.open_rate ?? 0) - (a.stats?.open_rate ?? 0)
      case "date":
      default:
        return (
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        )
    }
  })

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return
    startTransition(async () => {
      try {
        await deleteCampaign(id)
        router.refresh()
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to delete campaign")
      }
    })
  }

  const handleDuplicate = (id: string) => {
    startTransition(async () => {
      try {
        await duplicateCampaign(id)
        router.refresh()
      } catch (err) {
        alert(
          err instanceof Error ? err.message : "Failed to duplicate campaign"
        )
      }
    })
  }

  return (
    <div>
      {/* Filter tabs */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
          {FILTER_TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                activeTab === key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Sort by:</span>
          <div className="flex gap-1 rounded-lg border border-gray-200 p-0.5">
            {(["date", "name", "performance"] as SortField[]).map((field) => (
              <button
                key={field}
                type="button"
                onClick={() => setSortField(field)}
                className={cn(
                  "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                  sortField === field
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <ArrowUpDown className="h-3 w-3" />
                {field}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Empty state */}
      {sorted.length === 0 && (
        <Card className="flex flex-col items-center justify-center py-16">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <Inbox className="h-7 w-7 text-gray-400" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-gray-900">
            No campaigns found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {activeTab === "all"
              ? "Get started by creating your first campaign."
              : `No ${activeTab} campaigns yet.`}
          </p>
          {activeTab === "all" && (
            <Button className="mt-4" asChild>
              <Link href="/campaigns/new">Create Campaign</Link>
            </Button>
          )}
        </Card>
      )}

      {/* Campaign cards */}
      {sorted.length > 0 && (
        <div className="grid gap-4">
          {sorted.map((campaign) => {
            const statusCfg = STATUS_CONFIG[campaign.status]
            return (
              <Card
                key={campaign.id}
                className={cn(
                  "relative overflow-hidden transition-shadow hover:shadow-md",
                  isPending && "opacity-70"
                )}
              >
                <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  {/* Left: info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/campaigns/${campaign.id}`}
                        className="truncate text-sm font-semibold text-gray-900 hover:text-indigo-600"
                      >
                        {campaign.name}
                      </Link>
                      <Badge variant={statusCfg.variant}>
                        {statusCfg.label}
                      </Badge>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span className="capitalize">{campaign.type.replace("_", " ")}</span>
                      {campaign.subject && (
                        <span className="truncate">
                          Subject: {campaign.subject}
                        </span>
                      )}
                      <span>
                        {campaign.sending_completed_at
                          ? `Sent ${new Date(campaign.sending_completed_at).toLocaleDateString()}`
                          : campaign.scheduled_at
                            ? `Scheduled ${new Date(campaign.scheduled_at).toLocaleDateString()}`
                            : `Updated ${new Date(campaign.updated_at).toLocaleDateString()}`}
                      </span>
                    </div>
                  </div>

                  {/* Center: stats (only for sent/sending) */}
                  {(campaign.status === "sent" || campaign.status === "sending") && (
                    <div className="flex items-center gap-6 text-center">
                      <div>
                        <p className="text-xs text-gray-500">Recipients</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatNumber(campaign.total_recipients)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Open Rate</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatPercentage(campaign.stats?.open_rate ?? 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Click Rate</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatPercentage(campaign.stats?.click_rate ?? 0)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Right: actions */}
                  <div className="relative flex shrink-0 items-center gap-1">
                    {campaign.status === "draft" && (
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/campaigns/${campaign.id}`}>
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Link>
                      </Button>
                    )}
                    {(campaign.status === "sent" || campaign.status === "sending") && (
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/campaigns/${campaign.id}/report`}>
                          <BarChart3 className="h-3.5 w-3.5" />
                          Report
                        </Link>
                      </Button>
                    )}

                    {/* Dropdown toggle */}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() =>
                        setOpenMenu(openMenu === campaign.id ? null : campaign.id)
                      }
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>

                    {/* Dropdown menu */}
                    {openMenu === campaign.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setOpenMenu(null)}
                        />
                        <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenu(null)
                              handleDuplicate(campaign.id)
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Copy className="h-4 w-4" />
                            Duplicate
                          </button>
                          {(campaign.status === "sent" ||
                            campaign.status === "sending") && (
                            <Link
                              href={`/campaigns/${campaign.id}/report`}
                              onClick={() => setOpenMenu(null)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <BarChart3 className="h-4 w-4" />
                              View Report
                            </Link>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenu(null)
                              handleDelete(campaign.id)
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
