"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Save,
  Eye,
  Monitor,
  Smartphone,
  Code,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createTemplate } from "@/app/actions/templates"
import type { TemplateCategory } from "@/types/database"

// ---------------------------------------------------------------------------
// Category options
// ---------------------------------------------------------------------------

const CATEGORY_OPTIONS: { value: TemplateCategory; label: string }[] = [
  { value: "custom", label: "Custom" },
  { value: "newsletter", label: "Newsletter" },
  { value: "promotion", label: "Promotion" },
  { value: "transactional", label: "Transactional" },
  { value: "welcome", label: "Welcome" },
  { value: "notification", label: "Notification" },
  { value: "event", label: "Event" },
  { value: "survey", label: "Survey" },
]

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function NewTemplatePage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop")

  // Form fields
  const [name, setName] = useState("")
  const [category, setCategory] = useState<TemplateCategory>("custom")
  const [subject, setSubject] = useState("")
  const [previewText, setPreviewText] = useState("")
  const [htmlContent, setHtmlContent] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = "Template name is required"
    if (!htmlContent.trim()) newErrors.html = "HTML content is required"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = (publish: boolean) => {
    if (!validate()) return

    startTransition(async () => {
      try {
        const template = await createTemplate({
          name,
          category,
          subject: subject || null,
          preview_text: previewText || null,
          html_content: htmlContent,
          design_mode: "code",
          is_shared: publish,
        })
        router.push(`/templates/${template.id}`)
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to create template")
      }
    })
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back */}
      <div className="mb-6">
        <Link
          href="/templates"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Templates
        </Link>
      </div>

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Create Template</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            loading={isPending}
          >
            <Save className="h-4 w-4" />
            Save as Draft
          </Button>
          <Button onClick={() => handleSave(true)} loading={isPending}>
            <Save className="h-4 w-4" />
            Publish
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Settings */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Template Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Name"
                placeholder="e.g., Monthly Newsletter"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={errors.name}
              />

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as TemplateCategory)
                  }
                  className="flex h-9 w-full appearance-none rounded-md border border-gray-300 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1"
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Default Subject (optional)"
                placeholder="Email subject line"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />

              <Input
                label="Preview Text (optional)"
                placeholder="Inbox preview text"
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
              />
            </CardContent>
          </Card>
        </div>

        {/* Center + Right: Editor + Preview */}
        <div className="lg:col-span-2 space-y-4">
          {/* Editor */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Code className="h-4 w-4 text-indigo-500" />
                HTML Editor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                placeholder={"<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    /* your styles */\n  </style>\n</head>\n<body>\n  <h1>Hello!</h1>\n  <p>Your email content here.</p>\n</body>\n</html>"}
                className={cn(
                  "h-64 w-full rounded-lg border bg-gray-50 p-4 font-mono text-sm text-gray-800",
                  "focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1",
                  errors.html ? "border-red-500" : "border-gray-300"
                )}
                spellCheck={false}
              />
              {errors.html && (
                <p className="mt-1.5 text-sm text-red-600">{errors.html}</p>
              )}
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Eye className="h-4 w-4 text-indigo-500" />
                Preview
              </CardTitle>
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 p-0.5">
                <button
                  type="button"
                  onClick={() => setPreviewMode("desktop")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    previewMode === "desktop"
                      ? "bg-gray-900 text-white"
                      : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  <Monitor className="h-3.5 w-3.5" />
                  Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("mobile")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    previewMode === "mobile"
                      ? "bg-gray-900 text-white"
                      : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  Mobile
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  "overflow-hidden rounded-lg border border-gray-200 bg-white",
                  previewMode === "mobile" ? "mx-auto max-w-[375px]" : ""
                )}
              >
                {htmlContent ? (
                  <iframe
                    srcDoc={htmlContent}
                    title="Template preview"
                    className="h-96 w-full border-0"
                    sandbox="allow-same-origin"
                  />
                ) : (
                  <div className="flex h-96 items-center justify-center text-sm text-gray-400">
                    <div className="text-center">
                      <Eye className="mx-auto h-8 w-8 text-gray-300" />
                      <p className="mt-2">Start typing HTML to see a preview</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
