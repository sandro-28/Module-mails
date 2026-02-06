"use client"

import { useState, useMemo, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Plus,
  Search,
  Users,
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
  ListIcon,
  Zap,
  Calendar,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Modal } from "@/components/ui/modal"
import { createList, deleteList, duplicateList, updateList } from "@/app/actions/lists"
import type { List, ListType } from "@/types/database"

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ListsClientProps {
  lists: List[]
  organizationId: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ListsClient({ lists, organizationId }: ListsClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Search state
  const [search, setSearch] = useState("")

  // Create modal state
  const [createOpen, setCreateOpen] = useState(false)
  const [formName, setFormName] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formType, setFormType] = useState<ListType>("static")
  const [formDoubleOptIn, setFormDoubleOptIn] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Edit modal state
  const [editOpen, setEditOpen] = useState(false)
  const [editingList, setEditingList] = useState<List | null>(null)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")

  // Dropdown state
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  // Filtered lists
  const filteredLists = useMemo(() => {
    if (!search.trim()) return lists
    const q = search.toLowerCase()
    return lists.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        (l.description && l.description.toLowerCase().includes(q))
    )
  }, [lists, search])

  // Handlers

  function resetCreateForm() {
    setFormName("")
    setFormDescription("")
    setFormType("static")
    setFormDoubleOptIn(false)
    setFormError(null)
  }

  function handleCreate() {
    if (!formName.trim()) {
      setFormError("Name is required")
      return
    }

    startTransition(async () => {
      const result = await createList({
        organization_id: organizationId,
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        type: formType,
        double_opt_in: formDoubleOptIn,
      })

      if (result.error) {
        setFormError(result.error)
        return
      }

      setCreateOpen(false)
      resetCreateForm()
      router.refresh()
    })
  }

  function handleEdit(list: List) {
    setEditingList(list)
    setEditName(list.name)
    setEditDescription(list.description ?? "")
    setEditOpen(true)
    setOpenDropdown(null)
  }

  function handleSaveEdit() {
    if (!editingList || !editName.trim()) return

    startTransition(async () => {
      await updateList(editingList.id, {
        name: editName.trim(),
        description: editDescription.trim() || null,
      })
      setEditOpen(false)
      setEditingList(null)
      router.refresh()
    })
  }

  function handleDuplicate(id: string) {
    setOpenDropdown(null)
    startTransition(async () => {
      await duplicateList(id)
      router.refresh()
    })
  }

  function handleDelete(id: string) {
    setOpenDropdown(null)
    if (!confirm("Are you sure you want to delete this list? This action cannot be undone.")) {
      return
    }
    startTransition(async () => {
      await deleteList(id)
      router.refresh()
    })
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lists</h1>
          <p className="mt-1 text-sm text-gray-500">
            Organize your contacts into lists for targeted campaigns.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Create List
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search lists..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* List grid */}
      {filteredLists.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ListIcon className="h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              {search ? "No lists found" : "No lists yet"}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {search
                ? "Try adjusting your search terms."
                : "Create your first list to start organizing contacts."}
            </p>
            {!search && (
              <Button className="mt-4" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                Create List
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredLists.map((list) => (
            <Card
              key={list.id}
              className={cn(
                "group relative cursor-pointer transition-shadow hover:shadow-md",
                isPending && "opacity-70"
              )}
              onClick={() => router.push(`/lists/${list.id}`)}
            >
              <CardContent className="p-5">
                {/* Top row: name + actions */}
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-semibold text-gray-900">
                      {list.name}
                    </h3>
                    {list.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                        {list.description}
                      </p>
                    )}
                  </div>

                  {/* Actions dropdown */}
                  <div className="relative ml-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenDropdown(
                          openDropdown === list.id ? null : list.id
                        )
                      }}
                      className="rounded-md p-1 text-gray-400 opacity-0 transition-opacity hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100"
                      aria-label="List actions"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                    {openDropdown === list.id && (
                      <div
                        className="absolute right-0 z-20 mt-1 w-44 rounded-md border border-gray-200 bg-white py-1 shadow-lg"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => handleEdit(list)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => handleDuplicate(list.id)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                          Duplicate
                        </button>
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(list.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-4 flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">
                      {list.contact_count.toLocaleString()}
                    </span>
                    <span className="text-gray-400">contacts</span>
                  </div>
                  <Badge
                    variant={list.type === "dynamic" ? "default" : "secondary"}
                  >
                    {list.type === "dynamic" && (
                      <Zap className="mr-1 h-3 w-3" />
                    )}
                    {list.type === "static" ? "Static" : "Dynamic"}
                  </Badge>
                </div>

                {/* Created date */}
                <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
                  <Calendar className="h-3.5 w-3.5" />
                  Created {formatDate(list.created_at)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create List Modal */}
      <Modal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false)
          resetCreateForm()
        }}
        title="Create List"
        description="Create a new contact list for your campaigns."
      >
        <div className="space-y-4">
          <Input
            label="Name"
            placeholder="e.g. Newsletter Subscribers"
            value={formName}
            onChange={(e) => {
              setFormName(e.target.value)
              setFormError(null)
            }}
            error={formError ?? undefined}
          />
          <Textarea
            label="Description"
            placeholder="Optional description for this list"
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            rows={3}
          />
          <Select
            label="Type"
            value={formType}
            onChange={(e) => setFormType(e.target.value as ListType)}
            options={[
              { value: "static", label: "Static - Manually manage contacts" },
              {
                value: "dynamic",
                label: "Dynamic - Auto-populated by segment rules",
              },
            ]}
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={formDoubleOptIn}
              onClick={() => setFormDoubleOptIn(!formDoubleOptIn)}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                formDoubleOptIn ? "bg-indigo-600" : "bg-gray-200"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform",
                  formDoubleOptIn ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
            <div>
              <p className="text-sm font-medium text-gray-700">
                Double opt-in
              </p>
              <p className="text-xs text-gray-500">
                Require email confirmation before adding contacts.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setCreateOpen(false)
                resetCreateForm()
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} loading={isPending}>
              Create List
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit List Modal */}
      <Modal
        open={editOpen}
        onClose={() => {
          setEditOpen(false)
          setEditingList(null)
        }}
        title="Edit List"
        description="Update your list name and description."
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
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditOpen(false)
                setEditingList(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} loading={isPending}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
