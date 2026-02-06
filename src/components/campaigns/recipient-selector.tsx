"use client"

import { useEffect, useState, useCallback } from "react"
import { Users, X, Loader2 } from "lucide-react"
import { cn, formatNumber } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import type { List, Segment } from "@/types/database"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RecipientSelectorProps {
  selectedListIds: string[]
  selectedSegmentIds: string[]
  excludeListIds: string[]
  excludeSegmentIds: string[]
  onListsChange: (ids: string[]) => void
  onSegmentsChange: (ids: string[]) => void
  onExcludeListsChange: (ids: string[]) => void
  onExcludeSegmentsChange: (ids: string[]) => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RecipientSelector({
  selectedListIds,
  selectedSegmentIds,
  excludeListIds,
  excludeSegmentIds,
  onListsChange,
  onSegmentsChange,
  onExcludeListsChange,
  onExcludeSegmentsChange,
}: RecipientSelectorProps) {
  const [lists, setLists] = useState<List[]>([])
  const [segments, setSegments] = useState<Segment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient()
        const [listsRes, segmentsRes] = await Promise.all([
          supabase
            .from("lists")
            .select("*")
            .order("name"),
          supabase
            .from("segments")
            .select("*")
            .order("name"),
        ])

        if (listsRes.error) throw listsRes.error
        if (segmentsRes.error) throw segmentsRes.error

        setLists(listsRes.data ?? [])
        setSegments(segmentsRes.data ?? [])
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Calculate estimated recipients
  const estimatedRecipients = useCallback(() => {
    let total = 0
    for (const id of selectedListIds) {
      const list = lists.find((l) => l.id === id)
      if (list) total += list.active_contact_count
    }
    for (const id of selectedSegmentIds) {
      const seg = segments.find((s) => s.id === id)
      if (seg) total += seg.contact_count
    }
    // Subtract excluded
    for (const id of excludeListIds) {
      const list = lists.find((l) => l.id === id)
      if (list) total -= list.active_contact_count
    }
    return Math.max(0, total)
  }, [selectedListIds, selectedSegmentIds, excludeListIds, lists, segments])

  const toggleItem = (
    id: string,
    current: string[],
    setter: (ids: string[]) => void
  ) => {
    if (current.includes(id)) {
      setter(current.filter((i) => i !== id))
    } else {
      setter([...current, id])
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Loading lists and segments...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Estimated recipients card */}
      <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-indigo-600" />
          <div>
            <p className="text-sm font-medium text-indigo-900">
              Estimated Recipients
            </p>
            <p className="text-2xl font-bold text-indigo-700">
              {formatNumber(estimatedRecipients())}
            </p>
          </div>
        </div>
      </div>

      {/* Lists selection */}
      <div>
        <h4 className="mb-3 text-sm font-medium text-gray-700">
          Select Lists
        </h4>
        {lists.length === 0 ? (
          <p className="text-sm text-gray-500">No lists available. Create a list first.</p>
        ) : (
          <div className="grid gap-2">
            {lists.map((list) => {
              const isSelected = selectedListIds.includes(list.id)
              return (
                <button
                  key={list.id}
                  type="button"
                  onClick={() => toggleItem(list.id, selectedListIds, onListsChange)}
                  className={cn(
                    "flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors",
                    isSelected
                      ? "border-indigo-300 bg-indigo-50 ring-1 ring-indigo-300"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded border-2",
                        isSelected
                          ? "border-indigo-600 bg-indigo-600"
                          : "border-gray-300 bg-white"
                      )}
                    >
                      {isSelected && (
                        <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                          <path d="M3 6l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{list.name}</p>
                      {list.description && (
                        <p className="text-xs text-gray-500">{list.description}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {formatNumber(list.active_contact_count)} contacts
                  </Badge>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Segments selection */}
      <div>
        <h4 className="mb-3 text-sm font-medium text-gray-700">
          Select Segments
        </h4>
        {segments.length === 0 ? (
          <p className="text-sm text-gray-500">No segments available.</p>
        ) : (
          <div className="grid gap-2">
            {segments.map((segment) => {
              const isSelected = selectedSegmentIds.includes(segment.id)
              return (
                <button
                  key={segment.id}
                  type="button"
                  onClick={() =>
                    toggleItem(segment.id, selectedSegmentIds, onSegmentsChange)
                  }
                  className={cn(
                    "flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors",
                    isSelected
                      ? "border-indigo-300 bg-indigo-50 ring-1 ring-indigo-300"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded border-2",
                        isSelected
                          ? "border-indigo-600 bg-indigo-600"
                          : "border-gray-300 bg-white"
                      )}
                    >
                      {isSelected && (
                        <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                          <path d="M3 6l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {segment.name}
                      </p>
                      {segment.description && (
                        <p className="text-xs text-gray-500">{segment.description}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary">
                    ~{formatNumber(segment.contact_count)} contacts
                  </Badge>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Exclusions */}
      <div>
        <h4 className="mb-3 text-sm font-medium text-gray-700">
          Exclude Lists (optional)
        </h4>
        {lists.length === 0 ? (
          <p className="text-sm text-gray-500">No lists available.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {lists.map((list) => {
              const isExcluded = excludeListIds.includes(list.id)
              return (
                <button
                  key={list.id}
                  type="button"
                  onClick={() =>
                    toggleItem(list.id, excludeListIds, onExcludeListsChange)
                  }
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    isExcluded
                      ? "border-red-300 bg-red-50 text-red-700"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  )}
                >
                  {list.name}
                  {isExcluded && <X className="h-3 w-3" />}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div>
        <h4 className="mb-3 text-sm font-medium text-gray-700">
          Exclude Segments (optional)
        </h4>
        {segments.length === 0 ? (
          <p className="text-sm text-gray-500">No segments available.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {segments.map((segment) => {
              const isExcluded = excludeSegmentIds.includes(segment.id)
              return (
                <button
                  key={segment.id}
                  type="button"
                  onClick={() =>
                    toggleItem(
                      segment.id,
                      excludeSegmentIds,
                      onExcludeSegmentsChange
                    )
                  }
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    isExcluded
                      ? "border-red-300 bg-red-50 text-red-700"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  )}
                >
                  {segment.name}
                  {isExcluded && <X className="h-3 w-3" />}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
