import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  Clock,
  Edit,
  Mail,
  Send,
  Users,
  MousePointerClick,
  Eye,
  AlertTriangle,
  Ban,
  MessageSquareWarning,
} from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { formatNumber, formatPercentage } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Campaign, CampaignStatus, OrganizationMember } from "@/types/database"

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const metadata = {
  title: "Campaign Details - MailForge",
}

// ---------------------------------------------------------------------------
// Status badge config
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  CampaignStatus,
  { label: string; variant: "secondary" | "default" | "warning" | "success" | "destructive" }
> = {
  draft: { label: "Draft", variant: "secondary" },
  scheduled: { label: "Scheduled", variant: "default" },
  sending: { label: "Sending", variant: "warning" },
  sent: { label: "Sent", variant: "success" },
  paused: { label: "Paused", variant: "warning" },
  cancelled: { label: "Cancelled", variant: "destructive" },
  failed: { label: "Failed", variant: "destructive" },
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

interface CampaignDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function CampaignDetailPage({
  params,
}: CampaignDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-gray-500">Please sign in to view this campaign.</p>
      </div>
    )
  }

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .single() as { data: Pick<OrganizationMember, "organization_id"> | null }

  if (!membership) {
    return notFound()
  }

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .eq("organization_id", membership.organization_id)
    .single() as { data: Campaign | null; error: { message: string } | null }

  if (error || !campaign) {
    return notFound()
  }

  const statusCfg = STATUS_CONFIG[campaign.status]
  const isDraft = campaign.status === "draft"
  const isSent = campaign.status === "sent" || campaign.status === "sending"
  const stats = campaign.stats

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back button */}
      <div className="mb-6">
        <Link
          href="/campaigns"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Campaigns
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {campaign.name}
            </h1>
            <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {campaign.subject}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" />
              {campaign.from_name} &lt;{campaign.from_email}&gt;
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Created {new Date(campaign.created_at).toLocaleDateString()}
            </span>
            {campaign.scheduled_at && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Scheduled {new Date(campaign.scheduled_at).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {isDraft && (
            <Button asChild>
              <Link href={`/campaigns/${campaign.id}`}>
                <Edit className="h-4 w-4" />
                Edit Campaign
              </Link>
            </Button>
          )}
          {isSent && (
            <Button asChild>
              <Link href={`/campaigns/${campaign.id}/report`}>
                <BarChart3 className="h-4 w-4" />
                View Full Report
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Stats cards (for sent campaigns) */}
      {isSent && stats && (
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
          <Card>
            <CardContent className="p-4 text-center">
              <Send className="mx-auto h-5 w-5 text-blue-500" />
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {formatNumber(stats.sent)}
              </p>
              <p className="text-xs text-gray-500">Sent</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Mail className="mx-auto h-5 w-5 text-green-500" />
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {formatNumber(stats.delivered)}
              </p>
              <p className="text-xs text-gray-500">Delivered</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Eye className="mx-auto h-5 w-5 text-indigo-500" />
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {formatNumber(stats.unique_opens)}
              </p>
              <p className="text-xs text-gray-500">
                Opened ({formatPercentage(stats.open_rate)})
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <MousePointerClick className="mx-auto h-5 w-5 text-purple-500" />
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {formatNumber(stats.unique_clicks)}
              </p>
              <p className="text-xs text-gray-500">
                Clicked ({formatPercentage(stats.click_rate)})
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <AlertTriangle className="mx-auto h-5 w-5 text-amber-500" />
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {formatNumber(stats.bounced)}
              </p>
              <p className="text-xs text-gray-500">
                Bounced ({formatPercentage(stats.bounce_rate)})
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Ban className="mx-auto h-5 w-5 text-red-500" />
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {formatNumber(stats.unsubscribed)}
              </p>
              <p className="text-xs text-gray-500">
                Unsubs ({formatPercentage(stats.unsubscribe_rate)})
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <MessageSquareWarning className="mx-auto h-5 w-5 text-red-500" />
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {formatNumber(stats.complained)}
              </p>
              <p className="text-xs text-gray-500">
                Complaints ({formatPercentage(stats.complaint_rate)})
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Campaign details */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main content / preview */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Email Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {campaign.html_content ? (
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <iframe
                    srcDoc={campaign.html_content}
                    title="Email preview"
                    className="h-[500px] w-full border-0"
                    sandbox="allow-same-origin"
                  />
                </div>
              ) : (
                <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50">
                  <div className="text-center">
                    <Mail className="mx-auto h-8 w-8 text-gray-300" />
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
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Campaign Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Type</span>
                <span className="font-medium capitalize text-gray-900">
                  {campaign.type.replace("_", " ")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">From</span>
                <span className="font-medium text-gray-900">
                  {campaign.from_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Recipients</span>
                <span className="font-medium text-gray-900">
                  {formatNumber(campaign.total_recipients)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Lists</span>
                <span className="font-medium text-gray-900">
                  {campaign.list_ids.length} selected
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Segments</span>
                <span className="font-medium text-gray-900">
                  {campaign.segment_ids.length} selected
                </span>
              </div>
              {campaign.sending_started_at && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Sending started</span>
                  <span className="font-medium text-gray-900">
                    {new Date(campaign.sending_started_at).toLocaleString()}
                  </span>
                </div>
              )}
              {campaign.sending_completed_at && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Completed</span>
                  <span className="font-medium text-gray-900">
                    {new Date(campaign.sending_completed_at).toLocaleString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {isSent && (
            <Card>
              <CardContent className="p-4">
                <Button className="w-full" asChild>
                  <Link href={`/campaigns/${campaign.id}/report`}>
                    <BarChart3 className="h-4 w-4" />
                    View Full Report
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
