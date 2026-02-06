"use client"

import { useState, useTransition, useEffect } from "react"
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Info,
  MoreHorizontal,
  Mail,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Modal } from "@/components/ui/modal"
import { Skeleton } from "@/components/ui/skeleton"
import {
  inviteMember,
  removeMember,
  updateMemberRole,
} from "@/app/actions/settings"
import type { OrganizationMemberRole } from "@/types/database"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TeamMember {
  id: string
  user_id: string
  role: OrganizationMemberRole
  invited_email: string | null
  invited_at: string | null
  accepted_at: string | null
  last_active_at: string | null
  name?: string
  email?: string
}

// ---------------------------------------------------------------------------
// Role helpers
// ---------------------------------------------------------------------------

const ROLE_OPTIONS = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "editor", label: "Editor" },
  { value: "viewer", label: "Viewer" },
  { value: "api_only", label: "API Only" },
]

const ROLE_VARIANTS: Record<OrganizationMemberRole, "default" | "success" | "warning" | "secondary" | "outline"> = {
  owner: "default",
  admin: "success",
  editor: "warning",
  viewer: "secondary",
  api_only: "outline",
}

const ROLE_DESCRIPTIONS: Record<OrganizationMemberRole, string> = {
  owner: "Full access. Can manage billing, team, and all resources.",
  admin: "Can manage team members, settings, and all resources.",
  editor: "Can create and edit campaigns, templates, and contacts.",
  viewer: "Read-only access to all resources.",
  api_only: "Access limited to API endpoints only.",
}

// ---------------------------------------------------------------------------
// Mock data (replace with real data fetching)
// ---------------------------------------------------------------------------

