"use client"

import { useState, useEffect, useRef, useTransition, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Save,
  Eye,
  Monitor,
  Smartphone,
  Code,
  History,
  Loader2,
  Check,
  Clock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { updateTemplate } from "@/app/actions/templates"
import type {
  EmailTemplate,
  EmailTemplateVersion,
  TemplateCategory,
} from "@/types/database"

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

export default function EditTemplatePage() {
  const router = useRouter()
  const params = useParams()
  const templateId = params.id as string

  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(true)
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop")
  const [showVersions, setShowVersions] = useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle")
  const lastSaveRef = useRef<number>(0)

  // Form state
  const [name, setName] = useState("")
  const [category, setCategory] = useState<TemplateCategory>("custom")
  const [subject, setSubject] = useState("")
  const [previewText, setPreviewText] = useState("")
  const [htmlContent, setHtmlContent] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [versions, setVersions] = useState<EmailTemplateVersion[]>([])

  // Fetch template data
  useEffect(() => {
    async function fetchTemplate() {
      try {
        const supabase = createClient()
        const [templateRes, versionsRes] = await Promise.all([
          supabase
            .from("email_templates")
            .select("*")
            .eq("id", templateId)
            .single(),
          supabase
            .from("email_template_versions")
            .select("*")
            .eq("template_id", templateId)
            .order("version", { ascending: false })
            .limit(20),
        ])

        if (templateRes.error) throw templateRes.error

        const t = templateRes.data as EmailTemplate
        setName(t.name)
        setCategory(t.category)
        setSubject(t.subject ?? "")
        setPreviewText(t.preview_text ?? "")
        setHtmlContent(t.html_content ?? "")
        setVersions((versionsRes.data as EmailTemplateVersion[]) ?? [])
      } catch (err) {
        console.error("Failed to load template:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchTemplate()
  }, [templateId])

  // Auto-save every 30 seconds
  const autoSave = useCallback(() => {
    const now = Date.now()
    if (now - lastSaveRef.current < 30_000) return
    if (!name.trim() || !htmlContent.trim()) return

    lastSaveRef.current = now
    setAutoSaveStatus("saving")

    updateTemplate(templateId, {
      name,
      category,
      subject: subject || null,
      preview_text: previewText || null,
      html_content: htmlContent,
    })
      .then(() => {
        setAutoSaveStatus("saved")
        setTimeout(() => setAutoSaveStatus("idle"), 2000)
      })
      .catch(() => {
        setAutoSaveStatus("idle")
      })
  }, [templateId, name, category, subject, previewText, htmlContent])

  useEffect(() => {
    const interval = setInterval(autoSave, 30_000)
    return () => clearInterval(interval)
  }, [autoSave])

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = "Template name is required"
    if (!htmlContent.trim()) newErrors.html = "HTML content is required"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (!validate()) return

    startTransition(async () => {
      try {
        await updateTemplate(templateId, {
          name,
          category,
          subject: subject || null,
          preview_text: previewText || null,
          html_content: htmlContent,
        })
        lastSaveRef.current = Date.now()
        router.push(`/templates/${templateId}`)
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to save template")
      }
    })
  }

  const handleRestoreVersion = (version: EmailTemplateVersion) => {
    setHtmlContent(version.html_content ?? "")
    setSubject(version.subject ?? "")
    setPreviewText(version.preview_text ?? "")
    setShowVersions(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Loading template...</span>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back */}
      <div className="mb-6">
        <Link
          href={`/templates/${templateId}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Template
        </Link>
      </div>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Edit Template</h1>
          {/* Auto-save indicator */}
          {autoSaveStatus === "saving" && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving...
            </span>
          )}
          {autoSaveStatus === "saved" && (
            <span className="flex items-center gap-1 text-xs text-green-600">
              <Check className="h-3 w-3" />
              Saved
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowVersions(!showVersions)}
          >
            <History className="h-4 w-4" />
            Versions
          </Button>
          <Button onClick={handleSave} loading={isPending}>
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Settings sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Name"
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
                label="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />

              <Input
                label="Preview Text"
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
              />
            </CardContent>
          </Card>

          {/* Version history sidebar */}
          {showVersions && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <History className="h-4 w-4 text-indigo-500" />
                  Version History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {versions.length > 0 ? (
                  <div className="max-h-80 space-y-2 overflow-y-auto">
                    {versions.map((version) => (
                      <button
                        key={version.id}
                        type="button"
                        onClick={() => handleRestoreVersion(version)}
                        className="flex w-full items-start gap-2 rounded-lg border border-gray-200 p-3 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50"
                      >
                        <Badge variant="secondary" className="shrink-0 text-[10px]">
                          v{version.version}
                        </Badge>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-700">
                            {version.change_description ?? `Version ${version.version}`}
                          </p>
                          <p className="flex items-center gap-1 text-[10px] text-gray-400">
                            <Clock className="h-2.5 w-2.5" />
                            {new Date(version.created_at).toLocaleString()}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No versions yet</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Editor + Preview */}
        <div className="lg:col-span-3 space-y-4">
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
                className={cn(
                  "h-72 w-full rounded-lg border bg-gray-50 p-4 font-mono text-sm text-gray-800",
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
