import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeft,
  Calendar,
  Clock,
  Copy,
  Edit,
  Eye,
  FileText,
  History,
  Layout,
  Tag,
} from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type {
  EmailTemplate,
  EmailTemplateVersion,
  OrganizationMember,
  TemplateCategory,
} from "@/types/database"

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const metadata = {
  title: "Template Details - MailForge",
}

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

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

interface TemplateDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function TemplateDetailPage({
  params,
}: TemplateDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-gray-500">Please sign in to view this template.</p>
      </div>
    )
  }

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .single() as { data: Pick<OrganizationMember, "organization_id"> | null }

  if (!membership) return notFound()

  // Fetch template
  const { data: template, error } = await supabase
    .from("email_templates")
    .select("*")
    .eq("id", id)
    .eq("organization_id", membership.organization_id)
    .single() as { data: EmailTemplate | null; error: { message: string } | null }

  if (error || !template) return notFound()

  // Fetch version history
  const { data: versions } = await supabase
    .from("email_template_versions")
    .select("*")
    .eq("template_id", id)
    .order("version", { ascending: false })
    .limit(10) as { data: EmailTemplateVersion[] | null }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
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
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{template.name}</h1>
            <Badge variant="secondary">
              {CATEGORY_LABELS[template.category]}
            </Badge>
            <Badge variant="outline">v{template.version}</Badge>
          </div>
          {template.description && (
            <p className="mt-1 text-sm text-gray-500">{template.description}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Created {new Date(template.created_at).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Last modified {new Date(template.updated_at).toLocaleDateString()}
            </span>
            {template.usage_count > 0 && (
              <span className="flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                Used {template.usage_count} time(s)
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button asChild>
            <Link href={`/templates/${template.id}/edit`}>
              <Edit className="h-4 w-4" />
              Edit Template
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/templates/${template.id}/edit`}>
              <Copy className="h-4 w-4" />
              Duplicate
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Preview */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Eye className="h-4 w-4 text-indigo-500" />
                Template Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {template.html_content ? (
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <iframe
                    srcDoc={template.html_content}
                    title="Template preview"
                    className="h-[500px] w-full border-0"
                    sandbox="allow-same-origin"
                  />
                </div>
              ) : (
                <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50">
                  <div className="text-center">
                    <Layout className="mx-auto h-8 w-8 text-gray-300" />
                    <p className="mt-2 text-sm text-gray-500">
                      No content yet
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Template info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Template Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Design Mode</span>
                <span className="font-medium capitalize text-gray-900">
                  {template.design_mode}
                </span>
              </div>
              {template.subject && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Default Subject</span>
                  <span className="max-w-32 truncate font-medium text-gray-900">
                    {template.subject}
                  </span>
                </div>
              )}
              {template.from_name && (
                <div className="flex justify-between">
                  <span className="text-gray-500">From Name</span>
                  <span className="font-medium text-gray-900">
                    {template.from_name}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Shared</span>
                <span className="font-medium text-gray-900">
                  {template.is_shared ? "Yes" : "No"}
                </span>
              </div>
              {template.tags.length > 0 && (
                <div>
                  <span className="text-gray-500">Tags</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {template.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px]">
                        <Tag className="mr-1 h-2.5 w-2.5" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Version history */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <History className="h-4 w-4 text-indigo-500" />
                Version History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {versions && versions.length > 0 ? (
                <div className="space-y-3">
                  {versions.map((version) => (
                    <div
                      key={version.id}
                      className="flex items-start gap-3 border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                        v{version.version}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {version.change_description ?? `Version ${version.version}`}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(version.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No version history</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