const MOCK_MEMBERS: TeamMember[] = [
  {
    id: "1",
    user_id: "u1",
    role: "owner",
    invited_email: null,
    invited_at: null,
    accepted_at: "2025-01-15T10:00:00Z",
    last_active_at: "2025-06-01T14:30:00Z",
    name: "Alex Johnson",
    email: "alex@example.com",
  },
  {
    id: "2",
    user_id: "u2",
    role: "admin",
    invited_email: null,
    invited_at: null,
    accepted_at: "2025-02-01T10:00:00Z",
    last_active_at: "2025-05-28T09:15:00Z",
    name: "Jordan Smith",
    email: "jordan@example.com",
  },
  {
    id: "3",
    user_id: "u3",
    role: "editor",
    invited_email: "sam@example.com",
    invited_at: "2025-05-25T12:00:00Z",
    accepted_at: null,
    last_active_at: null,
    name: undefined,
    email: "sam@example.com",
  },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TeamSettingsPage() {
  const [isPending, startTransition] = useTransition()
  const [members, setMembers] = useState<TeamMember[]>(MOCK_MEMBERS)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<OrganizationMemberRole>("editor")
  const [toast, setToast] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)
  const [showRoleInfo, setShowRoleInfo] = useState(false)

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  function handleInvite() {
    if (!inviteEmail.trim()) return

    startTransition(async () => {
      const result = await inviteMember(inviteEmail.trim(), inviteRole)
      if (result.success) {
        showToast("success", `Invitation sent to ${inviteEmail}`)
        setMembers((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            user_id: "",
            role: inviteRole,
            invited_email: inviteEmail,
            invited_at: new Date().toISOString(),
            accepted_at: null,
            last_active_at: null,
            email: inviteEmail,
          },
        ])
        setInviteEmail("")
      } else {
        showToast("error", result.error ?? "Failed to send invitation")
      }
    })
  }

  function handleRemove(memberId: string) {
    startTransition(async () => {
      const result = await removeMember(memberId)
      if (result.success) {
        setMembers((prev) => prev.filter((m) => m.id !== memberId))
        showToast("success", "Member removed")
      } else {
        showToast("error", result.error ?? "Failed to remove member")
      }
      setConfirmRemove(null)
    })
  }

  function handleRoleChange(memberId: string, role: OrganizationMemberRole) {
    startTransition(async () => {
      const result = await updateMemberRole(memberId, role)
      if (result.success) {
        setMembers((prev) =>
          prev.map((m) => (m.id === memberId ? { ...m, role } : m))
        )
        showToast("success", "Role updated")
      } else {
        showToast("error", result.error ?? "Failed to update role")
      }
    })
  }

  const activeMembers = members.filter((m) => m.accepted_at)
  const pendingMembers = members.filter((m) => !m.accepted_at)

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Team Management
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage team members, roles, and invitations.
        </p>
      </div>

      {/* Toast */}
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

      {/* Invite member */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-gray-400" />
            <CardTitle>Invite Member</CardTitle>
          </div>
          <CardDescription>
            Send an invitation to a new team member.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <Input
                placeholder="colleague@company.com"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-40">
              <Select
                options={ROLE_OPTIONS.filter((r) => r.value !== "owner")}
                value={inviteRole}
                onChange={(e) =>
                  setInviteRole(e.target.value as OrganizationMemberRole)
                }
              />
            </div>
            <Button onClick={handleInvite} loading={isPending}>
              <Mail className="h-4 w-4" />
              Send Invite
            </Button>
          </div>
          <button
            type="button"
            className="mt-3 flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
            onClick={() => setShowRoleInfo(!showRoleInfo)}
          >
            <Info className="h-3.5 w-3.5" />
            Role descriptions
          </button>
          {showRoleInfo && (
            <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 space-y-1.5">
              {ROLE_OPTIONS.map((r) => (
                <div key={r.value}>
                  <span className="font-medium text-gray-800">{r.label}:</span>{" "}
                  {ROLE_DESCRIPTIONS[r.value as OrganizationMemberRole]}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current members */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-400" />
            <CardTitle>Team Members</CardTitle>
          </div>
          <CardDescription>
            {activeMembers.length} active member{activeMembers.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeMembers.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              No active team members yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase text-gray-500">
                    <th className="pb-3 pr-4">Member</th>
                    <th className="pb-3 pr-4">Role</th>
                    <th className="pb-3 pr-4">Last Active</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {activeMembers.map((member) => (
                    <tr key={member.id} className="group">
                      <td className="py-3 pr-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {member.name || "Unknown"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {member.email || member.invited_email}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={ROLE_VARIANTS[member.role]}>
                          {member.role}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-gray-500">
                        {member.last_active_at
                          ? new Date(member.last_active_at).toLocaleDateString()
                          : "Never"}
                      </td>
                      <td className="py-3 text-right">
                        {member.role !== "owner" && (
                          <div className="flex items-center justify-end gap-2">
                            <select
                              className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-600"
                              value={member.role}
                              onChange={(e) =>
                                handleRoleChange(
                                  member.id,
                                  e.target.value as OrganizationMemberRole
                                )
                              }
                            >
                              {ROLE_OPTIONS.filter(
                                (r) => r.value !== "owner"
                              ).map((r) => (
                                <option key={r.value} value={r.value}>
                                  {r.label}
                                </option>
                              ))}
                            </select>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setConfirmRemove(member.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending invitations */}
      {pendingMembers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
            <CardDescription>
              {pendingMembers.length} pending invitation{pendingMembers.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border border-dashed border-gray-200 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                      <Mail className="h-4 w-4 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        {member.invited_email || member.email}
                      </p>
                      <p className="text-xs text-gray-500">
                        Invited{" "}
                        {member.invited_at
                          ? new Date(member.invited_at).toLocaleDateString()
                          : "recently"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={ROLE_VARIANTS[member.role]}>
                      {member.role}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmRemove(member.id)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirm removal modal */}
      <Modal
        open={!!confirmRemove}
        onClose={() => setConfirmRemove(null)}
        title="Remove Member"
        description="Are you sure you want to remove this team member? They will lose access to the organization."
      >
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => setConfirmRemove(null)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            loading={isPending}
            onClick={() => confirmRemove && handleRemove(confirmRemove)}
          >
            Remove Member
          </Button>
        </div>
      </Modal>
    </div>
  )
}
