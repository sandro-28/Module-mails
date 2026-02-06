import type {
  SegmentConditionGroup,
  SegmentCondition,
  SegmentOperator,
} from "@/types/database"

// ---------------------------------------------------------------------------
// Type guard
// ---------------------------------------------------------------------------

function isCondition(
  item: SegmentCondition | SegmentConditionGroup
): item is SegmentCondition {
  return "field" in item
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function subtractDuration(
  amount: number,
  unit: string
): string {
  const now = new Date()
  switch (unit) {
    case "days":
      now.setDate(now.getDate() - amount)
      break
    case "weeks":
      now.setDate(now.getDate() - amount * 7)
      break
    case "months":
      now.setMonth(now.getMonth() - amount)
      break
    default:
      now.setDate(now.getDate() - amount)
  }
  return now.toISOString()
}

// ---------------------------------------------------------------------------
// Field mapping - determines if a field is a custom field or a base column
// ---------------------------------------------------------------------------

const BASE_CONTACT_FIELDS = new Set([
  "email",
  "first_name",
  "last_name",
  "full_name",
  "phone",
  "company",
  "job_title",
  "status",
  "source",
  "source_detail",
  "geo_country",
  "geo_region",
  "geo_city",
  "timezone",
  "language",
  "tags",
  "engagement_score",
  "emails_sent",
  "emails_opened",
  "emails_clicked",
  "emails_bounced",
  "last_email_sent_at",
  "last_email_opened_at",
  "last_email_clicked_at",
  "last_activity_at",
  "created_at",
  "updated_at",
  "subscribed_at",
  "unsubscribed_at",
  "double_opt_in_confirmed",
])

function isCustomField(field: string): boolean {
  return !BASE_CONTACT_FIELDS.has(field)
}

function getCustomFieldPath(field: string): string {
  return `custom_fields->>${field}`
}

// ---------------------------------------------------------------------------
// Apply a single condition to a Supabase query
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyCondition(query: any, condition: SegmentCondition): any {
  const { field, operator, value } = condition

  // Determine the actual column or path to filter on
  const isCustom = isCustomField(field)
  const column = isCustom ? getCustomFieldPath(field) : field

  // For tags field, use array operators
  if (field === "tags") {
    return applyTagsCondition(query, operator, value)
  }

  switch (operator) {
    case "equals":
      return query.eq(column, value)

    case "not_equals":
      return query.neq(column, value)

    case "contains":
      return query.ilike(column, `%${value}%`)

    case "not_contains":
      return query.not(column, "ilike", `%${value}%`)

    case "starts_with":
      return query.ilike(column, `${value}%`)

    case "ends_with":
      return query.ilike(column, `%${value}`)

    case "greater_than":
      return query.gt(column, value)

    case "less_than":
      return query.lt(column, value)

    case "greater_than_or_equals":
      return query.gte(column, value)

    case "less_than_or_equals":
      return query.lte(column, value)

    case "is_set":
      return query.not(column, "is", null)

    case "is_not_set":
      return query.is(column, null)

    case "in":
      return query.in(column, Array.isArray(value) ? value : [value])

    case "not_in":
      return query.not(
        column,
        "in",
        `(${(Array.isArray(value) ? value : [value]).join(",")})`
      )

    case "between": {
      if (Array.isArray(value) && value.length === 2) {
        return query.gte(column, value[0]).lte(column, value[1])
      }
      return query
    }

    case "before":
      return query.lt(column, value)

    case "after":
      return query.gt(column, value)

    case "within_last": {
      // value is expected to be an object like { amount: 30, unit: "days" }
      // or a simple number (defaults to days)
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        const v = value as unknown as { amount: number; unit: string }
        const threshold = subtractDuration(v.amount, v.unit)
        return query.gte(column, threshold)
      }
      if (typeof value === "number") {
        const threshold = subtractDuration(value, "days")
        return query.gte(column, threshold)
      }
      return query
    }

    case "not_within_last": {
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        const v = value as unknown as { amount: number; unit: string }
        const threshold = subtractDuration(v.amount, v.unit)
        return query.lt(column, threshold)
      }
      if (typeof value === "number") {
        const threshold = subtractDuration(value, "days")
        return query.lt(column, threshold)
      }
      return query
    }

    default:
      return query
  }
}

