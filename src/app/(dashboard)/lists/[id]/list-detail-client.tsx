"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Users,
  Zap,
  Search,
  UserPlus,
  UserMinus,
  Settings,
  ChevronLeft,
  ChevronRight,
  Filter,
  Shield,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Modal } from "@/components/ui/modal"
import {
  updateList,
  addContactsToList,
  removeContactFromList,
} from "@/app/actions/lists"
import type { List, SegmentConditionGroup } from "@/types/database"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ListContactRow {
  id: string
  contact_id: string
  status: string
  subscribed_at: string
  contacts: {
    id: string
    email: string
    first_name: string | null
    last_name: string | null
    status: string
    engagement_score: number
    created_at: string
  }
}

interface SimpleContact {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
}

interface ListDetailClientProps {
  list: List
  listContacts: ListContactRow[]
  totalContacts: number
  currentPage: number
  perPage: number
  searchQuery: string
  segmentConditions: SegmentConditionGroup | null
  allContacts: SimpleContact[]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ListDetailClient({
  list,
  listContacts,
  totalContacts,
  currentPage,
  perPage,
  searchQuery,
  segmentConditions,
  allContacts,
}: ListDetailClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Search
  const [search, setSearch] = useState(searchQuery)

  // Settings modal
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [editName, setEditName] = useState(list.name)
  const [editDescription, setEditDescription] = useState(
    list.description ?? ""
  )

  // Add contacts modal
  const [addOpen, setAddOpen] = useState(false)
  const [addSearch, setAddSearch] = useState("")
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(
    new Set()
  )

  const totalPages = Math.ceil(totalContacts / perPage)

  // Existing contact IDs in the list
  const existingContactIds = new Set(listContacts.map((lc) => lc.contact_id))

  // Filter available contacts for the add modal
  const availableContacts = allContacts.filter(
    (c) =>
      !existingContactIds.has(c.id) &&
      (addSearch
        ? c.email.toLowerCase().includes(addSearch.toLowerCase()) ||
          (c.first_name &&
            c.first_name.toLowerCase().includes(addSearch.toLowerCase())) ||
          (c.last_name &&
            c.last_name.toLowerCase().includes(addSearch.toLowerCase()))
        : true)
  )

  // Handlers
  function handleSearch() {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    router.push(`/lists/${list.id}?${params.toString()}`)
  }

  function handleSaveSettings() {
    startTransition(async () => {
      await updateList(list.id, {
        name: editName.trim(),
        description: editDescription.trim() || null,
      })
      setSettingsOpen(false)
      router.refresh()
    })
  }

  function handleAddContacts() {
    if (selectedContactIds.size === 0) return
    startTransition(async () => {
      await addContactsToList(list.id, Array.from(selectedContactIds))
      setAddOpen(false)
      setSelectedContactIds(new Set())
      setAddSearch("")
      router.refresh()
    })
  }

  function handleRemoveContact(contactId: string) {
    if (!confirm("Remove this contact from the list?")) return
    startTransition(async () => {
      await removeContactFromList(list.id, contactId)
      router.refresh()
    })
  }

  function toggleContactSelection(contactId: string) {
    setSelectedContactIds((prev) => {
      const next = new Set(prev)
      if (next.has(contactId)) {
        next.delete(contactId)
      } else {
        next.add(contactId)
      }
      return next
    })
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
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

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <Link
        href="/lists"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Lists
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{list.name}</h1>
            <Badge
              variant={list.type === "dynamic" ? "default" : "secondary"}
            >
              {list.type === "dynamic" && <Zap className="mr-1 h-3 w-3" />}
              {list.type === "static" ? "Static" : "Dynamic"}
            </Badge>
            {list.double_opt_in && (
              <Badge variant="outline">
                <Shield className="mr-1 h-3 w-3" />
                Double opt-in
              </Badge>
            )}
          </div>
          {list.description && (
            <p className="mt-1 text-sm text-gray-500">{list.description}</p>
          )}
          <div className="mt-2 flex items-center gap-1.5 text-sm text-gray-600">
            <Users className="h-4 w-4 text-gray-400" />
            <span className="font-medium">
              {list.contact_count.toLocaleString()}
            </span>
            contacts
          </div>
        </div>
        <div className="flex items-center gap-2">
          {list.type === "static" && (
            <Button variant="outline" onClick={() => setAddOpen(true)}>
              <UserPlus className="h-4 w-4" />
              Add Contacts
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSettingsOpen(true)}
            aria-label="List settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Dynamic list conditions */}
      {list.type === "dynamic" && segmentConditions && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="h-4 w-4" />
              Filter Conditions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">
                Match{" "}
                <span className="font-medium text-gray-700">
                  {segmentConditions.operator === "and" ? "all" : "any"}
                </span>{" "}
                of the following conditions:
              </p>
              <div className="space-y-1.5">
                {segmentConditions.conditions.map((cond, idx) => {
                  if ("field" in cond) {
                    return (
                      <div
                        key={idx}
                        className="rounded-md bg-gray-50 px-3 py-2 text-sm"
                      >
                        <span className="font-medium text-gray-700">
                          {cond.field}
                        </span>{" "}
                        <span className="text-gray-500">
                          {renderOperator(cond.operator)}
                        </span>{" "}
                        {cond.value !== null && (
                          <span className="font-medium text-indigo-600">
                            {String(cond.value)}
                          </span>
                        )}
                      </div>
                    )
                  }
                  return (
                    <div key={idx} className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-500">
                      Nested group ({cond.operator})
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contacts table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Contacts</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="h-8 w-64 rounded-md border border-gray-300 bg-transparent pl-9 pr-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {listContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm font-medium text-gray-900">
                No contacts found
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery
                  ? "Try adjusting your search."
                  : "Add contacts to this list to get started."}
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
                        Subscribed
                      </th>
                      {list.type === "static" && (
                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {listContacts.map((lc) => {
                      const contact = lc.contacts
                      return (
                        <tr
                          key={lc.id}
                          className={cn(
                            "transition-colors hover:bg-gray-50",
                            isPending && "opacity-50"
                          )}
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
                          <td className="px-4 py-3 text-gray-500">
                            {formatDate(lc.subscribed_at)}
                          </td>
                          {list.type === "static" && (
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveContact(lc.contact_id)
                                }
                                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                                title="Remove from list"
                              >
                                <UserMinus className="h-3.5 w-3.5" />
                                Remove
                              </button>
                            </td>
                          )}
                        </tr>
                      )
                    })}
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
                          `/lists/${list.id}?page=${currentPage - 1}${searchQuery ? `&search=${searchQuery}` : ""}`
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
                          `/lists/${list.id}?page=${currentPage + 1}${searchQuery ? `&search=${searchQuery}` : ""}`
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

      {/* Add Contacts Modal */}
      <Modal
        open={addOpen}
        onClose={() => {
          setAddOpen(false)
          setSelectedContactIds(new Set())
          setAddSearch("")
        }}
        title="Add Contacts"
        description="Select contacts to add to this list."
        size="lg"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={addSearch}
              onChange={(e) => setAddSearch(e.target.value)}
              className="h-9 w-full rounded-md border border-gray-300 bg-transparent pl-9 pr-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="max-h-72 overflow-y-auto rounded-md border border-gray-200">
            {availableContacts.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                No available contacts found.
              </div>
            ) : (
              availableContacts.slice(0, 100).map((contact) => (
                <label
                  key={contact.id}
                  className="flex cursor-pointer items-center gap-3 border-b border-gray-100 px-4 py-2.5 transition-colors last:border-b-0 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedContactIds.has(contact.id)}
                    onChange={() => toggleContactSelection(contact.id)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {contact.email}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {[contact.first_name, contact.last_name]
                        .filter(Boolean)
                        .join(" ") || "No name"}
                    </p>
                  </div>
                </label>
              ))
            )}
          </div>

          {selectedContactIds.size > 0 && (
            <p className="text-sm text-gray-600">
              {selectedContactIds.size} contact
              {selectedContactIds.size !== 1 ? "s" : ""} selected
            </p>
          )}

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setAddOpen(false)
                setSelectedContactIds(new Set())
                setAddSearch("")
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddContacts}
              loading={isPending}
              disabled={selectedContactIds.size === 0}
            >
              <UserPlus className="h-4 w-4" />
              Add {selectedContactIds.size > 0
                ? `${selectedContactIds.size} Contact${selectedContactIds.size !== 1 ? "s" : ""}`
                : "Contacts"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Settings Modal */}
      <Modal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="List Settings"
        description="Update list configuration."
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
          <Textarea
            label="Description"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            rows={3}
          />
          <div className="rounded-md bg-gray-50 p-3">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Type:</span>{" "}
              {list.type === "static" ? "Static" : "Dynamic"}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              <span className="font-medium">Double opt-in:</span>{" "}
              {list.double_opt_in ? "Enabled" : "Disabled"}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              <span className="font-medium">Created:</span>{" "}
              {formatDate(list.created_at)}
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setSettingsOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveSettings} loading={isPending}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
