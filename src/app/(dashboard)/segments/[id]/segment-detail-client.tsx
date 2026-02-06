"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Users,
  Filter,
  RefreshCw,
  Pencil,
  Clock,
  ChevronLeft,
  ChevronRight,
  Save,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Modal } from "@/components/ui/modal"
import { SegmentBuilder } from "@/components/contacts/segment-builder"
import { updateSegment, recalculateSegment } from "@/app/actions/segments"
import type { Segment, SegmentConditionGroup } from "@/types/database"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ContactRow {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  status: string
  engagement_score: number
  tags: string[]
  created_at: string
}

interface SegmentDetailClientProps {
  segment: Segment
  contacts: ContactRow[]
  totalContacts: number
  currentPage: number
  perPage: number
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SegmentDetailClient({
  segment,
  contacts,
  totalContacts,
  currentPage,
  perPage,
}: SegmentDetailClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Edit mode
  const [editOpen, setEditOpen] = useState(false)
  const [editName, setEditName] = useState(segment.name)
  const [editDescription, setEditDescription] = useState(
    segment.description ?? ""
  )
  const [editConditions, setEditConditions] = useState<SegmentConditionGroup>(
    segment.conditions
  )

  const totalPages = Math.ceil(totalContacts / perPage)

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

  function renderOperator(op: string) {
    const labels: Record<string, string> = {
      equals: "equals",
      not_equals: "does not equal",
      contains: "contains",
      not_contains: "does not contain",
      starts_with: "starts with",
      ends_with: "ends with",
      greater_than: "is greater than",
      less_than: "is less than",
      before: "is before",
      after: "is after",
      within_last: "is within the last",
      not_within_last: "is not within the last",
      is_set: "is set",
      is_not_set: "is not set",
      in: "is in",
      not_in: "is not in",
      between: "is between",
    }
    return labels[op] ?? op
  }

  function handleRecalculate() {
    startTransition(async () => {
      await recalculateSegment(segment.id)
      router.refresh()
    })
  }

  function handleSaveEdit() {
    if (!editName.trim()) return
    startTransition(async () => {
      await updateSegment(segment.id, {
        name: editName.trim(),
        description: editDescription.trim() || null,
        conditions: editConditions,
      })
      setEditOpen(false)
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <Link
        href="/segments"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Segments
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {segment.name}
            </h1>
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
          <div className="mt-2 flex items-center gap-5 text-sm text-gray-600">
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-gray-400" />
              <span className="font-medium">
                {segment.contact_count.toLocaleString()}
              </span>
              contacts
            </div>
            <div className="flex items-center gap-1.5 text-gray-500">
              <Clock className="h-3.5 w-3.5" />
              Last calculated: {formatDate(segment.last_calculated_at)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRecalculate}
            loading={isPending}
          >
            <RefreshCw className="h-4 w-4" />
            Recalculate
          </Button>
          <Button
            variant="outline"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      {/* Conditions display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            Conditions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">
              Match{" "}
              <span className="font-medium text-gray-700">
                {segment.conditions.operator === "and" ? "all" : "any"}
              </span>{" "}
              of the following:
            </p>
            <div className="space-y-1.5">
              {segment.conditions.conditions.map((cond, idx) => {
                if ("field" in cond) {
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2 text-sm"
                    >
                      {idx > 0 && (
                        <Badge
                          variant={
                            segment.conditions.operator === "and"
                              ? "default"
                              : "warning"
                          }
                          className="mr-1 text-[10px]"
                        >
                          {segment.conditions.operator.toUpperCase()}
                        </Badge>
                      )}
                      <span className="font-medium text-gray-700">
                        {cond.field}
                      </span>
                      <span className="text-gray-500">
                        {renderOperator(cond.operator)}
                      </span>
                      {cond.value !== null && cond.value !== "" && (
                        <span className="font-medium text-indigo-600">
                          {typeof cond.value === "object"
                            ? JSON.stringify(cond.value)
                            : String(cond.value)}
                        </span>
                      )}
                    </div>
                  )
                }
                return (
                  <div
                    key={idx}
                    className="rounded-md border border-dashed border-gray-300 bg-gray-50/50 px-3 py-2 text-sm text-gray-500"
                  >
                    Nested group ({cond.operator}) with{" "}
                    {cond.conditions.length} condition
                    {cond.conditions.length !== 1 ? "s" : ""}
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Matching contacts table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Matching Contacts ({totalContacts.toLocaleString()})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm font-medium text-gray-900">
                No matching contacts
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Adjust conditions or wait for new contacts to match.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-md border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-200 bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Score
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Tags
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Joined
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {contacts.map((contact) => (
                      <tr
                        key={contact.id}
                        className="transition-colors hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {contact.email}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {[contact.first_name, contact.last_name]
                            .filter(Boolean)
                            .join(" ") || "--"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              contact.status === "active"
                                ? "success"
                                : contact.status === "bounced"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {contact.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {contact.engagement_score}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {contact.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {contact.tags.length > 3 && (
                              <span className="text-xs text-gray-400">
                                +{contact.tags.length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {formatDate(contact.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Showing {(currentPage - 1) * perPage + 1} to{" "}
                    {Math.min(currentPage * perPage, totalContacts)} of{" "}
                    {totalContacts} contacts
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage <= 1}
                      onClick={() =>
                        router.push(
                          `/segments/${segment.id}?page=${currentPage - 1}`
                        )
                      }
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage >= totalPages}
                      onClick={() =>
                        router.push(
                          `/segments/${segment.id}?page=${currentPage + 1}`
                        )
                      }
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Modal
        open={editOpen}
        onClose={() => {
          setEditOpen(false)
          setEditName(segment.name)
          setEditDescription(segment.description ?? "")
          setEditConditions(segment.conditions)
        }}
        title="Edit Segment"
        description="Update segment details and conditions."
        size="xl"
      >
        <div className="space-y-5">
          <Input
            label="Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
          <Textarea
            label="Description"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            rows={2}
          />

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Conditions
            </label>
            <SegmentBuilder
              value={editConditions}
              onChange={setEditConditions}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditOpen(false)
                setEditName(segment.name)
                setEditDescription(segment.description ?? "")
                setEditConditions(segment.conditions)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} loading={isPending}>
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
