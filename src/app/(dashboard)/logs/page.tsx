import { createClient } from "@/lib/supabase/server"
import {
  ScrollText,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  User,
  Clock,
  FileText,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuditLogEntry {
  id: string
  created_at: string
  user_id: string | null
  action: string
  resource_type: string
  resource_id: string | null
  description: string | null
  user_name?: string
}

// ---------------------------------------------------------------------------
// Mock data (used as fallback / demo)
// ---------------------------------------------------------------------------

const MOCK_LOGS: AuditLogEntry[] = [
  {
    id: "1",
    created_at: "2025-06-01T14:30:00Z",
    user_id: "u1",
    action: "update",
    resource_type: "organization",
    resource_id: "org_1",
    description: "Updated organization settings",
    user_name: "Alex Johnson",
  },
  {
    id: "2",
    created_at: "2025-06-01T13:15:00Z",
    user_id: "u1",
    action: "create",
    resource_type: "campaign",
    resource_id: "camp_42",
    description: "Created campaign 'Summer Sale 2025'",
    user_name: "Alex Johnson",
  },
  {
    id: "3",
    created_at: "2025-06-01T12:00:00Z",
    user_id: "u2",
    action: "send",
    resource_type: "campaign",
    resource_id: "camp_41",
    description: "Sent campaign 'Weekly Digest #22'",
    user_name: "Jordan Smith",
  },
  {
    id: "4",
    created_at: "2025-06-01T10:45:00Z",
    user_id: "u2",
    action: "delete",
    resource_type: "contact",
    resource_id: "ct_999",
    description: "Deleted contact bounce@invalid.com",
    user_name: "Jordan Smith",
  },
  {
    id: "5",
    created_at: "2025-05-31T17:20:00Z",
    user_id: "u1",
    action: "create",
    resource_type: "api_key",
    resource_id: "ak_3",
    description: "Created API key 'Analytics Dashboard'",
    user_name: "Alex Johnson",
  },
  {
    id: "6",
    created_at: "2025-05-31T16:00:00Z",
    user_id: "u1",
    action: "invite",
    resource_type: "organization_member",
    resource_id: "m_3",
    description: "Invited sam@example.com as editor",
    user_name: "Alex Johnson",
  },
  {
    id: "7",
    created_at: "2025-05-31T14:10:00Z",
    user_id: "u1",
    action: "update",
    resource_type: "template",
    resource_id: "tmpl_12",
    description: "Updated template 'Welcome Email'",
    user_name: "Alex Johnson",
  },
  {
    id: "8",
    created_at: "2025-05-31T11:30:00Z",
    user_id: "u2",
    action: "activate",
    resource_type: "automation",
    resource_id: "auto_5",
    description: "Activated automation 'Onboarding Flow'",
    user_name: "Jordan Smith",
  },
  {
    id: "9",
    created_at: "2025-05-30T09:50:00Z",
    user_id: "u1",
    action: "revoke",
    resource_type: "api_key",
    resource_id: "ak_1",
    description: "Revoked API key 'Legacy Integration'",
    user_name: "Alex Johnson",
  },
  {
    id: "10",
    created_at: "2025-05-30T08:00:00Z",
    user_id: "u2",
    action: "import",
    resource_type: "contact",
    resource_id: null,
    description: "Imported 1,250 contacts from CSV",
    user_name: "Jordan Smith",
  },
]

// ---------------------------------------------------------------------------
// Action badge colours
// ---------------------------------------------------------------------------

const ACTION_VARIANTS: Record<string, "default" | "success" | "warning" | "destructive" | "secondary" | "outline"> = {
  create: "success",
  update: "default",
  delete: "destructive",
  send: "success",
  invite: "default",
  revoke: "warning",
  activate: "success",
  pause: "warning",
  import: "secondary",
}

// ---------------------------------------------------------------------------
// Page (Server Component)
// ---------------------------------------------------------------------------

export default async function AuditLogsPage() {
  // In production, fetch from Supabase. For now we use mock data.
  let logs: AuditLogEntry[] = MOCK_LOGS

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
          .from("audit_logs")
          .select("*")
          .eq("organization_id", member.organization_id)
          .order("created_at", { ascending: false })
          .limit(50)

        if (data && data.length > 0) {
          logs = data.map((row) => ({
            id: row.id,
            created_at: row.created_at,
            user_id: row.user_id,
            action: row.action,
            resource_type: row.resource_type,
            resource_id: row.resource_id,
            description: row.description,
          }))
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
            Audit Logs
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            A record of all actions performed in your organization.
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Filters placeholder */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 py-3">
          <Filter className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-500">Filters:</span>
          <select className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-600">
            <option value="">All Users</option>
            <option value="u1">Alex Johnson</option>
            <option value="u2">Jordan Smith</option>
          </select>
          <select className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-600">
            <option value="">All Actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="send">Send</option>
            <option value="invite">Invite</option>
            <option value="revoke">Revoke</option>
          </select>
          <input
            type="date"
            className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-600"
          />
          <span className="text-xs text-gray-400">to</span>
          <input
            type="date"
            className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-600"
          />
        </CardContent>
      </Card>

      {/* Log table */}
      <Card>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <div className="py-16 text-center">
              <ScrollText className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm text-gray-500">
                No audit log entries found.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase text-gray-500">
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Resource Type</th>
                    <th className="px-4 py-3">Resource ID</th>
                    <th className="px-4 py-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {new Date(log.created_at).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-gray-700">
                            {log.user_name ?? log.user_id ?? "System"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            ACTION_VARIANTS[log.action] ?? "secondary"
                          }
                        >
                          {log.action}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-gray-600">
                            {log.resource_type}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-xs text-gray-500 font-mono">
                          {log.resource_id ?? "-"}
                        </code>
                      </td>
                      <td className="max-w-xs truncate px-4 py-3 text-gray-600">
                        {log.description ?? "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Showing {logs.length} of {logs.length} entries
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled>
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
