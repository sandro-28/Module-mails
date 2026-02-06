/**
 * Convert HTML email content to plain text.
 * Strips tags, converts links to text format, preserves structure.
 * Adds unsubscribe link at bottom.
 */

export interface TextGeneratorOptions {
  /** URL for the unsubscribe link to append at the bottom. */
  unsubscribeUrl?: string
  /** Maximum line width (0 = no wrapping). Default: 0 */
  lineWidth?: number
}

/**
 * Convert HTML to plain text suitable for the text/plain version of an email.
 */
export function htmlToText(html: string, options: TextGeneratorOptions = {}): string {
  const { unsubscribeUrl, lineWidth = 0 } = options

  let text = html

  // Remove style and script tags entirely
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')

  // Remove HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, '')

  // Convert headings to uppercase with newlines
  text = text.replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, (_match, content) => {
    return `\n\n${stripTags(content).toUpperCase()}\n\n`
  })

  // Convert links to text format: text (url)
  text = text.replace(
    /<a[^>]+href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi,
    (_match, url: string, linkText: string) => {
      const cleanText = linkText.replace(/<[^>]+>/g, '').trim()
      if (cleanText === url || !cleanText) {
        return url
      }
      return `${cleanText} (${url})`
    },
  )

  // Convert images to alt text
  text = text.replace(/<img[^>]+alt=["']([^"']*)["'][^>]*>/gi, '[$1]')
  text = text.replace(/<img[^>]*>/gi, '')

  // Convert line breaks
  text = text.replace(/<br\s*\/?>/gi, '\n')

  // Convert block elements to newlines
  text = text.replace(/<\/p>/gi, '\n\n')
  text = text.replace(/<\/div>/gi, '\n')
  text = text.replace(/<\/tr>/gi, '\n')

  // Convert list items
  text = text.replace(/<li[^>]*>/gi, '  - ')
  text = text.replace(/<\/li>/gi, '\n')

  // Convert hr to separator
  text = text.replace(/<hr[^>]*>/gi, '\n---\n')

  // Convert table cells to tabs
  text = text.replace(/<td[^>]*>([\s\S]*?)<\/td>/gi, (_match, content) => {
    return `${stripTags(content).trim()}\t`
  })

  // Convert blockquotes
  text = text.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_match, content) => {
    return stripTags(content)
      .split('\n')
      .map((line) => `> ${line}`)
      .join('\n')
  })

  // Remove all remaining HTML tags
  text = stripTags(text)

  // Decode HTML entities
  text = decodeEntities(text)

  // Clean up whitespace
  text = text.replace(/[ \t]+/g, ' ')
  text = text.replace(/\n{3,}/g, '\n\n')
  text = text.trim()

  // Word wrap if needed
  if (lineWidth > 0) {
    text = wordWrap(text, lineWidth)
  }

  // Add unsubscribe footer
  if (unsubscribeUrl) {
    text += `\n\n---\nTo unsubscribe from these emails, visit: ${unsubscribeUrl}\n`
  }

  return text
}

/**
 * Add unsubscribe footer to plain text email.
 */
export function addTextFooter(text: string, unsubscribeUrl: string): string {
  return `${text}\n\n---\nTo unsubscribe from these emails, visit: ${unsubscribeUrl}\n`
}

/**
 * Strip all HTML tags from a string.
 */
function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}

/**
 * Decode common HTML entities.
 */
function decodeEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    '&mdash;': '--',
    '&ndash;': '-',
    '&hellip;': '...',
    '&copy;': '(c)',
    '&reg;': '(R)',
    '&trade;': '(TM)',
    '&bull;': '*',
    '&laquo;': '<<',
    '&raquo;': '>>',
    '&euro;': '\u20AC',
  }

  let result = text
  for (const [entity, replacement] of Object.entries(entities)) {
    result = result.replace(new RegExp(entity, 'g'), replacement)
  }

  // Numeric entities
  result = result.replace(/&#(\d+);/g, (_match, code) => {
    return String.fromCharCode(parseInt(code, 10))
  })
  result = result.replace(/&#x([a-fA-F0-9]+);/g, (_match, hex) => {
    return String.fromCharCode(parseInt(hex, 16))
  })

  return result
}

/**
 * Simple word wrap to keep lines under a maximum width.
 */
function wordWrap(text: string, maxWidth: number): string {
  const lines = text.split('\n')
  const wrapped: string[] = []

  for (const line of lines) {
    if (line.length <= maxWidth) {
      wrapped.push(line)
      continue
    }

    const words = line.split(' ')
    let currentLine = ''

    for (const word of words) {
      if (currentLine.length + word.length + 1 > maxWidth && currentLine.length > 0) {
        wrapped.push(currentLine)
        currentLine = word
      } else {
        currentLine = currentLine ? `${currentLine} ${word}` : word
      }
    }

    if (currentLine) {
      wrapped.push(currentLine)
    }
  }

  return wrapped.join('\n')
}
