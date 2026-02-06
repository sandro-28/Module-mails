"use client"

import { useState, useTransition } from "react"
import {
  Webhook,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Play,
  Copy,
  Radio,
  XCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Modal } from "@/components/ui/modal"
import { createWebhook, deleteWebhook } from "@/app/actions/settings"
import type { WebhookEventType } from "@/types/database"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EVENT_OPTIONS: { key: WebhookEventType; label: string; group: string }[] = [
  { key: "contact.created", label: "Contact Created", group: "Contacts" },
  { key: "contact.updated", label: "Contact Updated", group: "Contacts" },
  { key: "contact.deleted", label: "Contact Deleted", group: "Contacts" },
  { key: "contact.subscribed", label: "Contact Subscribed", group: "Contacts" },
  { key: "contact.unsubscribed", label: "Contact Unsubscribed", group: "Contacts" },
  { key: "email.sent", label: "Email Sent", group: "Email" },
  { key: "email.delivered", label: "Email Delivered", group: "Email" },
  { key: "email.opened", label: "Email Opened", group: "Email" },
  { key: "email.clicked", label: "Email Clicked", group: "Email" },
  { key: "email.bounced", label: "Email Bounced", group: "Email" },
  { key: "email.complained", label: "Email Complained", group: "Email" },
  { key: "campaign.sent", label: "Campaign Sent", group: "Campaigns" },
  { key: "campaign.completed", label: "Campaign Completed", group: "Campaigns" },
  { key: "form.submitted", label: "Form Submitted", group: "Forms" },
  { key: "automation.enrolled", label: "Automation Enrolled", group: "Automations" },
  { key: "automation.completed", label: "Automation Completed", group: "Automations" },
]

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WebhookItem {
  id: string
  url: string
  name: string
  events: WebhookEventType[]
  is_active: boolean
  last_triggered_at: string | null
  total_failures: number
  consecutive_failures: number
  created_at: string
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_WEBHOOKS: WebhookItem[] = [
  {
    id: "1",
    url: "https://api.example.com/webhooks/mailforge",
    name: "CRM Integration",
    events: ["contact.created", "contact.updated", "email.opened"],
    is_active: true,
    last_triggered_at: "2025-06-01T14:30:00Z",
    total_failures: 2,
    consecutive_failures: 0,
    created_at: "2025-01-15T10:00:00Z",
  },
  {
    id: "2",
    url: "https://hooks.slack.com/services/T00/B00/xxxx",
    name: "Slack Notifications",
    events: ["campaign.sent", "email.bounced", "email.complained"],
    is_active: false,
    last_triggered_at: "2025-05-20T08:15:00Z",
    total_failures: 15,
    consecutive_failures: 5,
    created_at: "2025-02-20T10:00:00Z",
  },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function WebhooksPage() {
  const [isPending, startTransition] = useTransition()
  const [webhooks, setWebhooks] = useState<WebhookItem[]>(MOCK_WEBHOOKS)
  const [showCreate, setShowCreate] = useState(false)
  const [newUrl, setNewUrl] = useState("")
  const [newName, setNewName] = useState("")
  const [newEvents, setNewEvents] = useState<WebhookEventType[]>([])
  const [createdSecret, setCreatedSecret] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  function toggleEvent(event: WebhookEventType) {
    setNewEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    )
  }

  function handleCreate() {
    if (!newUrl.trim() || newEvents.length === 0) return

    startTransition(async () => {
      const result = await createWebhook(newUrl.trim(), newEvents, newName || undefined)
      if (result.success) {
        setCreatedSecret(result.secret ?? null)
        setWebhooks((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            url: newUrl,
            name: newName || newUrl,
            events: newEvents,
            is_active: true,
            last_triggered_at: null,
            total_failures: 0,
            consecutive_failures: 0,
            created_at: new Date().toISOString(),
          },
        ])
        showToast("success", "Webhook created successfully")
      } else {
        showToast("error", result.error ?? "Failed to create webhook")
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteWebhook(id)
      if (result.success) {
        setWebhooks((prev) => prev.filter((w) => w.id !== id))
        showToast("success", "Webhook deleted")
      } else {
        showToast("error", result.error ?? "Failed to delete webhook")
      }
      setConfirmDelete(null)
    })
  }

  function handleTest(id: string) {
    setTestingId(id)
    setTimeout(() => {
      setTestingId(null)
      showToast("success", "Test payload sent successfully")
    }, 1500)
  }

  function copySecret() {
    if (createdSecret) {
      navigator.clipboard.writeText(createdSecret)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Group events by category for the create modal
  const groupedEvents = EVENT_OPTIONS.reduce(
    (acc, ev) => {
      if (!acc[ev.group]) acc[ev.group] = []
      acc[ev.group].push(ev)
      return acc
    },
    {} as Record<string, typeof EVENT_OPTIONS>
  )

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Webhooks
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Receive real-time notifications when events happen in MailForge.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          Create Webhook
        </Button>
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

      {/* Webhook list */}
      {webhooks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Webhook className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">
              No webhooks configured yet. Create one to start receiving events.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {webhooks.map((wh) => (
            <Card key={wh.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Radio
                        className={cn(
                          "h-4 w-4",
                          wh.is_active ? "text-green-500" : "text-gray-400"
                        )}
                      />
                      <span className="font-medium text-gray-900">
                        {wh.name}
                      </span>
                      <Badge
                        variant={wh.is_active ? "success" : "secondary"}
                      >
                        {wh.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <code className="mt-1 block truncate text-xs text-gray-500 font-mono">
                      {wh.url}
                    </code>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      loading={testingId === wh.id}
                      onClick={() => handleTest(wh.id)}
                    >
                      <Play className="h-3.5 w-3.5" />
                      Test
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setConfirmDelete(wh.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                  {wh.events.map((ev) => (
                    <Badge key={ev} variant="outline">
                      {ev}
                    </Badge>
                  ))}
                </div>

                <div className="mt-3 flex gap-4 text-xs text-gray-500">
                  <span>
                    Last triggered:{" "}
                    {wh.last_triggered_at
                      ? new Date(wh.last_triggered_at).toLocaleString()
                      : "Never"}
                  </span>
                  {wh.total_failures > 0 && (
                    <span className="text-red-500">
                      {wh.consecutive_failures} consecutive failure{wh.consecutive_failures !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create webhook modal */}
      <Modal
        open={showCreate && !createdSecret}
        onClose={() => {
          setShowCreate(false)
          setNewUrl("")
          setNewName("")
          setNewEvents([])
        }}
        title="Create Webhook"
        description="Configure a new webhook endpoint."
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Name (optional)"
            placeholder="e.g., CRM Integration"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Input
            label="Endpoint URL"
            placeholder="https://api.example.com/webhooks"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            type="url"
          />
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Events ({newEvents.length} selected)
            </label>
            <div className="max-h-64 space-y-4 overflow-y-auto rounded-lg border border-gray-200 p-3">
              {Object.entries(groupedEvents).map(([group, events]) => (
                <div key={group}>
                  <p className="mb-1.5 text-xs font-semibold uppercase text-gray-400">
                    {group}
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {events.map((ev) => (
                      <label
                        key={ev.key}
                        className={cn(
                          "flex cursor-pointer items-center gap-2 rounded border px-2.5 py-1.5 text-xs transition-colors",
                          newEvents.includes(ev.key)
                            ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={newEvents.includes(ev.key)}
                          onChange={() => toggleEvent(ev.key)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        {ev.label}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreate(false)
                setNewUrl("")
                setNewName("")
                setNewEvents([])
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              loading={isPending}
              disabled={!newUrl.trim() || newEvents.length === 0}
            >
              Create Webhook
            </Button>
          </div>
        </div>
      </Modal>

      {/* Show secret once */}
      <Modal
        open={!!createdSecret}
        onClose={() => {
          setCreatedSecret(null)
          setShowCreate(false)
          setNewUrl("")
          setNewName("")
          setNewEvents([])
        }}
        title="Webhook Secret"
        description="Save this secret to verify webhook signatures. It will not be shown again."
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertCircle className="h-4 w-4 shrink-0" />
            This secret will only be shown once.
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 break-all rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm font-mono text-gray-800">
              {createdSecret}
            </code>
            <Button variant="outline" size="icon" onClick={copySecret}>
              {copied ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setCreatedSecret(null)
                setShowCreate(false)
                setNewUrl("")
                setNewName("")
                setNewEvents([])
              }}
            >
              Done
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm delete */}
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete Webhook"
        description="This action cannot be undone. The webhook will stop receiving events immediately."
      >
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => setConfirmDelete(null)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            loading={isPending}
            onClick={() => confirmDelete && handleDelete(confirmDelete)}
          >
            Delete Webhook
          </Button>
        </div>
      </Modal>
    </div>
  )
}
