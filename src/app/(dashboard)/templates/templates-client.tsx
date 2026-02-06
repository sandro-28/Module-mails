"use client"

import { useState, useTransition, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Search,
  Grid3X3,
  List,
  Copy,
  Pencil,
  Trash2,
  MoreHorizontal,
  FileText,
  Inbox,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { deleteTemplate, duplicateTemplate } from "@/app/actions/templates"
import type { EmailTemplate, TemplateCategory } from "@/types/database"

// ---------------------------------------------------------------------------
// Category labels
// ---------------------------------------------------------------------------

const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  custom: "Custom",
  newsletter: "Newsletter",
  promotion: "Promotion",
  transactional: "Transactional",
  welcome: "Welcome",
  notification: "Notification",
  event: "Event",
  survey: "Survey",
}

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as TemplateCategory[]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface TemplatesClientProps {
  templates: EmailTemplate[]
}

export function TemplatesClient({ templates }: TemplatesClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<TemplateCategory | "all">(
    "all"
  )
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  // Filter and search
  const filtered = useMemo(() => {
    let result = templates
    if (categoryFilter !== "all") {
      result = result.filter((t) => t.category === categoryFilter)
    }
    if (search.trim()) {
      const lower = search.toLowerCase()
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(lower) ||
          t.description?.toLowerCase().includes(lower) ||
          t.subject?.toLowerCase().includes(lower)
      )
    }
    return result
  }, [templates, categoryFilter, search])

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return
    startTransition(async () => {
      try {
        await deleteTemplate(id)
        router.refresh()
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to delete template")
      }
    })
  }

  const handleDuplicate = (id: string) => {
    startTransition(async () => {
      try {
        await duplicateTemplate(id)
        router.refresh()
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to duplicate template")
      }
    })
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-md border border-gray-300 bg-white pl-9 pr-3 text-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(e.target.value as TemplateCategory | "all")
            }
            className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
          >
            <option value="all">All Categories</option>
            {ALL_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>

          {/* View toggle */}
          <div className="flex rounded-lg border border-gray-200 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={cn(
                "rounded-md p-1.5 transition-colors",
                viewMode === "grid"
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:text-gray-900"
              )}
              aria-label="Grid view"
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={cn(
                "rounded-md p-1.5 transition-colors",
                viewMode === "list"
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:text-gray-900"
              )}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <Card className="flex flex-col items-center justify-center py-16">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <Inbox className="h-7 w-7 text-gray-400" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-gray-900">
            No templates found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {search || categoryFilter !== "all"
              ? "Try adjusting your filters."
              : "Get started by creating your first template."}
          </p>
          {!search && categoryFilter === "all" && (
            <Button className="mt-4" asChild>
              <Link href="/templates/new">Create Template</Link>
            </Button>
          )}
        </Card>
      )}

      {/* Grid view */}
      {filtered.length > 0 && viewMode === "grid" && (
        <div className={cn("grid gap-4", "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3")}>
          {filtered.map((template) => (
            <Card
              key={template.id}
              className={cn(
                "group relative overflow-hidden transition-shadow hover:shadow-md",
                isPending && "opacity-70"
              )}
            >
              {/* Thumbnail / Preview */}
              <div className="relative h-40 overflow-hidden border-b border-gray-100 bg-gray-50">
                {template.thumbnail_url ? (
                  <img
                    src={template.thumbnail_url}
                    alt={template.name}
                    className="h-full w-full object-cover"
                  />
                ) : template.html_content ? (
                  <iframe
                    srcDoc={template.html_content}
                    title={template.name}
                    className="pointer-events-none h-full w-full scale-50 border-0"
                    sandbox="allow-same-origin"
                    style={{ transformOrigin: "top left", width: "200%", height: "200%" }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <FileText className="h-10 w-10 text-gray-300" />
                  </div>
                )}

                {/* Hover overlay with actions */}
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button size="sm" asChild>
                    <Link href={`/templates/${template.id}/edit`}>
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleDuplicate(template.id)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Duplicate
                  </Button>
                </div>
              </div>

              {/* Info */}
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <Link
                      href={`/templates/${template.id}`}
                      className="truncate text-sm font-semibold text-gray-900 hover:text-indigo-600"
                    >
                      {template.name}
                    </Link>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">
                        {CATEGORY_LABELS[template.category]}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {new Date(template.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenMenu(
                          openMenu === template.id ? null : template.id
                        )
                      }
                      className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                    {openMenu === template.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setOpenMenu(null)}
                        />
                        <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                          <Link
                            href={`/templates/${template.id}/edit`}
                            onClick={() => setOpenMenu(null)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenu(null)
                              handleDuplicate(template.id)
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            Duplicate
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenu(null)
                              handleDelete(template.id)
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* List view */}
      {filtered.length > 0 && viewMode === "list" && (
        <div className="grid gap-3">
          {filtered.map((template) => (
            <Card
              key={template.id}
              className={cn(
                "transition-shadow hover:shadow-md",
                isPending && "opacity-70"
              )}
            >
              <div className="flex items-center gap-4 p-4">
                {/* Thumbnail small */}
                <div className="h-12 w-16 shrink-0 overflow-hidden rounded border border-gray-200 bg-gray-50">
                  {template.thumbnail_url ? (
                    <img
                      src={template.thumbnail_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <FileText className="h-5 w-5 text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/templates/${template.id}`}
                    className="truncate text-sm font-semibold text-gray-900 hover:text-indigo-600"
                  >
                    {template.name}
                  </Link>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                    <Badge variant="secondary" className="text-[10px]">
                      {CATEGORY_LABELS[template.category]}
                    </Badge>
                    <span>v{template.version}</span>
                    <span>
                      Modified{" "}
                      {new Date(template.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" asChild>
                    <Link href={`/templates/${template.id}/edit`}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDuplicate(template.id)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(template.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
