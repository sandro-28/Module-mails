"use client"

import { createColumnHelper } from "@tanstack/react-table"
import { formatDistanceToNow, format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { EngagementBar } from "@/components/contacts/engagement-badge"
import { cn } from "@/lib/utils"
import type { Contact, ContactStatus } from "@/types/database"

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  ContactStatus,
  { label: string; variant: "success" | "secondary" | "destructive" | "warning" | "default" }
> = {
  active: { label: "Active", variant: "success" },
  unsubscribed: { label: "Unsubscribed", variant: "secondary" },
  bounced: { label: "Bounced", variant: "destructive" },
  complained: { label: "Complained", variant: "destructive" },
  pending: { label: "Pending", variant: "warning" },
  cleaned: { label: "Cleaned", variant: "secondary" },
}

// ---------------------------------------------------------------------------
// Column helper
// ---------------------------------------------------------------------------

const columnHelper = createColumnHelper<Contact>()

export const contactColumns = [
  // Checkbox column
  columnHelper.display({
    id: "select",
    header: ({ table }) => (
      <label className="flex items-center">
        <input
          type="checkbox"
          className={cn(
            "h-4 w-4 rounded border-gray-300 text-indigo-600",
            "focus:ring-indigo-500 focus:ring-offset-0"
          )}
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          aria-label="Select all contacts"
        />
      </label>
    ),
    cell: ({ row }) => (
      <label className="flex items-center">
        <input
          type="checkbox"
          className={cn(
            "h-4 w-4 rounded border-gray-300 text-indigo-600",
            "focus:ring-indigo-500 focus:ring-offset-0"
          )}
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          aria-label={`Select ${row.original.email}`}
        />
      </label>
    ),
    size: 40,
    enableSorting: false,
  }),

  // Email
  columnHelper.accessor("email", {
    header: "Email",
    cell: (info) => (
      <span className="font-medium text-gray-900">{info.getValue()}</span>
    ),
    size: 240,
  }),

  // Name (first + last)
  columnHelper.display({
    id: "name",
    header: "Name",
    cell: ({ row }) => {
      const first = row.original.first_name ?? ""
      const last = row.original.last_name ?? ""
      const full = [first, last].filter(Boolean).join(" ")
      if (!full) return <span className="text-gray-400">--</span>
      return <span className="text-gray-700">{full}</span>
    },
    size: 180,
  }),

  // Status
  columnHelper.accessor("status", {
    header: "Status",
    cell: (info) => {
      const status = info.getValue() as ContactStatus
      const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.active
      return <Badge variant={config.variant}>{config.label}</Badge>
    },
    size: 120,
  }),

  // Engagement score
  columnHelper.accessor("engagement_score", {
    header: "Engagement",
    cell: (info) => <EngagementBar score={info.getValue()} />,
    size: 160,
  }),

  // Tags
  columnHelper.accessor("tags", {
    header: "Tags",
    cell: (info) => {
      const tags = info.getValue() ?? []
      if (tags.length === 0) return <span className="text-gray-400">--</span>
      return (
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-[10px]">
              {tag}
            </Badge>
          ))}
          {tags.length > 3 && (
            <Badge variant="outline" className="text-[10px]">
              +{tags.length - 3}
            </Badge>
          )}
        </div>
      )
    },
    size: 180,
    enableSorting: false,
  }),

  // Last activity
  columnHelper.accessor("last_activity_at", {
    header: "Last Activity",
    cell: (info) => {
      const value = info.getValue()
      if (!value) return <span className="text-gray-400">Never</span>
      return (
        <span className="text-sm text-gray-500">
          {formatDistanceToNow(new Date(value), { addSuffix: true })}
        </span>
      )
    },
    size: 140,
  }),

  // Created at
  columnHelper.accessor("created_at", {
    header: "Created",
    cell: (info) => (
      <span className="text-sm text-gray-500">
        {format(new Date(info.getValue()), "MMM d, yyyy")}
      </span>
    ),
    size: 120,
  }),
]
