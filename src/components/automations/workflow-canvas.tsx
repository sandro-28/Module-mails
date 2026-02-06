"use client"

import { useState } from "react"
import {
  Mail,
  Clock,
  GitBranch,
  Tag,
  ListPlus,
  ListMinus,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Zap,
  X,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/ui/modal"
import type { AutomationStep, AutomationTriggerType } from "@/types/database"

// ---------------------------------------------------------------------------
// Step type definitions
// ---------------------------------------------------------------------------

type StepType =
  | "send_email"
  | "delay"
  | "condition"
  | "add_tag"
  | "remove_tag"
  | "add_to_list"
  | "remove_from_list"

interface StepTypeDef {
  type: StepType
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

const STEP_TYPES: StepTypeDef[] = [
  { type: "send_email", label: "Send Email", icon: Mail, color: "bg-blue-50 text-blue-600 border-blue-200" },
  { type: "delay", label: "Delay", icon: Clock, color: "bg-amber-50 text-amber-600 border-amber-200" },
  { type: "condition", label: "Condition", icon: GitBranch, color: "bg-purple-50 text-purple-600 border-purple-200" },
  { type: "add_tag", label: "Add Tag", icon: Tag, color: "bg-green-50 text-green-600 border-green-200" },
  { type: "remove_tag", label: "Remove Tag", icon: Tag, color: "bg-red-50 text-red-600 border-red-200" },
  { type: "add_to_list", label: "Add to List", icon: ListPlus, color: "bg-teal-50 text-teal-600 border-teal-200" },
  { type: "remove_from_list", label: "Remove from List", icon: ListMinus, color: "bg-orange-50 text-orange-600 border-orange-200" },
]

// ---------------------------------------------------------------------------
// Trigger type mapping
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
// Props
// ---------------------------------------------------------------------------

interface WorkflowCanvasProps {
  triggerType: AutomationTriggerType
  steps: AutomationStep[]
  onAddStep: (step: AutomationStep, atIndex?: number) => void
  onUpdateStep: (stepId: string, updates: Partial<AutomationStep>) => void
  onRemoveStep: (stepId: string) => void
  onMoveStep?: (fromIndex: number, toIndex: number) => void
  /** Stats per step (keyed by step id) */
  stepStats?: Record<string, { passed: number; waiting: number; failed: number }>
  /** Read-only mode (for detail view) */
  readOnly?: boolean
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WorkflowCanvas({
  triggerType,
  steps,
  onAddStep,
  onUpdateStep,
  onRemoveStep,
  onMoveStep,
  stepStats,
  readOnly = false,
}: WorkflowCanvasProps) {
  const [addingAtIndex, setAddingAtIndex] = useState<number | null>(null)
  const [editingStepId, setEditingStepId] = useState<string | null>(null)

  function createStep(type: StepType, atIndex: number) {
    const id = crypto.randomUUID()
    const base = { id, position: atIndex }

    let step: AutomationStep

    switch (type) {
      case "send_email":
        step = {
          ...base,
          type: "send_email",
          name: "Send Email",
          config: {
            template_id: "",
            subject: "",
            from_name: "",
            from_email: "",
            preview_text: null,
            reply_to: null,
          },
        }
        break
      case "delay":
        step = {
          ...base,
          type: "delay",
          name: "Wait",
          config: { duration: 1, unit: "days" },
        }
        break
      case "condition":
        step = {
          ...base,
          type: "condition",
          name: "If / Else",
          config: {
            conditions: { operator: "and", conditions: [] },
            yes_branch_step_id: "",
            no_branch_step_id: "",
          },
        }
        break
      case "add_tag":
        step = {
          ...base,
          type: "action",
          name: "Add Tag",
          config: { action: "add_tag", tag: "" },
        }
        break
      case "remove_tag":
        step = {
          ...base,
          type: "action",
          name: "Remove Tag",
          config: { action: "remove_tag", tag: "" },
        }
        break
      case "add_to_list":
        step = {
          ...base,
          type: "action",
          name: "Add to List",
          config: { action: "add_to_list", list_id: "" },
        }
        break
      case "remove_from_list":
        step = {
          ...base,
          type: "action",
          name: "Remove from List",
          config: { action: "remove_from_list", list_id: "" },
        }
        break
    }

    onAddStep(step, atIndex)
    setAddingAtIndex(null)
  }

  const editingStep = steps.find((s) => s.id === editingStepId)

  return (
    <div className="flex flex-col items-center py-4">
      {/* Trigger node */}
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-2 rounded-lg border-2 border-indigo-300 bg-indigo-50 px-5 py-3 shadow-sm">
          <Zap className="h-4 w-4 text-indigo-600" />
          <span className="text-sm font-medium text-indigo-700">
            {TRIGGER_LABELS[triggerType] ?? "Trigger"}
          </span>
        </div>
        {/* Connector line */}
        <div className="h-8 w-0.5 bg-gray-300" />
      </div>

      {/* Add step button at top */}
      {!readOnly && (
        <AddStepButton
          isOpen={addingAtIndex === 0}
          onToggle={() =>
            setAddingAtIndex(addingAtIndex === 0 ? null : 0)
          }
          onSelect={(type) => createStep(type, 0)}
        />
      )}

      {/* Steps */}
      {steps.map((step, idx) => {
        const typeDef = getStepTypeDef(step)
        const stats = stepStats?.[step.id]

        return (
          <div key={step.id} className="flex flex-col items-center">
            {/* Connector line */}
            <div className="h-6 w-0.5 bg-gray-300" />

            {/* Step node */}
            <div
              className={cn(
                "relative w-72 rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-md",
                readOnly ? "" : "cursor-pointer"
              )}
              onClick={() => !readOnly && setEditingStepId(step.id)}
            >
              {/* Step header */}
              <div
                className={cn(
                  "flex items-center gap-2 rounded-t-lg border-b px-4 py-2.5",
                  typeDef.color
                )}
              >
                {!readOnly && onMoveStep && (
                  <GripVertical className="h-3.5 w-3.5 opacity-50" />
                )}
                <typeDef.icon className="h-4 w-4" />
                <span className="flex-1 text-sm font-medium">
                  {step.name}
                </span>
                {!readOnly && (
                  <button
                    type="button"
                    className="rounded p-0.5 opacity-50 hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemoveStep(step.id)
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Step body - config summary */}
              <div className="px-4 py-2.5">
                <StepSummary step={step} />
              </div>

              {/* Stats (if available) */}
              {stats && (
                <div className="flex gap-3 border-t border-gray-100 px-4 py-2 text-[11px] text-gray-500">
                  <span>
                    Passed: <strong>{stats.passed}</strong>
                  </span>
                  <span>
                    Waiting: <strong>{stats.waiting}</strong>
                  </span>
                  {stats.failed > 0 && (
                    <span className="text-red-500">
                      Failed: <strong>{stats.failed}</strong>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Connector line + add button */}
            <div className="h-6 w-0.5 bg-gray-300" />
            {!readOnly && (
              <AddStepButton
                isOpen={addingAtIndex === idx + 1}
                onToggle={() =>
                  setAddingAtIndex(
                    addingAtIndex === idx + 1 ? null : idx + 1
                  )
                }
                onSelect={(type) => createStep(type, idx + 1)}
              />
            )}
          </div>
        )
      })}

      {/* End node */}
      <div className="mt-4 flex flex-col items-center">
        {steps.length > 0 && <div className="h-6 w-0.5 bg-gray-300" />}
        <div className="rounded-full border-2 border-dashed border-gray-300 px-5 py-2">
          <span className="text-xs font-medium text-gray-400">End</span>
        </div>
      </div>

      {/* Step editor modal */}
      {editingStep && (
        <Modal
          open={!!editingStepId}
          onClose={() => setEditingStepId(null)}
          title={`Edit: ${editingStep.name}`}
          size="lg"
        >
          <StepEditor
            step={editingStep}
            onUpdate={(updates) => {
              onUpdateStep(editingStep.id, updates)
            }}
            onClose={() => setEditingStepId(null)}
          />
        </Modal>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Add step button
// ---------------------------------------------------------------------------

function AddStepButton({
  isOpen,
  onToggle,
  onSelect,
}: {
  isOpen: boolean
  onToggle: () => void
  onSelect: (type: StepType) => void
}) {
  return (
    <div className="relative flex flex-col items-center">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors",
          isOpen
            ? "border-indigo-400 bg-indigo-50 text-indigo-600"
            : "border-gray-300 bg-white text-gray-400 hover:border-indigo-300 hover:text-indigo-500"
        )}
      >
        <Plus className="h-4 w-4" />
      </button>
      {isOpen && (
        <div className="absolute top-9 z-10 w-52 rounded-lg border border-gray-200 bg-white p-1.5 shadow-lg">
          {STEP_TYPES.map((st) => {
            const Icon = st.icon
            return (
              <button
                key={st.type}
                type="button"
                className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
                onClick={() => onSelect(st.type)}
              >
                <Icon className="h-4 w-4 text-gray-400" />
                {st.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step summary
// ---------------------------------------------------------------------------

function StepSummary({ step }: { step: AutomationStep }) {
  switch (step.type) {
    case "send_email":
      return (
        <p className="text-xs text-gray-500">
          {step.config.subject
            ? `Subject: ${step.config.subject}`
            : "No subject configured"}
        </p>
      )
    case "delay":
      return (
        <p className="text-xs text-gray-500">
          Wait {step.config.duration} {step.config.unit}
        </p>
      )
    case "condition":
      return (
        <p className="text-xs text-gray-500">
          {step.config.conditions.conditions.length > 0
            ? `${step.config.conditions.conditions.length} condition(s)`
            : "No conditions configured"}
        </p>
      )
    case "action":
      return (
        <p className="text-xs text-gray-500">
          {step.config.action === "add_tag" && `Tag: ${step.config.tag || "not set"}`}
          {step.config.action === "remove_tag" && `Tag: ${step.config.tag || "not set"}`}
          {step.config.action === "add_to_list" && `List: ${step.config.list_id || "not set"}`}
          {step.config.action === "remove_from_list" && `List: ${step.config.list_id || "not set"}`}
          {!["add_tag", "remove_tag", "add_to_list", "remove_from_list"].includes(step.config.action) && step.config.action}
        </p>
      )
    default:
      return (
        <p className="text-xs text-gray-500">
          {step.name}
        </p>
      )
  }
}

// ---------------------------------------------------------------------------
// Step type def helper
// ---------------------------------------------------------------------------

function getStepTypeDef(step: AutomationStep): StepTypeDef {
  if (step.type === "send_email") return STEP_TYPES[0]
  if (step.type === "delay") return STEP_TYPES[1]
  if (step.type === "condition") return STEP_TYPES[2]
  if (step.type === "action") {
    switch (step.config.action) {
      case "add_tag":
        return STEP_TYPES[3]
      case "remove_tag":
        return STEP_TYPES[4]
      case "add_to_list":
        return STEP_TYPES[5]
      case "remove_from_list":
        return STEP_TYPES[6]
    }
  }
  return STEP_TYPES[0]
}

// ---------------------------------------------------------------------------
// Step editor
// ---------------------------------------------------------------------------

function StepEditor({
  step,
  onUpdate,
  onClose,
}: {
  step: AutomationStep
  onUpdate: (updates: Partial<AutomationStep>) => void
  onClose: () => void
}) {
  return (
    <div className="space-y-4">
      <Input
        label="Step Name"
        value={step.name}
        onChange={(e) => onUpdate({ name: e.target.value })}
      />

      {step.type === "send_email" && (
        <div className="space-y-3">
          <Input
            label="Subject"
            value={step.config.subject}
            onChange={(e) =>
              onUpdate({
                config: { ...step.config, subject: e.target.value },
              } as Partial<AutomationStep>)
            }
            placeholder="Enter email subject"
          />
          <Input
            label="Template ID"
            value={step.config.template_id}
            onChange={(e) =>
              onUpdate({
                config: { ...step.config, template_id: e.target.value },
              } as Partial<AutomationStep>)
            }
            placeholder="Select or enter template ID"
          />
          <Input
            label="From Name"
            value={step.config.from_name}
            onChange={(e) =>
              onUpdate({
                config: { ...step.config, from_name: e.target.value },
              } as Partial<AutomationStep>)
            }
          />
          <Input
            label="From Email"
            value={step.config.from_email}
            onChange={(e) =>
              onUpdate({
                config: { ...step.config, from_email: e.target.value },
              } as Partial<AutomationStep>)
            }
          />
        </div>
      )}

      {step.type === "delay" && (
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Duration"
            type="number"
            min={1}
            value={String(step.config.duration)}
            onChange={(e) =>
              onUpdate({
                config: {
                  ...step.config,
                  duration: parseInt(e.target.value) || 1,
                },
              } as Partial<AutomationStep>)
            }
          />
          <Select
            label="Unit"
            value={step.config.unit}
            onChange={(e) =>
              onUpdate({
                config: {
                  ...step.config,
                  unit: e.target.value as "minutes" | "hours" | "days" | "weeks",
                },
              } as Partial<AutomationStep>)
            }
            options={[
              { value: "minutes", label: "Minutes" },
              { value: "hours", label: "Hours" },
              { value: "days", label: "Days" },
              { value: "weeks", label: "Weeks" },
            ]}
          />
        </div>
      )}

      {step.type === "condition" && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            Configure conditions for branching logic.
          </p>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="grid grid-cols-3 gap-2">
              <Input
                label="Field"
                placeholder="e.g., status, tags"
              />
              <Select
                label="Operator"
                options={[
                  { value: "equals", label: "Equals" },
                  { value: "not_equals", label: "Not Equals" },
                  { value: "contains", label: "Contains" },
                  { value: "is_set", label: "Is Set" },
                  { value: "is_not_set", label: "Is Not Set" },
                ]}
              />
              <Input label="Value" placeholder="Value" />
            </div>
            <p className="mt-2 text-xs text-gray-400">
              Contacts matching will follow the Yes branch; others follow No.
            </p>
          </div>
        </div>
      )}

      {step.type === "action" && (
        <div>
          {(step.config.action === "add_tag" ||
            step.config.action === "remove_tag") && (
            <Input
              label="Tag"
              value={step.config.tag ?? ""}
              onChange={(e) =>
                onUpdate({
                  config: { ...step.config, tag: e.target.value },
                } as Partial<AutomationStep>)
              }
              placeholder="Enter tag name"
            />
          )}
          {(step.config.action === "add_to_list" ||
            step.config.action === "remove_from_list") && (
            <Input
              label="List ID"
              value={step.config.list_id ?? ""}
              onChange={(e) =>
                onUpdate({
                  config: { ...step.config, list_id: e.target.value },
                } as Partial<AutomationStep>)
              }
              placeholder="Enter list ID"
            />
          )}
        </div>
      )}

      <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
        <Button variant="outline" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  )
}
