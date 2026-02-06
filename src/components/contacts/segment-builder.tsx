"use client"

import { useState, useCallback } from "react"
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import type {
  SegmentConditionGroup,
  SegmentCondition,
  SegmentOperator,
} from "@/types/database"

// ---------------------------------------------------------------------------
// Field definitions
// ---------------------------------------------------------------------------

type FieldType = "text" | "number" | "date" | "select" | "tags"

interface FieldDefinition {
  value: string
  label: string
  type: FieldType
  options?: { value: string; label: string }[]
}

const AVAILABLE_FIELDS: FieldDefinition[] = [
  { value: "email", label: "Email", type: "text" },
  { value: "first_name", label: "First Name", type: "text" },
  { value: "last_name", label: "Last Name", type: "text" },
  {
    value: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "active", label: "Active" },
      { value: "unsubscribed", label: "Unsubscribed" },
      { value: "bounced", label: "Bounced" },
      { value: "complained", label: "Complained" },
      { value: "cleaned", label: "Cleaned" },
      { value: "pending", label: "Pending" },
    ],
  },
  { value: "engagement_score", label: "Engagement Score", type: "number" },
  { value: "geo_city", label: "City", type: "text" },
  { value: "geo_country", label: "Country", type: "text" },
  {
    value: "source",
    label: "Source",
    type: "select",
    options: [
      { value: "import", label: "Import" },
      { value: "api", label: "API" },
      { value: "form", label: "Signup Form" },
      { value: "manual", label: "Manual" },
    ],
  },
  { value: "tags", label: "Tags", type: "tags" },
  { value: "created_at", label: "Created At", type: "date" },
  { value: "last_email_opened_at", label: "Last Email Opened", type: "date" },
  { value: "last_email_clicked_at", label: "Last Email Clicked", type: "date" },
  { value: "last_activity_at", label: "Last Activity", type: "date" },
  { value: "emails_sent", label: "Total Emails Sent", type: "number" },
  { value: "emails_opened", label: "Total Emails Opened", type: "number" },
]

// ---------------------------------------------------------------------------
// Operator definitions per field type
// ---------------------------------------------------------------------------

interface OperatorOption {
  value: SegmentOperator
  label: string
}

const TEXT_OPERATORS: OperatorOption[] = [
  { value: "equals", label: "equals" },
  { value: "not_equals", label: "does not equal" },
  { value: "contains", label: "contains" },
  { value: "not_contains", label: "does not contain" },
  { value: "starts_with", label: "starts with" },
  { value: "ends_with", label: "ends with" },
  { value: "is_set", label: "is set" },
  { value: "is_not_set", label: "is not set" },
]

const NUMBER_OPERATORS: OperatorOption[] = [
  { value: "equals", label: "equals" },
  { value: "not_equals", label: "does not equal" },
  { value: "greater_than", label: "is greater than" },
  { value: "less_than", label: "is less than" },
  { value: "between", label: "is between" },
]

const DATE_OPERATORS: OperatorOption[] = [
  { value: "before", label: "is before" },
  { value: "after", label: "is after" },
  { value: "within_last", label: "is within the last" },
  { value: "not_within_last", label: "is not within the last" },
  { value: "is_set", label: "is set" },
  { value: "is_not_set", label: "is not set" },
]

const SELECT_OPERATORS: OperatorOption[] = [
  { value: "equals", label: "equals" },
  { value: "not_equals", label: "does not equal" },
  { value: "in", label: "is any of" },
]

const TAGS_OPERATORS: OperatorOption[] = [
  { value: "contains", label: "contains" },
  { value: "not_contains", label: "does not contain" },
]

function getOperatorsForType(type: FieldType): OperatorOption[] {
  switch (type) {
    case "text":
      return TEXT_OPERATORS
    case "number":
      return NUMBER_OPERATORS
    case "date":
      return DATE_OPERATORS
    case "select":
      return SELECT_OPERATORS
    case "tags":
      return TAGS_OPERATORS
    default:
      return TEXT_OPERATORS
  }
}

function getFieldDefinition(fieldValue: string): FieldDefinition | undefined {
  return AVAILABLE_FIELDS.find((f) => f.value === fieldValue)
}

