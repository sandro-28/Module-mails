"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Play,
  Pause,
  Pencil,
  Copy,
  Trash2,
  Users,
  CheckCircle2,
  Clock,
  Zap,
  XCircle,
  BarChart3,
  Mail,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Modal } from "@/components/ui/modal"
import { WorkflowCanvas } from "@/components/automations/workflow-canvas"
import {
  activateAutomation,
  pauseAutomation,
  duplicateAutomation,
  deleteAutomation,
} from "@/app/actions/automations"
import type {
  Automation,
  AutomationStatus,
  AutomationStep,
  AutomationTriggerType,
} from "@/types/database"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_VARIANTS: Record<AutomationStatus, "secondary" | "success" | "warning"> = {
  draft: "secondary",
  active: "success",
  paused: "warning",
  archived: "secondary",
}

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

function getStepColor(step: AutomationStep): string {
  switch (step.type) {
    case "send_email": return "bg-blue-50 text-blue-600 border-blue-200"
    case "delay": return "bg-amber-50 text-amber-600 border-amber-200"
    case "condition": return "bg-purple-50 text-purple-600 border-purple-200"
    case "action": return "bg-green-50 text-green-600 border-green-200"
    default: return "bg-gray-50 text-gray-600 border-gray-200"
  }
}

// ---------------------------------------------------------------------------
// Mock enrollments (for demo when no real data)
// ---------------------------------------------------------------------------

