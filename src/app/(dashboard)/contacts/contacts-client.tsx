"use client"

import { useState, useCallback, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table"
import { parseAsString, parseAsInteger, useQueryState } from "nuqs"
import {
  Search,
  Plus,
  Download,
  Trash2,
  Tag,
  ListPlus,
  ChevronLeft,
  ChevronRight,
  Users,
  Loader2,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { contactColumns } from "@/components/contacts/contact-table"
import { AddContactModal } from "@/components/contacts/add-contact-modal"
import {
  bulkAddToList,
  bulkAddTag,
  bulkDelete,
  exportContacts,
} from "@/app/actions/contacts"
import type { Contact, ContactStatus } from "@/types/database"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ContactsClientProps {
  contacts: Contact[]
  meta: {
    page: number
    perPage: number
    total: number
    totalPages: number
    hasMore: boolean
  }
  lists: { id: string; name: string }[]
  currentSearch: string
  currentStatus: ContactStatus | "all"
  currentSort: string
  currentSortDirection: "asc" | "desc"
}

// ---------------------------------------------------------------------------
// Status filter buttons
// ---------------------------------------------------------------------------

const STATUS_FILTERS: { value: ContactStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "unsubscribed", label: "Unsubscribed" },
  { value: "bounced", label: "Bounced" },
  { value: "pending", label: "Pending" },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ContactsClient({
  contacts,
  meta,
  lists,
  currentSearch,
  currentStatus,
}: ContactsClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showAddModal, setShowAddModal] = useState(false)
  const [bulkAction, setBulkAction] = useState<string | null>(null)
  const [tagInputValue, setTagInputValue] = useState("")
  const [selectedListId, setSelectedListId] = useState("")
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})

  // URL state with nuqs
  const [search, setSearch] = useQueryState(
    "search",
    parseAsString.withDefault(currentSearch).withOptions({ shallow: false, throttleMs: 400 })
  )
  const [status, setStatus] = useQueryState(
    "status",
    parseAsString.withDefault(currentStatus).withOptions({ shallow: false })
  )
  const [page, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(meta.page).withOptions({ shallow: false })
  )

  // Table setup
  const table = useReactTable({
    data: contacts,
    columns: contactColumns,
    getCoreRowModel: getCoreRowModel(),
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    getRowId: (row) => row.id,
  })

  const selectedIds = Object.keys(rowSelection).filter(
    (id) => rowSelection[id]
  )
  const hasSelection = selectedIds.length > 0

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleStatusFilter = useCallback(
    (value: string) => {
      setStatus(value === "all" ? null : value)
      setPage(1)
      setRowSelection({})
    },
    [setStatus, setPage]
  )

  const handleSearch = useCallback(
    (value: string) => {
      setSearch(value || null)
      setPage(1)
      setRowSelection({})
    },
    [setSearch, setPage]
  )

  const handleRowClick = useCallback(
    (contactId: string) => {
      router.push(`/contacts/${contactId}`)
    },
    [router]
  )

  const handleBulkAddToList = useCallback(() => {
    if (!selectedListId || selectedIds.length === 0) return
    startTransition(async () => {
      await bulkAddToList(selectedIds, selectedListId)
      setRowSelection({})
      setBulkAction(null)
      setSelectedListId("")
      router.refresh()
    })
  }, [selectedIds, selectedListId, router])

  const handleBulkAddTag = useCallback(() => {
    if (!tagInputValue.trim() || selectedIds.length === 0) return
    startTransition(async () => {
      await bulkAddTag(selectedIds, tagInputValue.trim())
      setRowSelection({})
      setBulkAction(null)
      setTagInputValue("")
      router.refresh()
    })
  }, [selectedIds, tagInputValue, router])

  const handleBulkDelete = useCallback(() => {
    if (selectedIds.length === 0) return
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedIds.length} contact(s)? This action cannot be undone.`
    )
    if (!confirmed) return
    startTransition(async () => {
      await bulkDelete(selectedIds)
      setRowSelection({})
      router.refresh()
    })
  }, [selectedIds, router])

  const handleExport = useCallback(() => {
    startTransition(async () => {
      const filters: { status?: ContactStatus; search?: string } = {}
      if (status && status !== "all") filters.status = status as ContactStatus
      if (search) filters.search = search
      const result = await exportContacts(filters)
      if (result.data) {
        const blob = new Blob([result.data], { type: "text/csv" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `contacts-export-${Date.now()}.csv`
        a.click()
        URL.revokeObjectURL(url)
      }
    })
  }, [status, search])

  const handleContactAdded = useCallback(() => {
    router.refresh()
  }, [router])

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <>
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="mt-1 text-sm text-gray-500">
            {meta.total.toLocaleString()} contact{meta.total !== 1 ? "s" : ""} total
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4" />
          Add Contact
        </Button>
      </div>

      {/* Search and filter bar */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search contacts by email, name, or company..."
            className={cn(
              "h-10 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-10 text-sm",
              "placeholder:text-gray-400",
              "focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            )}
          />
          {search && (
            <button
              type="button"
              onClick={() => handleSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-2">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => handleStatusFilter(filter.value)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                (status || "all") === filter.value
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk actions bar */}
      {hasSelection && (
        <div className="flex items-center gap-3 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3">
          <span className="text-sm font-medium text-indigo-700">
            {selectedIds.length} selected
          </span>

          <div className="flex items-center gap-2">
            {/* Add to List */}
            {bulkAction === "addToList" ? (
              <div className="flex items-center gap-2">
                <select
                  value={selectedListId}
                  onChange={(e) => setSelectedListId(e.target.value)}
                  className="h-8 rounded-md border border-gray-300 text-xs"
                >
                  <option value="">Select a list...</option>
                  {lists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.name}
                    </option>
                  ))}
                </select>
                <Button
                  size="sm"
                  onClick={handleBulkAddToList}
                  disabled={!selectedListId || isPending}
                >
                  {isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "Apply"
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setBulkAction(null)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setBulkAction("addToList")}
                className="bg-white"
              >
                <ListPlus className="h-3.5 w-3.5" />
                Add to List
              </Button>
            )}

            {/* Add Tag */}
            {bulkAction === "addTag" ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tagInputValue}
                  onChange={(e) => setTagInputValue(e.target.value)}
                  placeholder="Enter tag..."
                  className="h-8 rounded-md border border-gray-300 px-2 text-xs"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleBulkAddTag()
                  }}
                />
                <Button
                  size="sm"
                  onClick={handleBulkAddTag}
                  disabled={!tagInputValue.trim() || isPending}
                >
                  {isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "Apply"
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setBulkAction(null)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setBulkAction("addTag")}
                className="bg-white"
              >
                <Tag className="h-3.5 w-3.5" />
                Add Tag
              </Button>
            )}

            {/* Export */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleExport}
              disabled={isPending}
              className="bg-white"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>

            {/* Delete */}
            <Button
              size="sm"
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={isPending}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      {contacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-16">
          <Users className="mb-4 h-12 w-12 text-gray-300" />
          <p className="text-lg font-medium text-gray-500">No contacts found</p>
          <p className="mt-1 text-sm text-gray-400">
            {search || status !== "all"
              ? "Try adjusting your search or filters."
              : "Get started by adding your first contact."}
          </p>
          {!search && (status === "all" || !status) && (
            <Button className="mt-4" onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4" />
              Add Contact
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500"
                        style={{ width: header.getSize() }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-gray-100">
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={(e) => {
                      // Don't navigate if clicking on checkbox
                      if ((e.target as HTMLElement).closest("label")) return
                      if ((e.target as HTMLElement).closest('input[type="checkbox"]'))
                        return
                      handleRowClick(row.original.id)
                    }}
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-gray-50",
                      row.getIsSelected() && "bg-indigo-50"
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="whitespace-nowrap px-4 py-3">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3">
            <div className="text-sm text-gray-500">
              Showing{" "}
              <span className="font-medium">
                {(meta.page - 1) * meta.perPage + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min(meta.page * meta.perPage, meta.total)}
              </span>{" "}
              of <span className="font-medium">{meta.total.toLocaleString()}</span>{" "}
              contacts
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={meta.page <= 1}
                onClick={() => setPage(meta.page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              {/* Page numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
                  let pageNum: number
                  if (meta.totalPages <= 5) {
                    pageNum = i + 1
                  } else if (meta.page <= 3) {
                    pageNum = i + 1
                  } else if (meta.page >= meta.totalPages - 2) {
                    pageNum = meta.totalPages - 4 + i
                  } else {
                    pageNum = meta.page - 2 + i
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-md text-xs font-medium transition-colors",
                        meta.page === pageNum
                          ? "bg-indigo-600 text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      )}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                disabled={!meta.hasMore}
                onClick={() => setPage(meta.page + 1)}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      <AddContactModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleContactAdded}
      />
    </>
  )
}
