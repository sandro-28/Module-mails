/**
 * Email content personalizer.
 * Replaces merge tags in HTML/text content with contact-specific data.
 */

export interface PersonalizationContext {
  contact: {
    first_name?: string | null
    last_name?: string | null
    full_name?: string | null
    email: string
    company?: string | null
    job_title?: string | null
    phone?: string | null
    tags?: string[]
    custom_fields?: Record<string, unknown>
    [key: string]: unknown
  }
  organization?: {
    name?: string
    website?: string
    [key: string]: unknown
  }
  campaign?: {
    name?: string
    subject?: string
    [key: string]: unknown
  }
  unsubscribe_url?: string
  preferences_url?: string
  view_in_browser_url?: string
  custom?: Record<string, unknown>
}

/**
 * Replace all merge tags in the given content string.
 *
 * Supported tag formats:
 * - {{contact.first_name}} -- simple field access
 * - {{contact.first_name|"there"}} -- with fallback value
 * - {{contact.custom_fields.favorite_color}} -- nested field access
 * - {{#if contact.tags contains "vip"}}...{{/if}} -- conditional blocks
 */
export function personalize(content: string, context: PersonalizationContext): string {
  let result = content

  // 1. Process conditional blocks first
  result = result.replace(
    /\{\{#if\s+(.+?)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_match: string, condition: string, block: string) => {
      const isTrue = evaluateCondition(condition.trim(), context)
      return isTrue ? block : ''
    },
  )

  // 2. Handle merge tags with fallback: {{contact.first_name|"default"}}
  result = result.replace(
    /\{\{([^|}]+)\|"([^"]*)"\}\}/g,
    (_match: string, path: string, fallback: string) => {
      const value = resolvePath(path.trim(), context)
      return value || fallback
    },
  )

  // 3. Handle simple merge tags: {{contact.first_name}}
  result = result.replace(/\{\{([^}]+)\}\}/g, (_match: string, path: string) => {
    const value = resolvePath(path.trim(), context)
    return value || ''
  })

  return result
}

function resolvePath(path: string, data: PersonalizationContext): string {
  const parts = path.split('.')
  let current: unknown = data

  for (const part of parts) {
    if (current === null || current === undefined) return ''
    if (typeof current === 'object') {
      current = (current as Record<string, unknown>)[part]
    } else {
      return ''
    }
  }

  if (current === null || current === undefined) return ''
  if (Array.isArray(current)) return current.join(', ')
  return String(current)
}

function evaluateCondition(condition: string, data: PersonalizationContext): boolean {
  // Parse: "contact.tags contains "vip""
  const containsMatch = condition.match(/^(.+?)\s+contains\s+"([^"]+)"$/)
  if (containsMatch) {
    const rawValue = resolveRaw(containsMatch[1].trim(), data)
    const searchValue = containsMatch[2]
    if (Array.isArray(rawValue)) {
      return rawValue.includes(searchValue)
    }
    const strValue = typeof rawValue === 'string' ? rawValue : ''
    return strValue.includes(searchValue)
  }

  // Parse: "contact.field equals "value""
  const equalsMatch = condition.match(/^(.+?)\s+equals\s+"([^"]+)"$/)
  if (equalsMatch) {
    const value = resolvePath(equalsMatch[1].trim(), data)
    return value === equalsMatch[2]
  }

  // Parse: "contact.field is_set"
  const isSetMatch = condition.match(/^(.+?)\s+is_set$/)
  if (isSetMatch) {
    const value = resolvePath(isSetMatch[1].trim(), data)
    return value !== ''
  }

  // Parse: "contact.field is_not_set"
  const isNotSetMatch = condition.match(/^(.+?)\s+is_not_set$/)
  if (isNotSetMatch) {
    const value = resolvePath(isNotSetMatch[1].trim(), data)
    return value === ''
  }

  // Simple truthy check
  const value = resolvePath(condition, data)
  return !!value && value !== ''
}

/**
 * Resolve a path and return the raw (uncast) value.
 */
function resolveRaw(path: string, data: PersonalizationContext): unknown {
  const parts = path.split('.')
  let current: unknown = data

  for (const part of parts) {
    if (current === null || current === undefined) return null
    if (typeof current === 'object') {
      current = (current as Record<string, unknown>)[part]
    } else {
      return null
    }
  }

  return current
}

/**
 * Personalize both HTML and text content for a contact.
 */
export function personalizeEmail(
  htmlContent: string | null,
  textContent: string | null,
  context: PersonalizationContext,
): { html: string | null; text: string | null } {
  return {
    html: htmlContent ? personalize(htmlContent, context) : null,
    text: textContent ? personalize(textContent, context) : null,
  }
}

/**
 * Extract all merge tags from content for validation.
 */
export function extractMergeTags(content: string): string[] {
  const tags = new Set<string>()
  const regex = /\{\{([^}|]+)/g
  let match

  while ((match = regex.exec(content)) !== null) {
    const tag = match[1].trim()
    if (!tag.startsWith('#') && !tag.startsWith('/')) {
      tags.add(tag)
    }
  }

  return Array.from(tags)
}