// ---------------------------------------------------------------------------
// Value-less operators (no value input needed)
// ---------------------------------------------------------------------------

const VALUE_LESS_OPERATORS = new Set<SegmentOperator>([
  "is_set",
  "is_not_set",
])

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SegmentBuilderProps {
  value: SegmentConditionGroup
  onChange: (value: SegmentConditionGroup) => void
  customFields?: FieldDefinition[]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SegmentBuilder({
  value,
  onChange,
  customFields = [],
}: SegmentBuilderProps) {
  const allFields = [...AVAILABLE_FIELDS, ...customFields]

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function createEmptyCondition(): SegmentCondition {
    return {
      field: "email",
      operator: "contains",
      value: "",
    }
  }

  function createEmptyGroup(): SegmentConditionGroup {
    return {
      operator: "and",
      conditions: [createEmptyCondition()],
    }
  }

  // ---------------------------------------------------------------------------
  // Top-level operator toggle
  // ---------------------------------------------------------------------------

  function toggleTopOperator() {
    onChange({
      ...value,
      operator: value.operator === "and" ? "or" : "and",
    })
  }

  // ---------------------------------------------------------------------------
  // Add / remove / update conditions
  // ---------------------------------------------------------------------------

  function addRule() {
    onChange({
      ...value,
      conditions: [...value.conditions, createEmptyCondition()],
    })
  }

  function addGroup() {
    onChange({
      ...value,
      conditions: [...value.conditions, createEmptyGroup()],
    })
  }

  function removeCondition(index: number) {
    const next = value.conditions.filter((_, i) => i !== index)
    onChange({
      ...value,
      conditions: next.length > 0 ? next : [createEmptyCondition()],
    })
  }

  function updateCondition(
    index: number,
    updated: SegmentCondition | SegmentConditionGroup
  ) {
    const next = [...value.conditions]
    next[index] = updated
    onChange({ ...value, conditions: next })
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-3">
      {/* Top-level operator */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Match</span>
        <button
          type="button"
          onClick={toggleTopOperator}
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium transition-colors",
            value.operator === "and"
              ? "bg-indigo-100 text-indigo-700"
              : "bg-amber-100 text-amber-700"
          )}
        >
          {value.operator === "and" ? "ALL" : "ANY"}
          <ChevronDown className="h-3 w-3" />
        </button>
        <span className="text-sm text-gray-600">of the following conditions</span>
      </div>

      {/* Conditions list */}
      <div className="space-y-2">
        {value.conditions.map((condition, index) => {
          const isGroup = "conditions" in condition && !("field" in condition)

          return (
            <div key={index} className="relative">
              {/* Connecting line */}
              {index > 0 && (
                <div className="absolute -top-2 left-5 flex items-center">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                      value.operator === "and"
                        ? "bg-indigo-50 text-indigo-600"
                        : "bg-amber-50 text-amber-600"
                    )}
                  >
                    {value.operator}
                  </span>
                </div>
              )}

              {isGroup ? (
                <NestedGroupBuilder
                  group={condition as SegmentConditionGroup}
                  onChange={(updated) => updateCondition(index, updated)}
                  onRemove={() => removeCondition(index)}
                  allFields={allFields}
                />
              ) : (
                <RuleRow
                  condition={condition as SegmentCondition}
                  onChange={(updated) => updateCondition(index, updated)}
                  onRemove={() => removeCondition(index)}
                  allFields={allFields}
                  canRemove={value.conditions.length > 1}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Add buttons */}
      <div className="flex items-center gap-2 pt-1">
        <Button variant="outline" size="sm" onClick={addRule}>
          <Plus className="h-3.5 w-3.5" />
          Add Rule
        </Button>
        <Button variant="ghost" size="sm" onClick={addGroup}>
          <Plus className="h-3.5 w-3.5" />
          Add Group
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Rule Row
// ---------------------------------------------------------------------------

interface RuleRowProps {
  condition: SegmentCondition
  onChange: (updated: SegmentCondition) => void
  onRemove: () => void
  allFields: FieldDefinition[]
  canRemove: boolean
}

function RuleRow({
  condition,
  onChange,
  onRemove,
  allFields,
  canRemove,
}: RuleRowProps) {
  const fieldDef = getFieldDefinition(condition.field) ??
    allFields.find((f) => f.value === condition.field)
  const fieldType = fieldDef?.type ?? "text"
  const operators = getOperatorsForType(fieldType)
  const needsValue = !VALUE_LESS_OPERATORS.has(condition.operator)
  const isBetween = condition.operator === "between"
  const isWithinLast =
    condition.operator === "within_last" ||
    condition.operator === "not_within_last"

  // Parse the "within last" value
  const [withinAmount, setWithinAmount] = useState(() => {
    if (
      isWithinLast &&
      typeof condition.value === "object" &&
      condition.value !== null &&
      !Array.isArray(condition.value)
    ) {
      return String((condition.value as { amount: number }).amount ?? "30")
    }
    return typeof condition.value === "number" ? String(condition.value) : "30"
  })

  const [withinUnit, setWithinUnit] = useState(() => {
    if (
      isWithinLast &&
      typeof condition.value === "object" &&
      condition.value !== null &&
      !Array.isArray(condition.value)
    ) {
      return (condition.value as { unit: string }).unit ?? "days"
    }
    return "days"
  })

  // Between values
  const [betweenMin, setBetweenMin] = useState(() => {
    if (isBetween && Array.isArray(condition.value)) {
      return String(condition.value[0] ?? "")
    }
    return ""
  })

  const [betweenMax, setBetweenMax] = useState(() => {
    if (isBetween && Array.isArray(condition.value)) {
      return String(condition.value[1] ?? "")
    }
    return ""
  })

  function handleFieldChange(field: string) {
    const newFieldDef = allFields.find((f) => f.value === field)
    const newType = newFieldDef?.type ?? "text"
    const newOperators = getOperatorsForType(newType)
    onChange({
      field,
      operator: newOperators[0].value,
      value: "",
    })
  }

  function handleOperatorChange(operator: SegmentOperator) {
    if (VALUE_LESS_OPERATORS.has(operator)) {
      onChange({ ...condition, operator, value: null })
    } else if (operator === "between") {
      onChange({ ...condition, operator, value: ["", ""] })
    } else if (operator === "within_last" || operator === "not_within_last") {
      onChange({
        ...condition,
        operator,
        value: { amount: 30, unit: "days" } as unknown as string,
      })
    } else {
      onChange({ ...condition, operator, value: "" })
    }
  }

  function handleValueChange(val: string) {
    if (fieldType === "number") {
      onChange({ ...condition, value: val === "" ? "" : Number(val) })
    } else {
      onChange({ ...condition, value: val })
    }
  }

  function handleBetweenChange(min: string, max: string) {
    setBetweenMin(min)
    setBetweenMax(max)
    onChange({
      ...condition,
      value: [min === "" ? "" : Number(min), max === "" ? "" : Number(max)] as unknown as string[],
    })
  }

  function handleWithinLastChange(amount: string, unit: string) {
    setWithinAmount(amount)
    setWithinUnit(unit)
    onChange({
      ...condition,
      value: { amount: Number(amount) || 0, unit } as unknown as string,
    })
  }

  return (
    <div className="flex items-start gap-2 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <GripVertical className="mt-1.5 h-4 w-4 shrink-0 text-gray-300" />

      {/* Field selector */}
      <Select
        value={condition.field}
        onChange={(e) => handleFieldChange(e.target.value)}
        options={allFields.map((f) => ({ value: f.value, label: f.label }))}
        className="w-44"
      />

      {/* Operator selector */}
      <Select
        value={condition.operator}
        onChange={(e) => handleOperatorChange(e.target.value as SegmentOperator)}
        options={operators.map((o) => ({ value: o.value, label: o.label }))}
        className="w-44"
      />

      {/* Value input */}
      {needsValue && !isBetween && !isWithinLast && (
        <>
          {fieldType === "select" && fieldDef?.options ? (
            <Select
              value={String(condition.value ?? "")}
              onChange={(e) => handleValueChange(e.target.value)}
              options={fieldDef.options}
              placeholder="Select value..."
              className="w-44"
            />
          ) : (
            <Input
              type={fieldType === "number" ? "number" : fieldType === "date" ? "date" : "text"}
              value={String(condition.value ?? "")}
              onChange={(e) => handleValueChange(e.target.value)}
              placeholder={
                fieldType === "tags" ? "Enter tag..." : "Enter value..."
              }
              className="w-44"
            />
          )}
        </>
      )}

      {/* Between inputs */}
      {isBetween && (
        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            value={betweenMin}
            onChange={(e) => handleBetweenChange(e.target.value, betweenMax)}
            placeholder="Min"
            className="w-24"
          />
          <span className="text-sm text-gray-500">and</span>
          <Input
            type="number"
            value={betweenMax}
            onChange={(e) => handleBetweenChange(betweenMin, e.target.value)}
            placeholder="Max"
            className="w-24"
          />
        </div>
      )}

      {/* Within last inputs */}
      {isWithinLast && (
        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            value={withinAmount}
            onChange={(e) =>
              handleWithinLastChange(e.target.value, withinUnit)
            }
            placeholder="30"
            className="w-20"
          />
          <Select
            value={withinUnit}
            onChange={(e) =>
              handleWithinLastChange(withinAmount, e.target.value)
            }
            options={[
              { value: "days", label: "days" },
              { value: "weeks", label: "weeks" },
              { value: "months", label: "months" },
            ]}
            className="w-28"
          />
        </div>
      )}

      {/* Remove button */}
      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="mt-1 shrink-0 rounded-md p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
          aria-label="Remove rule"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Nested Group Builder
// ---------------------------------------------------------------------------

interface NestedGroupBuilderProps {
  group: SegmentConditionGroup
  onChange: (updated: SegmentConditionGroup) => void
  onRemove: () => void
  allFields: FieldDefinition[]
}

function NestedGroupBuilder({
  group,
  onChange,
  onRemove,
  allFields,
}: NestedGroupBuilderProps) {
  function createEmptyCondition(): SegmentCondition {
    return {
      field: "email",
      operator: "contains",
      value: "",
    }
  }

  function toggleOperator() {
    onChange({
      ...group,
      operator: group.operator === "and" ? "or" : "and",
    })
  }

  function addRule() {
    onChange({
      ...group,
      conditions: [...group.conditions, createEmptyCondition()],
    })
  }

  function removeCondition(index: number) {
    const next = group.conditions.filter((_, i) => i !== index)
    onChange({
      ...group,
      conditions: next.length > 0 ? next : [createEmptyCondition()],
    })
  }

  function updateCondition(
    index: number,
    updated: SegmentCondition | SegmentConditionGroup
  ) {
    const next = [...group.conditions]
    next[index] = updated
    onChange({ ...group, conditions: next })
  }

  return (
    <div className="relative rounded-lg border-2 border-dashed border-gray-300 bg-gray-50/50 p-4">
      {/* Group header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500">GROUP</span>
          <button
            type="button"
            onClick={toggleOperator}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
              group.operator === "and"
                ? "bg-indigo-100 text-indigo-700"
                : "bg-amber-100 text-amber-700"
            )}
          >
            {group.operator === "and" ? "ALL" : "ANY"}
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-md p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
          aria-label="Remove group"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Group conditions */}
      <div className="space-y-2">
        {group.conditions.map((condition, index) => {
          if ("field" in condition) {
            return (
              <div key={index} className="relative">
                {index > 0 && (
                  <div className="absolute -top-1.5 left-5">
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase",
                        group.operator === "and"
                          ? "bg-indigo-50 text-indigo-500"
                          : "bg-amber-50 text-amber-500"
                      )}
                    >
                      {group.operator}
                    </span>
                  </div>
                )}
                <RuleRow
                  condition={condition as SegmentCondition}
                  onChange={(updated) => updateCondition(index, updated)}
                  onRemove={() => removeCondition(index)}
                  allFields={allFields}
                  canRemove={group.conditions.length > 1}
                />
              </div>
            )
          }
          return null
        })}
      </div>

      <div className="mt-2">
        <Button variant="ghost" size="sm" onClick={addRule}>
          <Plus className="h-3.5 w-3.5" />
          Add Rule
        </Button>
      </div>
    </div>
  )
}
