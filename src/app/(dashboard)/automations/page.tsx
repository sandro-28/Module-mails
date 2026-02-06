import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import {
  Workflow,
  Plus,
  Play,
  Pause,
  Copy,
  Trash2,
  BarChart3,
  Pencil,
  MoreHorizontal,
  Users,
  CheckCircle2,
  Clock,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import type { AutomationStatus, AutomationTriggerType } from "@/types/database"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AutomationListItem {
  id: string
  name: string
  description: string | null
  status: AutomationStatus
  trigger_type: AutomationTriggerType
  total_enrolled: number
  total_active: number
  total_completed: number
  created_at: string
}

// ---------------------------------------------------------------------------
// Status badge mapping
// ---------------------------------------------------------------------------

const STATUS_VARIANTS: Record<AutomationStatus, "secondary" | "success" | "warning"> = {
  draft: "secondary",
  active: "success",
  paused: "warning",
  archived: "secondary",
}

// ---------------------------------------------------------------------------
// Trigger label mapping
// ---------------------------------------------------------------------------

const TRIGGER_LABELS: Partial<Record<AutomationTriggerType, string>> = {
  contact_created: "Contact Created",
  contact_added_to_list: "Added to List",
  contact_tag_added: "Tag Added",
  form_submitted: "Form Submitted",
  email_opened: "Email Opened",
  email_clicked: "Email Clicked",
  date_field: "Date Field",
  webhook: "Webhook",
  engagement_score_change: "Engagement Score",
  manual: "Manual",
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_AUTOMATIONS: AutomationListItem[] = [
  {
    id: "auto_1",
    name: "Welcome Onboarding",
    description: "Send a 5-email welcome series to new subscribers",
    status: "active",
    trigger_type: "contact_created",
    total_enrolled: 4_250,
    total_active: 320,
    total_completed: 3_780,
    created_at: "2025-01-15T10:00:00Z",
  },
  {
    id: "auto_2",
    name: "Abandoned Cart Reminder",
    description: "Nudge users who left items in cart",
    status: "active",
    trigger_type: "contact_tag_added",
    total_enrolled: 1_890,
    total_active: 145,
    total_completed: 1_620,
    created_at: "2025-02-20T10:00:00Z",
  },
  {
    id: "auto_3",
    name: "Re-engagement Campaign",
    description: "Win back inactive contacts after 90 days",
    status: "paused",
    trigger_type: "engagement_score_change",
    total_enrolled: 650,
    total_active: 0,
    total_completed: 520,
    created_at: "2025-03-10T10:00:00Z",
  },
  {
    id: "auto_4",
    name: "Birthday Coupon",
    description: null,
    status: "draft",
    trigger_type: "date_field",
    total_enrolled: 0,
    total_active: 0,
    total_completed: 0,
    created_at: "2025-05-28T10:00:00Z",
  },
]

// ---------------------------------------------------------------------------
// Page (Server Component)
// ---------------------------------------------------------------------------

export default async function AutomationsPage() {
  let automations: AutomationListItem[] = MOCK_AUTOMATIONS

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data: member } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .single()

      if (member) {
        const { data } = await supabase
          .from("automations")
          .select(
            "id, name, description, status, trigger_type, total_enrolled, total_active, total_completed, created_at"
          )
          .eq("organization_id", member.organization_id)
          .order("created_at", { ascending: false })

        if (data && data.length > 0) {
          automations = data
        }
      }
    }
  } catch {
    // Use mock data on error
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Automations
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Build automated workflows to engage contacts at the right time.
          </p>
        </div>
        <Button asChild>
          <Link href="/automations/new">
            <Plus className="h-4 w-4" />
            Create Automation
          </Link>
        </Button>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
              <Play className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {automations.filter((a) => a.status === "active").length}
              </p>
              <p className="text-xs text-gray-500">Active Automations</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
              <Users className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {automations.reduce((sum, a) => sum + a.total_active, 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">Contacts in Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {automations.reduce((sum, a) => sum + a.total_completed, 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">Total Completed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Automation list */}
      {automations.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Workflow className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No automations yet
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Create your first automation to start engaging contacts
              automatically.
            </p>
            <Button className="mt-4" asChild>
              <Link href="/automations/new">
                <Plus className="h-4 w-4" />
                Create Automation
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {automations.map((auto) => (
            <Card key={auto.id} className="transition-shadow hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/automations/${auto.id}`}
                        className="text-base font-semibold text-gray-900 hover:text-indigo-600"
                      >
                        {auto.name}
                      </Link>
                      <Badge variant={STATUS_VARIANTS[auto.status]}>
                        {auto.status}
                      </Badge>
                    </div>
                    {auto.description && (
                      <p className="mt-0.5 text-sm text-gray-500">
                        {auto.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {auto.status === "active" ? (
                      <form action={`/automations/${auto.id}/pause`}>
                        <Button variant="ghost" size="sm" title="Pause">
                          <Pause className="h-3.5 w-3.5" />
                        </Button>
                      </form>
                    ) : auto.status !== "archived" ? (
                      <form action={`/automations/${auto.id}/activate`}>
                        <Button variant="ghost" size="sm" title="Activate">
                          <Play className="h-3.5 w-3.5" />
                        </Button>
                      </form>
                    ) : null}
                    <Button variant="ghost" size="sm" title="Edit" asChild>
                      <Link href={`/automations/${auto.id}`}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" title="Duplicate">
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" title="View Stats" asChild>
                      <Link href={`/automations/${auto.id}`}>
                        <BarChart3 className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Metadata */}
                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Zap className="h-3.5 w-3.5" />
                    {TRIGGER_LABELS[auto.trigger_type] ?? auto.trigger_type}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {auto.total_enrolled.toLocaleString()} enrolled
                  </div>
                  <div className="flex items-center gap-1">
                    <Play className="h-3.5 w-3.5" />
                    {auto.total_active.toLocaleString()} active
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {auto.total_completed.toLocaleString()} completed
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(auto.created_at).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
