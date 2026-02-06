"use client"

import { useState, useTransition } from "react"
import {
  Key,
  Plus,
  Copy,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ExternalLink,
  Shield,
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
import { createApiKey, revokeApiKey } from "@/app/actions/settings"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PERMISSION_OPTIONS = [
  { key: "contacts:read", label: "Read Contacts" },
  { key: "contacts:write", label: "Write Contacts" },
  { key: "campaigns:read", label: "Read Campaigns" },
  { key: "campaigns:write", label: "Write Campaigns" },
  { key: "templates:read", label: "Read Templates" },
  { key: "templates:write", label: "Write Templates" },
  { key: "lists:read", label: "Read Lists" },
  { key: "lists:write", label: "Write Lists" },
  { key: "analytics:read", label: "Read Analytics" },
  { key: "webhooks:manage", label: "Manage Webhooks" },
  { key: "sending:send", label: "Send Emails" },
]

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ApiKeyItem {
  id: string
  name: string
  key_prefix: string
  scopes: string[]
  last_used_at: string | null
  created_at: string
  is_active: boolean
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_KEYS: ApiKeyItem[] = [
  {
    id: "1",
    name: "Production API",
    key_prefix: "mf_live_aBc...",
    scopes: ["contacts:read", "contacts:write", "sending:send"],
    last_used_at: "2025-06-01T14:30:00Z",
    created_at: "2025-01-10T10:00:00Z",
    is_active: true,
  },
  {
    id: "2",
    name: "Analytics Dashboard",
    key_prefix: "mf_live_xYz...",
    scopes: ["analytics:read", "campaigns:read"],
    last_used_at: "2025-05-28T09:00:00Z",
    created_at: "2025-03-05T10:00:00Z",
    is_active: true,
  },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ApiKeysPage() {
  const [isPending, startTransition] = useTransition()
  const [keys, setKeys] = useState<ApiKeyItem[]>(MOCK_KEYS)
  const [showCreate, setShowCreate] = useState(false)
  const [newKeyName, setNewKeyName] = useState("")
  const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>([])
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [toast, setToast] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  function togglePermission(perm: string) {
    setNewKeyPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    )
  }

  function handleCreate() {
    if (!newKeyName.trim()) return

    startTransition(async () => {
      const result = await createApiKey(newKeyName.trim(), newKeyPermissions)
      if (result.success && result.key) {
        setCreatedKey(result.key)
        setKeys((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            name: newKeyName,
            key_prefix: result.key!.slice(0, 12) + "...",
            scopes: newKeyPermissions,
            last_used_at: null,
            created_at: new Date().toISOString(),
            is_active: true,
          },
        ])
        setNewKeyName("")
        setNewKeyPermissions([])
        showToast("success", "API key created successfully")
      } else {
        showToast("error", result.error ?? "Failed to create API key")
      }
    })
  }

  function handleRevoke(id: string) {
    startTransition(async () => {
      const result = await revokeApiKey(id)
      if (result.success) {
        setKeys((prev) =>
          prev.map((k) => (k.id === id ? { ...k, is_active: false } : k))
        )
        showToast("success", "API key revoked")
      } else {
        showToast("error", result.error ?? "Failed to revoke key")
      }
      setConfirmRevoke(null)
    })
  }

  function copyKey() {
    if (createdKey) {
      navigator.clipboard.writeText(createdKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            API Keys
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage API keys for programmatic access to MailForge.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          Create API Key
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

      {/* Key list */}
      <Card>
        <CardHeader>
          <CardTitle>Active Keys</CardTitle>
          <CardDescription>
            {keys.filter((k) => k.is_active).length} active API key{keys.filter((k) => k.is_active).length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {keys.filter((k) => k.is_active).length === 0 ? (
            <div className="py-12 text-center">
              <Key className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm text-gray-500">
                No API keys yet. Create one to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {keys
                .filter((k) => k.is_active)
                .map((key) => (
                  <div
                    key={key.id}
                    className="rounded-lg border border-gray-200 p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Key className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {key.name}
                          </span>
                        </div>
                        <code className="mt-1 block text-xs text-gray-500 font-mono">
                          {key.key_prefix}
                        </code>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setConfirmRevoke(key.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {key.scopes.map((scope) => (
                        <Badge key={scope} variant="secondary">
                          {scope}
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-3 flex gap-4 text-xs text-gray-500">
                      <span>
                        Last used:{" "}
                        {key.last_used_at
                          ? new Date(key.last_used_at).toLocaleDateString()
                          : "Never"}
                      </span>
                      <span>
                        Created:{" "}
                        {new Date(key.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}

          <div className="mt-6 flex items-center gap-2 text-xs text-gray-500">
            <ExternalLink className="h-3.5 w-3.5" />
            <a href="#" className="underline hover:text-gray-700">
              View API documentation
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Create key modal */}
      <Modal
        open={showCreate && !createdKey}
        onClose={() => {
          setShowCreate(false)
          setNewKeyName("")
          setNewKeyPermissions([])
        }}
        title="Create API Key"
        description="Configure the name and permissions for your new API key."
      >
        <div className="space-y-4">
          <Input
            label="Key Name"
            placeholder="e.g., Production API"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
          />
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Permissions
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PERMISSION_OPTIONS.map((perm) => (
                <label
                  key={perm.key}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                    newKeyPermissions.includes(perm.key)
                      ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={newKeyPermissions.includes(perm.key)}
                    onChange={() => togglePermission(perm.key)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  {perm.label}
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreate(false)
                setNewKeyName("")
                setNewKeyPermissions([])
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} loading={isPending}>
              <Shield className="h-4 w-4" />
              Create Key
            </Button>
          </div>
        </div>
      </Modal>

      {/* Show created key once */}
      <Modal
        open={!!createdKey}
        onClose={() => {
          setCreatedKey(null)
          setShowCreate(false)
        }}
        title="API Key Created"
        description="Copy your API key now. You will not be able to see it again."
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertCircle className="h-4 w-4 shrink-0" />
            This key will only be shown once. Please save it securely.
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 break-all rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm font-mono text-gray-800">
              {createdKey}
            </code>
            <Button variant="outline" size="icon" onClick={copyKey}>
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
                setCreatedKey(null)
                setShowCreate(false)
              }}
            >
              Done
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm revoke modal */}
      <Modal
        open={!!confirmRevoke}
        onClose={() => setConfirmRevoke(null)}
        title="Revoke API Key"
        description="This action cannot be undone. Any applications using this key will stop working immediately."
      >
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => setConfirmRevoke(null)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            loading={isPending}
            onClick={() => confirmRevoke && handleRevoke(confirmRevoke)}
          >
            Revoke Key
          </Button>
        </div>
      </Modal>
    </div>
  )
}