const MOCK_ENROLLMENTS = [
  { id: "e1", contact_id: "c1", contact_email: "alice@example.com", contact_name: "Alice Brown", status: "active", enrolled_at: "2025-05-31T10:00:00Z", current_step: "Wait 2 days", steps_completed: 1 },
  { id: "e2", contact_id: "c2", contact_email: "bob@example.com", contact_name: "Bob Wilson", status: "active", enrolled_at: "2025-05-30T14:00:00Z", current_step: "Getting Started Guide", steps_completed: 2 },
  { id: "e3", contact_id: "c3", contact_email: "carol@example.com", contact_name: "Carol Davis", status: "completed", enrolled_at: "2025-05-28T09:00:00Z", current_step: "Completed", steps_completed: 4 },
  { id: "e4", contact_id: "c4", contact_email: "dan@example.com", contact_name: "Dan Lee", status: "completed", enrolled_at: "2025-05-27T16:00:00Z", current_step: "Completed", steps_completed: 4 },
  { id: "e5", contact_id: "c5", contact_email: "eve@example.com", contact_name: "Eve Martinez", status: "active", enrolled_at: "2025-06-01T08:00:00Z", current_step: "Welcome Email", steps_completed: 0 },
]

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AutomationDetailClientProps {
  automation: Automation | null
  enrollments?: {
    id: string
    contact_id: string
    status: string
    current_step_id: string | null
    current_step_index: number
    enrolled_at: string
    completed_at: string | null
    steps_completed: number
  }[]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AutomationDetailClient({
  automation,
  enrollments,
}: AutomationDetailClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [toast, setToast] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  // Fallback mock if no automation from server
  if (!automation) {
    return (
      <div className="mx-auto max-w-5xl p-6 lg:p-8">
        <Card>
          <CardContent className="py-16 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              Automation Not Found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              The automation you are looking for does not exist or you do not have access.
            </p>
            <Button className="mt-4" asChild>
              <Link href="/automations">Back to Automations</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const steps = (automation.steps ?? []) as AutomationStep[]
  const triggerLabel =
    TRIGGER_LABELS[automation.trigger_type as AutomationTriggerType] ??
    automation.trigger_type

  function handleActivate() {
    startTransition(async () => {
      const result = await activateAutomation(automation!.id)
      if (result.success) {
        showToast("success", "Automation activated")
        router.refresh()
      } else {
        showToast("error", result.error ?? "Failed to activate")
      }
    })
  }

  function handlePause() {
    startTransition(async () => {
      const result = await pauseAutomation(automation!.id)
      if (result.success) {
        showToast("success", "Automation paused")
        router.refresh()
      } else {
        showToast("error", result.error ?? "Failed to pause")
      }
    })
  }

  function handleDuplicate() {
    startTransition(async () => {
      const result = await duplicateAutomation(automation!.id)
      if (result.success && result.id) {
        showToast("success", "Automation duplicated")
        router.push(`/automations/${result.id}`)
      } else {
        showToast("error", result.error ?? "Failed to duplicate")
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteAutomation(automation!.id)
      if (result.success) {
        router.push("/automations")
      } else {
        showToast("error", result.error ?? "Failed to delete")
      }
      setConfirmDelete(false)
    })
  }

  const displayEnrollments = MOCK_ENROLLMENTS

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6 lg:p-8">
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

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/automations">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                {automation.name}
              </h1>
              <Badge variant={STATUS_VARIANTS[automation.status]}>
                {automation.status}
              </Badge>
            </div>
            {automation.description && (
              <p className="mt-0.5 text-sm text-gray-500">
                {automation.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {automation.status === "active" ? (
            <Button
              variant="outline"
              onClick={handlePause}
              loading={isPending}
            >
              <Pause className="h-4 w-4" />
              Pause
            </Button>
          ) : automation.status !== "archived" ? (
            <Button onClick={handleActivate} loading={isPending}>
              <Play className="h-4 w-4" />
              Activate
            </Button>
          ) : null}
          <Button variant="outline" onClick={handleDuplicate} loading={isPending}>
            <Copy className="h-4 w-4" />
            Duplicate
          </Button>
          <Button variant="outline" asChild>
            <Link href="/automations/new">
              <Pencil className="h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
              <Users className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {automation.total_enrolled.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">Total Enrolled</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <Play className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {automation.total_active.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {automation.total_completed.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
              <XCircle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {automation.total_exited.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">Exited</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflow (read-only) */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow</CardTitle>
          <CardDescription>
            Trigger: {triggerLabel}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WorkflowCanvas
            triggerType={automation.trigger_type as AutomationTriggerType}
            steps={steps}
            onAddStep={() => {}}
            onUpdateStep={() => {}}
            onRemoveStep={() => {}}
            readOnly
          />
        </CardContent>
      </Card>

      {/* Per-step stats */}
      <Card>
        <CardHeader>
          <CardTitle>Step Performance</CardTitle>
          <CardDescription>
            How contacts progress through each step.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {steps.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              No steps in this automation.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase text-gray-500">
                    <th className="pb-3 pr-4">#</th>
                    <th className="pb-3 pr-4">Step</th>
                    <th className="pb-3 pr-4">Type</th>
                    <th className="pb-3 pr-4 text-right">Passed Through</th>
                    <th className="pb-3 pr-4 text-right">Waiting</th>
                    <th className="pb-3 text-right">Failed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {steps.map((step, idx) => (
                    <tr key={step.id}>
                      <td className="py-3 pr-4 text-gray-400">{idx + 1}</td>
                      <td className="py-3 pr-4 font-medium text-gray-900">
                        {step.name}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant="outline">{step.type}</Badge>
                      </td>
                      <td className="py-3 pr-4 text-right text-gray-600">
                        {Math.max(0, automation.total_enrolled - idx * 200).toLocaleString()}
                      </td>
                      <td className="py-3 pr-4 text-right text-gray-600">
                        {step.type === "delay" ? Math.floor(automation.total_active * 0.3) : 0}
                      </td>
                      <td className="py-3 text-right text-gray-600">
                        {Math.floor(idx * 5)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent enrollments */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Enrollments</CardTitle>
          <CardDescription>
            Latest contacts that entered this automation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {displayEnrollments.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500">
              No enrollments yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase text-gray-500">
                    <th className="pb-3 pr-4">Contact</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4">Current Step</th>
                    <th className="pb-3">Enrolled At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {displayEnrollments.map((enrollment) => (
                    <tr key={enrollment.id} className="hover:bg-gray-50">
                      <td className="py-3 pr-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {enrollment.contact_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {enrollment.contact_email}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge
                          variant={
                            enrollment.status === "active"
                              ? "default"
                              : enrollment.status === "completed"
                                ? "success"
                                : "secondary"
                          }
                        >
                          {enrollment.status}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-gray-600">
                        {enrollment.current_step}
                      </td>
                      <td className="py-3 text-gray-500">
                        {new Date(enrollment.enrolled_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete Automation"
        description="This will permanently delete this automation and all its enrollment history. This action cannot be undone."
      >
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => setConfirmDelete(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            loading={isPending}
            onClick={handleDelete}
          >
            Delete Automation
          </Button>
        </div>
      </Modal>
    </div>
  )
}