// ---------------------------------------------------------------------------
// Tags-specific condition handling
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyTagsCondition(query: any, operator: SegmentOperator, value: unknown): any {
  switch (operator) {
    case "contains":
      return query.contains("tags", Array.isArray(value) ? value : [value])

    case "not_contains":
      // Supabase doesn't directly support "not contains" for arrays,
      // so we use not + contains
      return query.not(
        "tags",
        "cs",
        `{${Array.isArray(value) ? value.join(",") : value}}`
      )

    case "equals":
      return query.contains("tags", Array.isArray(value) ? value : [value])

    case "is_set":
      return query.not("tags", "eq", "{}")

    case "is_not_set":
      return query.eq("tags", "{}")

    default:
      return query
  }
}

// ---------------------------------------------------------------------------
// Build a Supabase query from a condition group (recursive)
// ---------------------------------------------------------------------------

/**
 * Applies a segment condition group to a Supabase query builder.
 *
 * For AND groups, conditions are chained sequentially.
 * For OR groups, conditions are wrapped in an `.or()` call.
 *
 * @param conditions  The segment condition group (potentially nested)
 * @param query       The Supabase query builder (from .from("contacts").select())
 * @returns           The modified query builder
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildSegmentQuery(conditions: SegmentConditionGroup, query: any): any {
  if (!conditions.conditions || conditions.conditions.length === 0) {
    return query
  }

  if (conditions.operator === "and") {
    // Chain all conditions sequentially
    let q = query
    for (const item of conditions.conditions) {
      if (isCondition(item)) {
        q = applyCondition(q, item)
      } else {
        // Nested group
        q = buildSegmentQuery(item, q)
      }
    }
    return q
  }

  // OR: Build individual filter strings and combine with .or()
  // For complex OR groups, we apply each condition set and use Supabase's .or()
  const orFilters: string[] = []

  for (const item of conditions.conditions) {
    if (isCondition(item)) {
      const filterStr = buildFilterString(item)
      if (filterStr) {
        orFilters.push(filterStr)
      }
    }
    // Note: Nested OR groups with further nesting have limited support
    // in Supabase's PostgREST syntax. For deeply nested groups,
    // consider using RPC functions.
  }

  if (orFilters.length > 0) {
    return query.or(orFilters.join(","))
  }

  return query
}

// ---------------------------------------------------------------------------
// Build a PostgREST filter string for a single condition
// ---------------------------------------------------------------------------

function buildFilterString(condition: SegmentCondition): string | null {
  const { field, operator, value } = condition

  if (field === "tags") {
    switch (operator) {
      case "contains":
        return `tags.cs.{${Array.isArray(value) ? value.join(",") : value}}`
      case "not_contains":
        return `not(tags.cs.{${Array.isArray(value) ? value.join(",") : value}})`
      default:
        return null
    }
  }

  const isCustom = isCustomField(field)
  const column = isCustom ? `custom_fields->>${field}` : field

  switch (operator) {
    case "equals":
      return `${column}.eq.${value}`
    case "not_equals":
      return `${column}.neq.${value}`
    case "contains":
      return `${column}.ilike.%${value}%`
    case "not_contains":
      return `not(${column}.ilike.%${value}%)`
    case "starts_with":
      return `${column}.ilike.${value}%`
    case "ends_with":
      return `${column}.ilike.%${value}`
    case "greater_than":
      return `${column}.gt.${value}`
    case "less_than":
      return `${column}.lt.${value}`
    case "greater_than_or_equals":
      return `${column}.gte.${value}`
    case "less_than_or_equals":
      return `${column}.lte.${value}`
    case "is_set":
      return `${column}.not.is.null`
    case "is_not_set":
      return `${column}.is.null`
    case "in":
      return `${column}.in.(${Array.isArray(value) ? value.join(",") : value})`
    case "before":
      return `${column}.lt.${value}`
    case "after":
      return `${column}.gt.${value}`
    case "within_last": {
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        const v = value as unknown as { amount: number; unit: string }
        return `${column}.gte.${subtractDuration(v.amount, v.unit)}`
      }
      if (typeof value === "number") {
        return `${column}.gte.${subtractDuration(value, "days")}`
      }
      return null
    }
    case "not_within_last": {
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        const v = value as unknown as { amount: number; unit: string }
        return `${column}.lt.${subtractDuration(v.amount, v.unit)}`
      }
      if (typeof value === "number") {
        return `${column}.lt.${subtractDuration(value, "days")}`
      }
      return null
    }
    case "between": {
      if (Array.isArray(value) && value.length === 2) {
        return `and(${column}.gte.${value[0]},${column}.lte.${value[1]})`
      }
      return null
    }
    default:
      return null
  }
}
