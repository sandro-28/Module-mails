"use client"

import { useState, useMemo, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
  RefreshCw,
  Filter,
  Users,
  Clock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { deleteSegment, duplicateSegment, recalculateSegment } from "@/app/actions/segments"
import type { Segment } from "@/types/database"

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SegmentsClientProps {
  segments: Segment[]
  organizationId: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SegmentsClient({ segments, organizationId }: SegmentsClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [search, setSearch] = useState("")
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  const filteredSegments = useMemo(() => {
    if (!search.trim()) return segments
    const q = search.toLowerCase()
    return segments.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q))
    )
  }, [segments, search])

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "Never"
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  function formatRelativeTime(dateStr: string | null) {
    if (!dateStr) return "Never"
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  function handleDuplicate(id: string) {
    setOpenDropdown(null)
    startTransition(async () => {
      await duplicateSegment(id)
      router.refresh()
    })
  }

  function handleRecalculate(id: string) {
    setOpenDropdown(null)
    startTransition(async () => {
      await recalculateSegment(id)
      router.refresh()
    })
  }

  function handleDelete(id: string) {
    setOpenDropdown(null)
    if (!confirm("Are you sure you want to delete this segment?")) return
    startTransition(async () => {
      await deleteSegment(id)
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Segments</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create dynamic segments to target specific groups of contacts.
          </p>
        </div>
        <Button onClick={() => router.push("/segments/new")}>
          <Plus className="h-4 w-4" />
          Create Segment
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search segments..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Segments list */}
      {filteredSegments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Filter className="h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              {search ? "No segments found" : "No segments yet"}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {search
                ? "Try adjusting your search terms."
                : "Create your first segment to dynamically group contacts."}
            </p>
            {!search && (
              <Button
                className="mt-4"
                onClick={() => router.push("/segments/new")}
              >
                <Plus className="h-4 w-4" />
                Create Segment
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredSegments.map((segment) => (
            <Card
              key={segment.id}
              className={cn(
                "group cursor-pointer transition-shadow hover:shadow-md",
                isPending && "opacity-70"
              )}
              onClick={() => router.push(`/segments/${segment.id}`)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="truncate text-base font-semibold text-gray-900">
                        {segment.name}
                      </h3>
                      <Badge variant="default">
                        <Filter className="mr-1 h-3 w-3" />
                        Dynamic
                      </Badge>
                    </div>
                    {segment.description && (
                      <p className="mt-1 text-sm text-gray-500">
                        {segment.description}
                      </p>
                    )}
                    <div className="mt-3 flex items-center gap-5">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">
                          {segment.contact_count.toLocaleString()}
                        </span>
                        <span className="text-gray-400">contacts</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                        Calculated {formatRelativeTime(segment.last_calculated_at)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {segment.conditions.conditions.length} condition
                        {segment.conditions.conditions.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="relative ml-4">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenDropdown(
                          openDropdown === segment.id ? null : segment.id
                        )
                      }}
                      className="rounded-md p-1 text-gray-400 opacity-0 transition-opacity hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100"
                      aria-label="Segment actions"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                    {openDropdown === segment.id && (
                      <div
                        className="absolute right-0 z-20 mt-1 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => {
                            setOpenDropdown(null)
                            router.push(`/segments/${segment.id}`)
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => handleDuplicate(segment.id)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                          Duplicate
                        </button>
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => handleRecalculate(segment.id)}
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Recalculate
                        </button>
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(segment.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
