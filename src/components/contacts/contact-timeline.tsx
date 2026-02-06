"use client"

import { useState, useCallback } from "react"
import {
  Mail,
  Eye,
  MousePointer,
  AlertTriangle,
  XCircle,
  UserPlus,
  UserMinus,
  Tag,
  Send,
  RefreshCw,
  Shield,
  Loader2,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TimelineEvent {
  id: string
  contact_id: string
  type: string
  description: string
  metadata: Record<string, unknown>
  created_at: string
}

interface ContactTimelineProps {
  events: TimelineEvent[]
  /** Total number of events available (for "load more") */
  totalEvents?: number
  /** Callback to fetch more events; receives the current page number */
  onLoadMore?: (page: number) => Promise<TimelineEvent[]>
  className?: string
}

// ---------------------------------------------------------------------------
// Event icon mapping
// ---------------------------------------------------------------------------

const EVENT_ICONS: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; colorClass: string }
> = {
  sent: { icon: Send, colorClass: "bg-blue-100 text-blue-600" },
  delivered: { icon: Mail, colorClass: "bg-blue-100 text-blue-600" },
  opened: { icon: Eye, colorClass: "bg-green-100 text-green-600" },
  clicked: { icon: MousePointer, colorClass: "bg-indigo-100 text-indigo-600" },
  bounced: { icon: AlertTriangle, colorClass: "bg-red-100 text-red-600" },
  hard_bounce: { icon: XCircle, colorClass: "bg-red-100 text-red-600" },
  soft_bounce: { icon: RefreshCw, colorClass: "bg-orange-100 text-orange-600" },
  complained: { icon: AlertTriangle, colorClass: "bg-red-100 text-red-600" },
  unsubscribed: { icon: UserMinus, colorClass: "bg-gray-100 text-gray-600" },
  subscribed: { icon: UserPlus, colorClass: "bg-green-100 text-green-600" },
  list_added: { icon: UserPlus, colorClass: "bg-blue-100 text-blue-600" },
  list_removed: { icon: UserMinus, colorClass: "bg-gray-100 text-gray-600" },
  tag_added: { icon: Tag, colorClass: "bg-purple-100 text-purple-600" },
  tag_removed: { icon: Tag, colorClass: "bg-gray-100 text-gray-600" },
  consent_given: { icon: Shield, colorClass: "bg-green-100 text-green-600" },
  consent_revoked: { icon: Shield, colorClass: "bg-red-100 text-red-600" },
}

const DEFAULT_EVENT = {
  icon: Mail,
  colorClass: "bg-gray-100 text-gray-500",
}

function getEventConfig(type: string) {
  return EVENT_ICONS[type] ?? DEFAULT_EVENT
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ContactTimeline({
  events: initialEvents,
  totalEvents,
  onLoadMore,
  className,
}: ContactTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>(initialEvents)
  const [page, setPage] = useState(1)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const hasMore =
    totalEvents !== undefined ? events.length < totalEvents : false

  const handleLoadMore = useCallback(async () => {
    if (!onLoadMore || isLoadingMore) return
    setIsLoadingMore(true)
    try {
      const nextPage = page + 1
      const more = await onLoadMore(nextPage)
      setEvents((prev) => [...prev, ...more])
      setPage(nextPage)
    } finally {
      setIsLoadingMore(false)
    }
  }, [onLoadMore, page, isLoadingMore])

  if (events.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-12 text-center",
          className
        )}
      >
        <Mail className="mb-3 h-10 w-10 text-gray-300" />
        <p className="text-sm font-medium text-gray-500">No activity yet</p>
        <p className="mt-1 text-xs text-gray-400">
          Events will appear here as you interact with this contact.
        </p>
      </div>
    )
  }

  return (
    <div className={cn("relative", className)}>
      {/* Vertical connector line */}
      <div className="absolute left-5 top-0 h-full w-px bg-gray-200" />

      <ol className="relative space-y-6">
        {events.map((event) => {
          const config = getEventConfig(event.type)
          const Icon = config.icon
          const relativeTime = formatDistanceToNow(new Date(event.created_at), {
            addSuffix: true,
          })
          const meta = event.metadata as Record<string, string | undefined>

          return (
            <li key={event.id} className="relative flex gap-4 pl-0">
              {/* Icon circle */}
              <div
                className={cn(
                  "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                  config.colorClass
                )}
              >
                <Icon className="h-4 w-4" />
              </div>

              {/* Content */}
              <div className="flex-1 pt-0.5">
                <p className="text-sm text-gray-900">{event.description}</p>

                {/* Metadata details */}
                {meta &&
                  Object.keys(meta).length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {meta.campaign_name && (
                        <p className="text-xs text-gray-500">
                          Campaign:{" "}
                          <span className="font-medium">
                            {meta.campaign_name}
                          </span>
                        </p>
                      )}
                      {meta.url && (
                        <p className="max-w-md truncate text-xs text-gray-500">
                          URL:{" "}
                          <span className="font-medium text-indigo-600">
                            {meta.url}
                          </span>
                        </p>
                      )}
                      {meta.list_name && (
                        <p className="text-xs text-gray-500">
                          List:{" "}
                          <span className="font-medium">
                            {meta.list_name}
                          </span>
                        </p>
                      )}
                      {meta.error && (
                        <p className="text-xs text-red-500">
                          Error: {meta.error}
                        </p>
                      )}
                    </div>
                  )}

                <time className="mt-1 block text-xs text-gray-400">
                  {relativeTime}
                </time>
              </div>
            </li>
          )
        })}
      </ol>

      {/* Load more */}
      {hasMore && (
        <div className="mt-6 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore && (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            )}
            {isLoadingMore ? "Loading..." : "Load more"}
          </Button>
        </div>
      )}
    </div>
  )
}
