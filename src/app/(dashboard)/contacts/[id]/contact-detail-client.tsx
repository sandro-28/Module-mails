"use client"

import { useState, useTransition, useCallback } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import {
  ArrowLeft,
  Save,
  Trash2,
  AlertTriangle,
  Download,
  Shield,
  X,
  Plus,
  Loader2,
  Mail,
  Eye,
  MousePointer,
  Check,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getInitials } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { EngagementBadge } from "@/components/contacts/engagement-badge"
import {
  ContactTimeline,
  type TimelineEvent,
} from "@/components/contacts/contact-timeline"
import {
  updateContact,
  deleteContact,
  exportContacts,
} from "@/app/actions/contacts"
import { mapEmailEventToContactEvent } from "@/lib/utils/contact-mappers"
import type {
  Contact,
  ContactEvent,
  ContactCampaign,
  ContactList,
  ContactStatus,
} from "@/app/actions/contacts"
import type { EmailEvent } from "@/types/database"
import { createClient } from "@/lib/supabase/client"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ContactDetailClientProps {
  contact: Contact
  events: ContactEvent[]
  totalEvents: number
  campaigns: ContactCampaign[]
  contactLists: ContactList[]
  allLists: { id: string; name: string }[]
}

type Tab = "profile" | "activity" | "campaigns" | "lists" | "gdpr"

const TABS: { value: Tab; label: string }[] = [
  { value: "profile", label: "Profile" },
  { value: "activity", label: "Activity" },
  { value: "campaigns", label: "Campaigns" },
  { value: "lists", label: "Lists & Tags" },
  { value: "gdpr", label: "GDPR" },
]

const STATUS_CONFIG: Record<
  ContactStatus,
  { label: string; variant: "success" | "secondary" | "destructive" | "warning" | "default" }
