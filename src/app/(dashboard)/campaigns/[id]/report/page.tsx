import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeft,
  Send,
  Mail,
  Eye,
  MousePointerClick,
  AlertTriangle,
  Ban,
  MessageSquareWarning,
  Forward,
} from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { formatNumber, formatPercentage } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ReportClient } from "./report-client"
import type {
  Campaign,
  CampaignEmail,
  CampaignStatus,
  EmailEvent,
  OrganizationMember,
  TrackedLink,
} from "@/types/database"

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const metadata = {
  title: "Campaign Report - MailForge",
}

// ---------------------------------------------------------------------------
// Status config
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

interface CampaignReportPageProps {
  params: Promise<{ id: string }>
}

export default async function CampaignReportPage({
  params,
}: CampaignReportPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-gray-500">Please sign in to view this report.</p>
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

  // Fetch campaign
  const { data: campaign, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .eq("organization_id", membership.organization_id)
    .single() as { data: Campaign | null; error: { message: string } | null }

  if (error || !campaign) return notFound()

  // Fetch related data in parallel
  const [linksRes, emailsRes, eventsRes] = await Promise.all([
    supabase
      .from("tracked_links")
      .select("*")
      .eq("campaign_id", id)
      .order("unique_clicks", { ascending: false }) as unknown as { data: TrackedLink[] | null },
    supabase
      .from("campaign_emails")
      .select("*")
      .eq("campaign_id", id)
      .order("sent_at", { ascending: false })
      .limit(500) as unknown as { data: CampaignEmail[] | null },
    supabase
      .from("email_events")
      .select("*")
      .eq("campaign_id", id)
      .order("timestamp", { ascending: true })
      .limit(5000) as unknown as { data: EmailEvent[] | null },
  ])

  const statusCfg = STATUS_CONFIG[campaign.status]
  const stats = campaign.stats

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back */}
      <div className="mb-6">
        <Link
          href={`/campaigns/${campaign.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Campaign
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">
            Campaign Report
          </h1>
          <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
        </div>
        <p className="mt-1 text-sm text-gray-500">{campaign.name}</p>
      </div>

      {/* Top-level stat cards */}
      {stats && (
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
          <Card>
            <CardContent className="p-4 text-center">
              <Send className="mx-auto h-5 w-5 text-blue-500" />
              <p className="mt-1 text-xl font-bold text-gray-900">
                {formatNumber(stats.sent)}
              </p>
              <p className="text-xs text-gray-500">Sent</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Mail className="mx-auto h-5 w-5 text-green-500" />
              <p className="mt-1 text-xl font-bold text-gray-900">
                {formatNumber(stats.delivered)}
              </p>
              <p className="text-xs text-gray-500">Delivered</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Eye className="mx-auto h-5 w-5 text-indigo-500" />
              <p className="mt-1 text-xl font-bold text-gray-900">
                {formatNumber(stats.unique_opens)}
              </p>
              <p className="text-xs text-gray-500">
                {formatPercentage(stats.open_rate)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <MousePointerClick className="mx-auto h-5 w-5 text-purple-500" />
              <p className="mt-1 text-xl font-bold text-gray-900">
                {formatNumber(stats.unique_clicks)}
              </p>
              <p className="text-xs text-gray-500">
                {formatPercentage(stats.click_rate)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <AlertTriangle className="mx-auto h-5 w-5 text-amber-500" />
              <p className="mt-1 text-xl font-bold text-gray-900">
                {formatNumber(stats.bounced)}
              </p>
              <p className="text-xs text-gray-500">
                {formatPercentage(stats.bounce_rate)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Ban className="mx-auto h-5 w-5 text-red-500" />
              <p className="mt-1 text-xl font-bold text-gray-900">
                {formatNumber(stats.unsubscribed)}
              </p>
              <p className="text-xs text-gray-500">
                {formatPercentage(stats.unsubscribe_rate)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <MessageSquareWarning className="mx-auto h-5 w-5 text-red-500" />
              <p className="mt-1 text-xl font-bold text-gray-900">
                {formatNumber(stats.complained)}
              </p>
              <p className="text-xs text-gray-500">
                {formatPercentage(stats.complaint_rate)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Forward className="mx-auto h-5 w-5 text-cyan-500" />
              <p className="mt-1 text-xl font-bold text-gray-900">
                {formatNumber(stats.forwarded)}
              </p>
              <p className="text-xs text-gray-500">Forwarded</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Interactive report client */}
      <ReportClient
        campaign={campaign}
        trackedLinks={linksRes.data ?? []}
        campaignEmails={emailsRes.data ?? []}
        events={eventsRes.data ?? []}
      />
    </div>
  )
}
