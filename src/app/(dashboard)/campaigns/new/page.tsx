"use client"

import { useState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  Send,
  Monitor,
  Smartphone,
  Mail,
  Eye,
  Check,
  AlertCircle,
  Loader2,
  ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CampaignWizardSteps } from "@/components/campaigns/campaign-wizard"
import { RecipientSelector } from "@/components/campaigns/recipient-selector"
import { SchedulePicker } from "@/components/campaigns/schedule-picker"
import {
  useCampaignWizardStore,
  type WizardStep,
} from "@/stores/campaign-wizard-store"
import {
  createCampaign,
  sendCampaign,
  scheduleCampaign,
  sendTestEmail,
} from "@/app/actions/campaigns"
import type { CampaignType } from "@/types/database"

// ---------------------------------------------------------------------------
// Merge tag picker helper
// ---------------------------------------------------------------------------

const MERGE_TAGS = [
  { tag: "{{first_name}}", label: "First Name" },
  { tag: "{{last_name}}", label: "Last Name" },
  { tag: "{{email}}", label: "Email" },
  { tag: "{{company}}", label: "Company" },
  { tag: "{{unsubscribe_url}}", label: "Unsubscribe URL" },
]

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function NewCampaignPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<string[]>([])
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop")
  const [showMergeDropdown, setShowMergeDropdown] = useState(false)
  const [testEmails, setTestEmails] = useState("")
  const [testEmailSent, setTestEmailSent] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const {
    currentStep,
    campaignData,
    setStep,
    updateCampaignData,
    reset,
    validateStep,
  } = useCampaignWizardStore()

  // Track completed steps
  const [completedSteps, setCompletedSteps] = useState<WizardStep[]>([])

  // Reset store on mount
  useEffect(() => {
    reset()
  }, [reset])

  const handleNext = () => {
    const validation = validateStep(currentStep)
    if (!validation.valid) {
      setErrors(validation.errors)
      return
    }
    setErrors([])
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps((prev) => [...prev, currentStep])
    }
    if (currentStep < 5) setStep((currentStep + 1) as WizardStep)
  }

  const handleBack = () => {
    setErrors([])
    if (currentStep > 1) setStep((currentStep - 1) as WizardStep)
  }

  const handleStepClick = (step: WizardStep) => {
    setErrors([])
    setStep(step)
  }

  const handleInsertMergeTag = (tag: string) => {
    updateCampaignData({ subject: campaignData.subject + tag })
    setShowMergeDropdown(false)
  }

  const handleSendTest = () => {
    const emails = testEmails
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean)
    if (emails.length === 0) return
    startTransition(async () => {
      try {
        // We need a campaign ID; save as draft first if not already
        await sendTestEmail("draft", emails)
        setTestEmailSent(true)
        setTimeout(() => setTestEmailSent(false), 3000)
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to send test email")
      }
    })
  }

  const handleConfirmSend = () => {
    startTransition(async () => {
      try {
        const campaign = await createCampaign({
          name: campaignData.name,
          type: campaignData.type,
          subject: campaignData.subject,
          preview_text: campaignData.preview_text,
          from_name: campaignData.from_name,
          from_email: campaignData.from_email,
          reply_to: campaignData.reply_to || null,
          html_content: campaignData.html_content || null,
          text_content: campaignData.text_content || null,
          template_id: campaignData.template_id,
          list_ids: campaignData.recipient_list_ids,
          segment_ids: campaignData.recipient_segment_ids,
          excluded_list_ids: campaignData.exclude_list_ids,
          excluded_segment_ids: campaignData.exclude_segment_ids,
          utm_source: campaignData.utm_source || null,
          utm_medium: campaignData.utm_medium || null,
          utm_campaign: campaignData.utm_campaign || null,
          utm_content: campaignData.utm_content || null,
          utm_term: campaignData.utm_term || null,
          ab_test_config: campaignData.ab_test_config,
        })

        if (campaignData.send_now) {
          await sendCampaign(campaign.id)
        } else if (campaignData.scheduled_at) {
          await scheduleCampaign(campaign.id, campaignData.scheduled_at)
        }

        reset()
        router.push(`/campaigns/${campaign.id}`)
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to create campaign")
        setShowConfirmModal(false)
      }
    })
  }

  // Checklist for review step
  const reviewChecklist = [
    { label: "Subject line set", ok: !!campaignData.subject.trim() },
    {
      label: "Content set",
      ok: !!campaignData.html_content.trim() || !!campaignData.template_id,
    },
    {
      label: "Recipients selected",
      ok:
        campaignData.recipient_list_ids.length > 0 ||
        campaignData.recipient_segment_ids.length > 0,
    },
    { label: "From email set", ok: !!campaignData.from_email.trim() },
    {
      label: "Schedule configured",
      ok: campaignData.send_now || !!campaignData.scheduled_at,
    },
  ]

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Create Campaign
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Set up and send your email campaign step by step.
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={() => {
            if (
              confirm("Are you sure? Your changes will be lost.")
            ) {
              reset()
              router.push("/campaigns")
            }
          }}
        >
          Cancel
        </Button>
      </div>

      {/* Progress indicator */}
      <CampaignWizardSteps
        currentStep={currentStep}
        onStepClick={handleStepClick}
        completedSteps={completedSteps}
      />

      {/* Validation errors */}
      {errors.length > 0 && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-800">
                Please fix the following errors:
              </p>
              <ul className="mt-1 list-inside list-disc text-sm text-red-700">
                {errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Step content */}
      <Card className="mb-6">
        <CardContent className="p-6">
          {/* STEP 1 - Settings */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900">
                Campaign Settings
              </h2>

              <Input
                label="Campaign Name"
                placeholder="e.g., Monthly Newsletter - January"
                value={campaignData.name}
                onChange={(e) =>
                  updateCampaignData({ name: e.target.value })
                }
              />

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Campaign Type
                </label>
                <div className="flex gap-3">
                  {(
                    [
                      { value: "regular", label: "Regular" },
                      { value: "ab_test", label: "A/B Test" },
                    ] as { value: CampaignType; label: string }[]
                  ).map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        updateCampaignData({ type: value })
                      }
                      className={cn(
                        "rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors",
                        campaignData.type === value
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="From Name"
                  placeholder="Your Company Name"
                  value={campaignData.from_name}
                  onChange={(e) =>
                    updateCampaignData({ from_name: e.target.value })
                  }
                />
                <Input
                  label="From Email"
                  type="email"
                  placeholder="hello@company.com"
                  value={campaignData.from_email}
                  onChange={(e) =>
                    updateCampaignData({ from_email: e.target.value })
                  }
                />
              </div>

              <Input
                label="Reply-To (optional)"
                type="email"
                placeholder="replies@company.com"
                value={campaignData.reply_to}
                onChange={(e) =>
                  updateCampaignData({ reply_to: e.target.value })
                }
              />

              {/* Subject with merge tag picker */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Subject Line
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowMergeDropdown(!showMergeDropdown)}
                      className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700"
                    >
                      Insert merge tag
                      <ChevronDown className="h-3 w-3" />
                    </button>
                    {showMergeDropdown && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setShowMergeDropdown(false)}
                        />
                        <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                          {MERGE_TAGS.map(({ tag, label }) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => handleInsertMergeTag(tag)}
                              className="flex w-full items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <span>{label}</span>
                              <code className="text-xs text-gray-400">
                                {tag}
                              </code>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <Input
                  placeholder="e.g., {{first_name}}, check out our latest..."
                  value={campaignData.subject}
                  onChange={(e) =>
                    updateCampaignData({ subject: e.target.value })
                  }
                />
              </div>

              <Input
                label="Preview Text (optional)"
                placeholder="This text appears in the inbox preview"
                value={campaignData.preview_text}
                onChange={(e) =>
                  updateCampaignData({ preview_text: e.target.value })
                }
                helperText="This text appears next to your subject in the inbox."
              />
            </div>
          )}

          {/* STEP 2 - Content */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Email Content
                </h2>
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 p-0.5">
                  <button
                    type="button"
                    onClick={() => setPreviewMode("desktop")}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                      previewMode === "desktop"
                        ? "bg-gray-900 text-white"
                        : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    <Monitor className="h-3.5 w-3.5" />
                    Desktop
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode("mobile")}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                      previewMode === "mobile"
                        ? "bg-gray-900 text-white"
                        : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                    Mobile
                  </button>
                </div>
              </div>

              {/* Editor + Preview */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Editor */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    HTML Content
                  </label>
                  <textarea
                    value={campaignData.html_content}
                    onChange={(e) =>
                      updateCampaignData({ html_content: e.target.value })
                    }
                    placeholder="<html>&#10;  <body>&#10;    <h1>Your email content</h1>&#10;  </body>&#10;</html>"
                    className="h-80 w-full rounded-lg border border-gray-300 bg-gray-50 p-4 font-mono text-sm text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
                  />
                </div>

                {/* Preview */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Preview
                  </label>
                  <div
                    className={cn(
                      "overflow-hidden rounded-lg border border-gray-200 bg-white",
                      previewMode === "mobile" ? "mx-auto max-w-[375px]" : ""
                    )}
                  >
                    {campaignData.html_content ? (
                      <iframe
                        srcDoc={campaignData.html_content}
                        title="Email preview"
                        className="h-80 w-full border-0"
                        sandbox="allow-same-origin"
                      />
                    ) : (
                      <div className="flex h-80 items-center justify-center text-sm text-gray-400">
                        <div className="text-center">
                          <Eye className="mx-auto h-8 w-8 text-gray-300" />
                          <p className="mt-2">Preview will appear here</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Send test email */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <h4 className="text-sm font-medium text-gray-700">
                  Send Test Email
                </h4>
                <div className="mt-2 flex gap-2">
                  <Input
                    placeholder="test@example.com (comma-separated)"
                    value={testEmails}
                    onChange={(e) => setTestEmails(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={handleSendTest}
                    loading={isPending}
                    disabled={!testEmails.trim()}
                  >
                    <Mail className="h-4 w-4" />
                    {testEmailSent ? "Sent!" : "Send Test"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 - Recipients */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900">
                Select Recipients
              </h2>
              <RecipientSelector
                selectedListIds={campaignData.recipient_list_ids}
                selectedSegmentIds={campaignData.recipient_segment_ids}
                excludeListIds={campaignData.exclude_list_ids}
                excludeSegmentIds={campaignData.exclude_segment_ids}
                onListsChange={(ids) =>
                  updateCampaignData({ recipient_list_ids: ids })
                }
                onSegmentsChange={(ids) =>
                  updateCampaignData({ recipient_segment_ids: ids })
                }
                onExcludeListsChange={(ids) =>
                  updateCampaignData({ exclude_list_ids: ids })
                }
                onExcludeSegmentsChange={(ids) =>
                  updateCampaignData({ exclude_segment_ids: ids })
                }
              />
            </div>
          )}

          {/* STEP 4 - Schedule */}
          {currentStep === 4 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900">
                Schedule Delivery
              </h2>
              <SchedulePicker
                sendNow={campaignData.send_now}
                scheduledAt={campaignData.scheduled_at}
                timezone={campaignData.timezone}
                onSendNowChange={(val) =>
                  updateCampaignData({ send_now: val })
                }
                onScheduledAtChange={(date) =>
                  updateCampaignData({ scheduled_at: date })
                }
                onTimezoneChange={(tz) =>
                  updateCampaignData({ timezone: tz })
                }
              />
            </div>
          )}

          {/* STEP 5 - Review */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Review &amp; Send
              </h2>

              {/* Summary */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Name</span>
                      <span className="font-medium text-gray-900">
                        {campaignData.name || "---"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Type</span>
                      <span className="font-medium capitalize text-gray-900">
                        {campaignData.type.replace("_", " ")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">From</span>
                      <span className="font-medium text-gray-900">
                        {campaignData.from_name} &lt;{campaignData.from_email}&gt;
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Subject</span>
                      <span className="max-w-48 truncate font-medium text-gray-900">
                        {campaignData.subject || "---"}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Delivery</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Lists</span>
                      <span className="font-medium text-gray-900">
                        {campaignData.recipient_list_ids.length} selected
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Segments</span>
                      <span className="font-medium text-gray-900">
                        {campaignData.recipient_segment_ids.length} selected
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">When</span>
                      <span className="font-medium text-gray-900">
                        {campaignData.send_now
                          ? "Send immediately"
                          : campaignData.scheduled_at
                            ? new Date(campaignData.scheduled_at).toLocaleString()
                            : "Not set"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Checklist */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Pre-send Checklist</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {reviewChecklist.map(({ label, ok }) => (
                      <div
                        key={label}
                        className="flex items-center gap-3 text-sm"
                      >
                        <span
                          className={cn(
                            "flex h-5 w-5 items-center justify-center rounded-full",
                            ok
                              ? "bg-green-100 text-green-600"
                              : "bg-red-100 text-red-600"
                          )}
                        >
                          {ok ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <AlertCircle className="h-3 w-3" />
                          )}
                        </span>
                        <span
                          className={cn(
                            ok ? "text-gray-700" : "font-medium text-red-700"
                          )}
                        >
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Confirm button */}
              <div className="flex justify-end">
                <Button
                  disabled={reviewChecklist.some((c) => !c.ok)}
                  onClick={() => setShowConfirmModal(true)}
                >
                  <Send className="h-4 w-4" />
                  {campaignData.send_now ? "Send Campaign" : "Schedule Campaign"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {currentStep < 5 && (
          <Button onClick={handleNext}>
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Confirmation modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900">
              {campaignData.send_now ? "Send Campaign Now?" : "Schedule Campaign?"}
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              {campaignData.send_now
                ? `This will immediately start sending "${campaignData.name}" to your selected recipients.`
                : `This will schedule "${campaignData.name}" for ${
                    campaignData.scheduled_at
                      ? new Date(campaignData.scheduled_at).toLocaleString()
                      : "the selected time"
                  }.`}
            </p>
            <p className="mt-2 text-sm font-medium text-gray-800">
              This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirmModal(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button onClick={handleConfirmSend} loading={isPending}>
                {isPending ? (
                  "Processing..."
                ) : campaignData.send_now ? (
                  <>
                    <Send className="h-4 w-4" />
                    Confirm &amp; Send
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Confirm &amp; Schedule
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
