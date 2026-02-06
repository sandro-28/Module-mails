"use client"

import { useState } from "react"
import {
  UserPlus,
  ListPlus,
  Tag,
  FileText,
  Calendar,
  Mail,
  MousePointer,
  Webhook,
  Zap,
  Hand,
  ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import type { AutomationTriggerType, AutomationTriggerConfig } from "@/types/database"

// ---------------------------------------------------------------------------
// Trigger definitions
// ---------------------------------------------------------------------------

interface TriggerDef {
  type: AutomationTriggerType
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

const TRIGGER_DEFS: TriggerDef[] = [
  {
    type: "contact_created",
    label: "Contact Created",
    description: "When a new contact is added",
    icon: UserPlus,
  },
  {
    type: "contact_added_to_list",
    label: "Added to List",
    description: "When a contact is added to a specific list",
    icon: ListPlus,
  },
  {
    type: "contact_tag_added",
    label: "Tag Added",
    description: "When a specific tag is added to a contact",
    icon: Tag,
  },
  {
    type: "form_submitted",
    label: "Form Submitted",
    description: "When a signup form is submitted",
    icon: FileText,
  },
  {
    type: "email_opened",
    label: "Email Opened",
    description: "When a contact opens an email",
    icon: Mail,
  },
  {
    type: "email_clicked",
    label: "Email Clicked",
    description: "When a contact clicks a link in an email",
    icon: MousePointer,
  },
  {
    type: "date_field",
    label: "Date Field",
    description: "Based on a date in a contact field",
    icon: Calendar,
  },
  {
    type: "webhook",
    label: "Webhook",
    description: "Triggered by an external webhook call",
    icon: Webhook,
  },
  {
    type: "engagement_score_change",
    label: "Engagement Score",
    description: "When engagement score crosses a threshold",
    icon: Zap,
  },
  {
    type: "manual",
    label: "Manual",
    description: "Manually enroll contacts",
    icon: Hand,
  },
]

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TriggerSelectorProps {
  value: AutomationTriggerType
  config: AutomationTriggerConfig
  onChange: (type: AutomationTriggerType, config: Partial<AutomationTriggerConfig>) => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TriggerSelector({
  value,
  config,
  onChange,
}: TriggerSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const selected = TRIGGER_DEFS.find((t) => t.type === value)

  function handleSelect(type: AutomationTriggerType) {
    onChange(type, { trigger_type: type })
    setIsOpen(false)
  }

  return (
    <div className="space-y-4">
      {/* Trigger type selector */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Trigger Type
        </label>
        <div className="relative">
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-3 text-left shadow-sm hover:border-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            onClick={() => setIsOpen(!isOpen)}
          >
            {selected ? (
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-50">
                  <selected.icon className="h-4 w-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {selected.label}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selected.description}
                  </p>
                </div>
              </div>
            ) : (
              <span className="text-sm text-gray-400">Select a trigger...</span>
            )}
            <ChevronDown
              className={cn(
                "h-4 w-4 text-gray-400 transition-transform",
                isOpen && "rotate-180"
              )}
            />
          </button>

          {isOpen && (
            <div className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
              {TRIGGER_DEFS.map((trigger) => {
                const Icon = trigger.icon
                const isSelected = trigger.type === value
                return (
                  <button
                    key={trigger.type}
                    type="button"
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50",
                      isSelected && "bg-indigo-50"
                    )}
                    onClick={() => handleSelect(trigger.type)}
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-md",
                        isSelected ? "bg-indigo-100" : "bg-gray-100"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4",
                          isSelected ? "text-indigo-600" : "text-gray-500"
                        )}
                      />
                    </div>
                    <div>
                      <p
                        className={cn(
                          "text-sm font-medium",
                          isSelected ? "text-indigo-700" : "text-gray-900"
                        )}
                      >
                        {trigger.label}
                      </p>
                      <p className="text-xs text-gray-500">
                        {trigger.description}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Trigger config fields */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="mb-3 text-xs font-semibold uppercase text-gray-400">
          Configuration
        </p>
        <TriggerConfigForm type={value} config={config} onChange={onChange} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Config form per trigger type
// ---------------------------------------------------------------------------

function TriggerConfigForm({
  type,
  config,
  onChange,
}: {
  type: AutomationTriggerType
  config: AutomationTriggerConfig
  onChange: (
    type: AutomationTriggerType,
    config: Partial<AutomationTriggerConfig>
  ) => void
}) {
  function updateConfig(updates: Partial<AutomationTriggerConfig>) {
    onChange(type, { ...config, ...updates })
  }

  switch (type) {
    case "contact_created":
      return (
        <Input
          label="Source Filter (optional)"
          placeholder="e.g., api, import, form"
          value={(config as unknown as Record<string, string>).source_filter ?? ""}
          onChange={(e) =>
            updateConfig({
              filter_conditions: e.target.value
                ? {
                    operator: "and",
                    conditions: [
                      {
                        field: "source",
                        operator: "equals",
                        value: e.target.value,
                      },
                    ],
                  }
                : undefined,
            })
          }
          helperText="Only trigger for contacts from this source"
        />
      )

    case "contact_added_to_list":
      return (
        <Input
          label="List ID"
          placeholder="Enter list ID"
          value={config.list_id ?? ""}
          onChange={(e) => updateConfig({ list_id: e.target.value })}
          helperText="Trigger when a contact is added to this list"
        />
      )

    case "contact_tag_added":
      return (
        <Input
          label="Tag"
          placeholder="e.g., customer, trial"
          value={config.tag ?? ""}
          onChange={(e) => updateConfig({ tag: e.target.value })}
          helperText="Trigger when this tag is added to a contact"
        />
      )

    case "form_submitted":
      return (
        <Input
          label="Form ID"
          placeholder="Enter form ID"
          value={config.form_id ?? ""}
          onChange={(e) => updateConfig({ form_id: e.target.value })}
          helperText="Trigger when this specific form is submitted"
        />
      )

    case "date_field":
      return (
        <div className="space-y-3">
          <Input
            label="Date Field Key"
            placeholder="e.g., birthday, subscription_end"
            value={config.date_field_key ?? ""}
            onChange={(e) => updateConfig({ date_field_key: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Offset Days"
              type="number"
              placeholder="0"
              value={String(config.date_offset_days ?? 0)}
              onChange={(e) =>
                updateConfig({ date_offset_days: parseInt(e.target.value) || 0 })
              }
            />
            <Select
              label="Direction"
              options={[
                { value: "before", label: "Days Before" },
                { value: "after", label: "Days After" },
              ]}
              value={config.date_offset_direction ?? "before"}
              onChange={(e) =>
                updateConfig({
                  date_offset_direction: e.target.value as "before" | "after",
                })
              }
            />
          </div>
        </div>
      )

    case "email_opened":
      return (
        <Input
          label="Campaign ID (optional)"
          placeholder="Leave empty for any email"
          value={config.campaign_id ?? ""}
          onChange={(e) => updateConfig({ campaign_id: e.target.value || undefined })}
        />
      )

    case "email_clicked":
      return (
        <div className="space-y-3">
          <Input
            label="Campaign ID (optional)"
            placeholder="Leave empty for any email"
            value={config.campaign_id ?? ""}
            onChange={(e) => updateConfig({ campaign_id: e.target.value || undefined })}
          />
          <Input
            label="Link URL (optional)"
            placeholder="e.g., https://example.com/pricing"
            value={config.link_url ?? ""}
            onChange={(e) => updateConfig({ link_url: e.target.value || undefined })}
          />
        </div>
      )

    case "engagement_score_change":
      return (
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Score Threshold"
            type="number"
            placeholder="50"
            value={String(config.score_threshold ?? "")}
            onChange={(e) =>
              updateConfig({
                score_threshold: parseInt(e.target.value) || undefined,
              })
            }
          />
          <Select
            label="Direction"
            options={[
              { value: "above", label: "Goes Above" },
              { value: "below", label: "Goes Below" },
            ]}
            value={config.score_direction ?? "above"}
            onChange={(e) =>
              updateConfig({
                score_direction: e.target.value as "above" | "below",
              })
            }
          />
        </div>
      )

    case "webhook":
    case "manual":
      return (
        <p className="text-xs text-gray-500">
          No additional configuration required for this trigger type.
        </p>
      )

    default:
      return (
        <p className="text-xs text-gray-500">
          Select a trigger type to configure it.
        </p>
      )
  }
}
