"use client"

import { useState, useTransition } from "react"
import {
  Building2,
  Globe,
  Mail,
  Clock,
  Save,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { updateOrganization } from "@/app/actions/settings"
import type { Organization } from "@/types/database"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TIMEZONE_OPTIONS = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "Eastern Time (US)" },
  { value: "America/Chicago", label: "Central Time (US)" },
  { value: "America/Denver", label: "Mountain Time (US)" },
  { value: "America/Los_Angeles", label: "Pacific Time (US)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Europe/Berlin", label: "Berlin (CET)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)" },
  { value: "Asia/Kolkata", label: "Kolkata (IST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
]

const INDUSTRY_OPTIONS = [
  { value: "technology", label: "Technology" },
  { value: "saas", label: "SaaS" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "finance", label: "Finance" },
  { value: "healthcare", label: "Healthcare" },
  { value: "education", label: "Education" },
  { value: "media", label: "Media & Publishing" },
  { value: "marketing", label: "Marketing & Agency" },
  { value: "nonprofit", label: "Nonprofit" },
  { value: "other", label: "Other" },
]

const LOCALE_OPTIONS = [
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "es-ES", label: "Spanish" },
  { value: "fr-FR", label: "French" },
  { value: "de-DE", label: "German" },
  { value: "pt-BR", label: "Portuguese (BR)" },
  { value: "ja-JP", label: "Japanese" },
  { value: "zh-CN", label: "Chinese (Simplified)" },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface SettingsClientProps {
  organization: Organization | null
}

export function SettingsClient({ organization }: SettingsClientProps) {
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)

  const [form, setForm] = useState({
    name: organization?.name ?? "",
    slug: organization?.slug ?? "",
    website: organization?.website ?? "",
    industry: (organization?.metadata as Record<string, string>)?.industry ?? "",
    default_from_name: organization?.default_from_name ?? "",
    default_from_email: organization?.default_from_email ?? "",
    default_reply_to: organization?.default_reply_to ?? "",
    timezone: organization?.timezone ?? "UTC",
    locale: (organization?.metadata as Record<string, string>)?.locale ?? "en-US",
  })

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateOrganization({
        name: form.name,
        slug: form.slug,
        website: form.website || undefined,
        default_from_name: form.default_from_name || undefined,
        default_from_email: form.default_from_email || undefined,
        default_reply_to: form.default_reply_to || undefined,
        timezone: form.timezone,
      })

      if (result.success) {
        showToast("success", "Settings saved successfully.")
      } else {
        showToast("error", result.error ?? "Failed to save settings.")
      }
    })
  }

  if (!organization) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-gray-400" />
          <p className="mt-3 text-sm text-gray-500">
            No organization found. Please create or join an organization first.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {toast && (
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg border px-4 py-3 text-sm shadow-sm",
            toast.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          )}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          {toast.message}
        </div>
      )}

      {/* Organization details */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-gray-400" />
            <CardTitle>Organization Details</CardTitle>
          </div>
          <CardDescription>
            Basic information about your organization.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Organization Name"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="Acme Inc."
            />
            <Input
              label="Slug"
              value={form.slug}
              onChange={(e) => updateField("slug", e.target.value)}
              placeholder="acme-inc"
              helperText="Used in URLs and API references"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Website"
              value={form.website}
              onChange={(e) => updateField("website", e.target.value)}
              placeholder="https://acme.com"
              type="url"
            />
            <Select
              label="Industry"
              value={form.industry}
              onChange={(e) => updateField("industry", e.target.value)}
              options={INDUSTRY_OPTIONS}
              placeholder="Select industry"
            />
          </div>
        </CardContent>
      </Card>

      {/* Email defaults */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-gray-400" />
            <CardTitle>Email Defaults</CardTitle>
          </div>
          <CardDescription>
            Default sender information used for new campaigns and automations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Default From Name"
              value={form.default_from_name}
              onChange={(e) => updateField("default_from_name", e.target.value)}
              placeholder="Acme Inc."
            />
            <Input
              label="Default From Email"
              value={form.default_from_email}
              onChange={(e) =>
                updateField("default_from_email", e.target.value)
              }
              placeholder="hello@acme.com"
              type="email"
            />
          </div>
          <Input
            label="Default Reply-To"
            value={form.default_reply_to}
            onChange={(e) => updateField("default_reply_to", e.target.value)}
            placeholder="support@acme.com"
            type="email"
            helperText="Replies to your emails will be sent to this address"
          />
        </CardContent>
      </Card>

      {/* Locale and timezone */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-400" />
            <CardTitle>Regional Settings</CardTitle>
          </div>
          <CardDescription>
            Configure timezone and locale for scheduling and formatting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Timezone"
              value={form.timezone}
              onChange={(e) => updateField("timezone", e.target.value)}
              options={TIMEZONE_OPTIONS}
            />
            <Select
              label="Locale"
              value={form.locale}
              onChange={(e) => updateField("locale", e.target.value)}
              options={LOCALE_OPTIONS}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSave} loading={isPending}>
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