> = {
  active: { label: "Active", variant: "success" },
  unsubscribed: { label: "Unsubscribed", variant: "secondary" },
  bounced: { label: "Bounced", variant: "destructive" },
  complained: { label: "Complained", variant: "destructive" },
  pending: { label: "Pending", variant: "warning" },
  cleaned: { label: "Cleaned", variant: "secondary" },
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ContactDetailClient({
  contact,
  events,
  totalEvents,
  campaigns,
  contactLists,
  allLists,
}: ContactDetailClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>("profile")
  const [isPending, startTransition] = useTransition()
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Profile form state -- map DB fields to form-friendly names
  const [formData, setFormData] = useState({
    first_name: contact.first_name ?? "",
    last_name: contact.last_name ?? "",
    email: contact.email,
    phone: contact.phone ?? "",
    company: contact.company ?? "",
    job_title: contact.job_title ?? "",
    city: contact.geo_city ?? "",
    country: contact.geo_country ?? "",
    custom_fields: contact.custom_fields ?? {},
  })
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({})
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Tags state
  const [tags, setTags] = useState<string[]>(contact.tags ?? [])
  const [newTagValue, setNewTagValue] = useState("")

  // Lists state
  const [currentLists, setCurrentLists] = useState<ContactList[]>(contactLists)
  const [showListSelector, setShowListSelector] = useState(false)

  const fullName = [contact.first_name, contact.last_name]
    .filter(Boolean)
    .join(" ")
  const statusConfig = STATUS_CONFIG[contact.status] ?? STATUS_CONFIG.active
  const initials = fullName
    ? getInitials(fullName)
    : contact.email.slice(0, 2).toUpperCase()

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleFieldChange = useCallback(
    (field: string, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
      setSaveSuccess(false)
    },
    []
  )

  const handleSaveProfile = useCallback(() => {
    // Remap city/country back to DB column names
    const payload: Record<string, unknown> = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      phone: formData.phone,
      company: formData.company,
      job_title: formData.job_title,
      custom_fields: formData.custom_fields,
    }
    startTransition(async () => {
      const result = await updateContact(contact.id, payload)
      if (result.error) {
        setFormErrors(result.error as Record<string, string[]>)
        return
      }
      setFormErrors({})
      setSaveSuccess(true)
      router.refresh()
      setTimeout(() => setSaveSuccess(false), 3000)
    })
  }, [contact.id, formData, router])

  const handleDelete = useCallback(() => {
    startTransition(async () => {
      const result = await deleteContact(contact.id)
      if (result.error) {
        alert(`Error: ${result.error}`)
        return
      }
      router.push("/contacts")
    })
  }, [contact.id, router])

  const handleExportData = useCallback(() => {
    startTransition(async () => {
      const result = await exportContacts({ search: contact.email })
      if (result.data) {
        const blob = new Blob([result.data], { type: "text/csv" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `contact-${contact.email}-${Date.now()}.csv`
        a.click()
        URL.revokeObjectURL(url)
      }
    })
  }, [contact.email])

  const handleAddTag = useCallback(() => {
    const tag = newTagValue.trim()
    if (!tag || tags.includes(tag)) return
    const updatedTags = [...tags, tag]
    setTags(updatedTags)
    setNewTagValue("")
    startTransition(async () => {
      await updateContact(contact.id, { tags: updatedTags })
      router.refresh()
    })
  }, [newTagValue, tags, contact.id, router])

  const handleRemoveTag = useCallback(
    (tag: string) => {
      const updatedTags = tags.filter((t) => t !== tag)
      setTags(updatedTags)
      startTransition(async () => {
        await updateContact(contact.id, { tags: updatedTags })
        router.refresh()
      })
    },
    [tags, contact.id, router]
  )

  const handleAddToList = useCallback(
    (listId: string) => {
      startTransition(async () => {
        const supabase = createClient()
        await supabase.from("list_contacts").insert({
          contact_id: contact.id,
          list_id: listId,
        })
        const addedList = allLists.find((l) => l.id === listId)
        if (addedList) {
          setCurrentLists((prev) => [
            ...prev,
            {
              id: addedList.id,
              name: addedList.name,
              description: null,
              contact_count: 0,
            },
          ])
        }
        setShowListSelector(false)
        router.refresh()
      })
    },
    [contact.id, allLists, router]
  )

  const handleRemoveFromList = useCallback(
    (listId: string) => {
      startTransition(async () => {
        const supabase = createClient()
        await supabase
          .from("list_contacts")
          .delete()
          .eq("contact_id", contact.id)
          .eq("list_id", listId)

        setCurrentLists((prev) => prev.filter((l) => l.id !== listId))
        router.refresh()
      })
    },
    [contact.id, router]
  )

  const handleLoadMoreEvents = useCallback(
    async (page: number): Promise<TimelineEvent[]> => {
      const supabase = createClient()
      const from = (page - 1) * 20
      const to = from + 19
      const { data } = await supabase
        .from("email_events")
        .select("*")
        .eq("contact_id", contact.id)
        .order("created_at", { ascending: false })
        .range(from, to)
      // Map the raw DB rows into the timeline-friendly shape
      return ((data as EmailEvent[] | null) ?? []).map(
        mapEmailEventToContactEvent
      ) as TimelineEvent[]
    },
    [contact.id]
  )

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.push("/contacts")}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Contacts
      </button>

      {/* Contact header */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xl font-bold text-indigo-600">
            {initials}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">
                {fullName || contact.email}
              </h1>
              <Badge variant={statusConfig.variant}>
                {statusConfig.label}
              </Badge>
            </div>
            {fullName && (
              <p className="mt-0.5 text-sm text-gray-500">{contact.email}</p>
            )}
            {contact.company && (
              <p className="mt-0.5 text-sm text-gray-400">
                {contact.job_title ? `${contact.job_title} at ` : ""}
                {contact.company}
              </p>
            )}
          </div>

          {/* Engagement gauge */}
          <div className="shrink-0">
            <EngagementBadge
              score={contact.engagement_score}
              variant="gauge"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6" aria-label="Contact tabs">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "border-b-2 pb-3 text-sm font-medium transition-colors",
                activeTab === tab.value
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div className="min-h-[400px]">
        {/* ---- Profile Tab ---- */}
        {activeTab === "profile" && (
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Contact Information
              </h2>
              <div className="flex items-center gap-2">
                {saveSuccess && (
                  <span className="flex items-center gap-1 text-sm text-green-600">
                    <Check className="h-4 w-4" />
                    Saved
                  </span>
                )}
                <Button onClick={handleSaveProfile} disabled={isPending}>
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Changes
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="First Name"
                value={formData.first_name}
                onChange={(e) =>
                  handleFieldChange("first_name", e.target.value)
                }
                error={formErrors.first_name?.[0]}
              />
              <Input
                label="Last Name"
                value={formData.last_name}
                onChange={(e) =>
                  handleFieldChange("last_name", e.target.value)
                }
                error={formErrors.last_name?.[0]}
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleFieldChange("email", e.target.value)}
                error={formErrors.email?.[0]}
              />
              <Input
                label="Phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleFieldChange("phone", e.target.value)}
                error={formErrors.phone?.[0]}
              />
              <Input
                label="Company"
                value={formData.company}
                onChange={(e) => handleFieldChange("company", e.target.value)}
                error={formErrors.company?.[0]}
              />
              <Input
                label="Job Title"
                value={formData.job_title}
                onChange={(e) =>
                  handleFieldChange("job_title", e.target.value)
                }
                error={formErrors.job_title?.[0]}
              />
              <Input
                label="City"
                value={formData.city}
                onChange={(e) => handleFieldChange("city", e.target.value)}
                error={formErrors.city?.[0]}
              />
              <Input
                label="Country"
                value={formData.country}
                onChange={(e) => handleFieldChange("country", e.target.value)}
                error={formErrors.country?.[0]}
              />
            </div>

            {/* Custom fields */}
            {Object.keys(formData.custom_fields).length > 0 && (
              <>
                <h3 className="mb-3 mt-6 text-sm font-semibold text-gray-700">
                  Custom Fields
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {Object.entries(formData.custom_fields).map(
                    ([key, value]) => (
                      <Input
                        key={key}
                        label={key
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (c) => c.toUpperCase())}
                        value={String(value ?? "")}
                        onChange={(e) => {
                          setFormData((prev) => ({
                            ...prev,
                            custom_fields: {
                              ...prev.custom_fields,
                              [key]: e.target.value,
                            },
                          }))
                          setSaveSuccess(false)
                        }}
                      />
                    )
                  )}
                </div>
              </>
            )}

            {/* Form errors */}
            {formErrors._form && (
              <div className="mt-4 rounded-md bg-red-50 p-3">
                <p className="text-sm text-red-600">{formErrors._form[0]}</p>
              </div>
            )}
          </div>
        )}

        {/* ---- Activity Tab ---- */}
        {activeTab === "activity" && (
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-6 text-lg font-semibold text-gray-900">
              Activity Timeline
            </h2>
            <ContactTimeline
              events={events as TimelineEvent[]}
              totalEvents={totalEvents}
              onLoadMore={handleLoadMoreEvents}
            />
          </div>
        )}

        {/* ---- Campaigns Tab ---- */}
        {activeTab === "campaigns" && (
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-6 text-lg font-semibold text-gray-900">
              Campaigns
            </h2>
            {campaigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-12">
                <Mail className="mb-3 h-10 w-10 text-gray-300" />
                <p className="text-sm font-medium text-gray-500">
                  No campaigns sent to this contact yet
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-gray-200 bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Campaign
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Subject
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Status
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Sent
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Opened
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Clicked
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {campaigns.map((campaign) => (
                      <tr
                        key={campaign.id}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {campaign.campaign_name}
                        </td>
                        <td className="max-w-xs truncate px-4 py-3 text-gray-500">
                          {campaign.subject}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              campaign.status === "delivered"
                                ? "success"
                                : campaign.status === "bounced"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {campaign.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {campaign.sent_at
                            ? format(new Date(campaign.sent_at), "MMM d, yyyy")
                            : "--"}
                        </td>
                        <td className="px-4 py-3">
                          {campaign.opened_at ? (
                            <span className="inline-flex items-center gap-1 text-green-600">
                              <Eye className="h-3.5 w-3.5" />
                              {format(
                                new Date(campaign.opened_at),
                                "MMM d, HH:mm"
                              )}
                            </span>
                          ) : (
                            <span className="text-gray-400">--</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {campaign.clicked_at ? (
                            <span className="inline-flex items-center gap-1 text-indigo-600">
                              <MousePointer className="h-3.5 w-3.5" />
                              {format(
                                new Date(campaign.clicked_at),
                                "MMM d, HH:mm"
                              )}
                            </span>
                          ) : (
                            <span className="text-gray-400">--</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ---- Lists & Tags Tab ---- */}
        {activeTab === "lists" && (
          <div className="space-y-6">
            {/* Lists */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Lists</h2>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowListSelector(!showListSelector)}
                >
                  <Plus className="h-4 w-4" />
                  Add to List
                </Button>
              </div>

              {/* List selector */}
              {showListSelector && (
                <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="mb-2 text-sm font-medium text-gray-700">
                    Select a list:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {allLists
                      .filter(
                        (l) => !currentLists.some((cl) => cl.id === l.id)
                      )
                      .map((list) => (
                        <button
                          key={list.id}
                          onClick={() => handleAddToList(list.id)}
                          disabled={isPending}
                          className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                        >
                          {list.name}
                        </button>
                      ))}
                    {allLists.filter(
                      (l) => !currentLists.some((cl) => cl.id === l.id)
                    ).length === 0 && (
                      <p className="text-xs text-gray-400">
                        Already in all available lists
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Current lists */}
              {currentLists.length === 0 ? (
                <p className="text-sm text-gray-400">
                  Not a member of any list yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {currentLists.map((list) => (
                    <div
                      key={list.id}
                      className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-2.5"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {list.name}
                        </p>
                        {list.description && (
                          <p className="text-xs text-gray-400">
                            {list.description}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveFromList(list.id)}
                        disabled={isPending}
                        className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                        aria-label={`Remove from ${list.name}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Tags</h2>

              <div className="mb-4 flex gap-2">
                <input
                  type="text"
                  value={newTagValue}
                  onChange={(e) => setNewTagValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddTag()
                    }
                  }}
                  placeholder="Add a tag..."
                  className="h-9 flex-1 rounded-md border border-gray-300 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <Button
                  size="sm"
                  onClick={handleAddTag}
                  disabled={!newTagValue.trim() || isPending}
                >
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>

              {tags.length === 0 ? (
                <p className="text-sm text-gray-400">No tags yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        disabled={isPending}
                        className="rounded-full p-0.5 hover:bg-indigo-200"
                        aria-label={`Remove tag ${tag}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---- GDPR Tab ---- */}
        {activeTab === "gdpr" && (
          <div className="space-y-6">
            {/* Consent info -- mapped from DB fields */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-indigo-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Consent Information
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    Consent Status
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {contact.double_opt_in_confirmed ? (
                      <span className="text-green-600">Consent Given (Double Opt-In Confirmed)</span>
                    ) : (
                      <span className="text-red-600">No Consent / Not Confirmed</span>
                    )}
                  </p>
                </div>

                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    Subscribed At
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {contact.subscribed_at
                      ? format(
                          new Date(contact.subscribed_at),
                          "MMMM d, yyyy 'at' HH:mm"
                        )
                      : "Not recorded"}
                  </p>
                </div>

                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    Source
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {contact.source ?? "Not recorded"}
                    {contact.source_detail ? ` (${contact.source_detail})` : ""}
                  </p>
                </div>

                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    IP Address
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {contact.ip_address ?? "Not recorded"}
                  </p>
                </div>
              </div>
            </div>

            {/* Data management */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Data Management
              </h2>
              <p className="mb-4 text-sm text-gray-500">
                Under GDPR, contacts have the right to access and delete their
                personal data. Use the options below to comply with data subject
                requests.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  variant="outline"
                  onClick={handleExportData}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Export Contact Data
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteModal(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Contact & All Data
                </Button>
              </div>
            </div>

            {/* Record info */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Record Details
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    Contact ID
                  </p>
                  <p className="mt-1 font-mono text-xs text-gray-600">
                    {contact.id}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    Created At
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    {format(
                      new Date(contact.created_at),
                      "MMMM d, yyyy 'at' HH:mm:ss"
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    Last Updated
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    {format(
                      new Date(contact.updated_at),
                      "MMMM d, yyyy 'at' HH:mm:ss"
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    Last Activity
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    {contact.last_activity_at
                      ? format(
                          new Date(contact.last_activity_at),
                          "MMMM d, yyyy 'at' HH:mm:ss"
                        )
                      : "No activity"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setShowDeleteModal(false)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Confirm deletion"
            className="relative z-50 mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete Contact
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Are you sure you want to permanently delete{" "}
                  <strong>{fullName || contact.email}</strong>? This will remove
                  all associated data including activity history, list
                  memberships, and campaign records. This action cannot be
                  undone.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete Permanently
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
