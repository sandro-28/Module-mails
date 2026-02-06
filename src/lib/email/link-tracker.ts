import { randomBytes } from 'crypto'

export interface TrackedLinkRecord {
  original_url: string
  tracking_url: string
  tracking_code: string
  link_index: number
}

export interface LinkTrackingResult {
  html: string
  trackedLinks: TrackedLinkRecord[]
}

const TRACKING_DOMAIN = process.env.NEXT_PUBLIC_TRACKING_DOMAIN || 'http://localhost:3000'

/**
 * URLs containing these patterns are excluded from tracking.
 * Typically unsubscribe links should not be tracked.
 */
const EXCLUDE_PATTERNS = [
  '/unsubscribe',
  '/preferences',
  'mailto:',
  'tel:',
]

/**
 * Replace all <a href="..."> links in HTML with tracking URLs.
 * Generates tracked_links records for database insertion.
 *
 * Unsubscribe links and special protocols (mailto:, tel:) are excluded
 * from tracking.
 */
export function replaceLinksWithTracking(
  html: string,
  campaignId: string,
  campaignEmailId?: string,
  options?: { utmSource?: string; utmMedium?: string; utmCampaign?: string },
): LinkTrackingResult {
  const trackedLinks: TrackedLinkRecord[] = []
  const seenUrls = new Map<string, string>()
  let linkIndex = 0

  const result = html.replace(
    /<a\s+([^>]*?)href=["']([^"']+)["']([^>]*?)>/gi,
    (fullMatch: string, before: string, href: string, after: string) => {
      // Skip excluded URLs
      if (shouldExclude(href)) {
        return fullMatch
      }

      // Skip already-tracked URLs
      if (href.includes('/track/click/')) {
        return fullMatch
      }

      // Add UTM parameters to original URL if provided
      let finalUrl = href
      if (options?.utmSource) {
        const separator = finalUrl.includes('?') ? '&' : '?'
        const utmParams = new URLSearchParams()
        if (options.utmSource) utmParams.set('utm_source', options.utmSource)
        if (options.utmMedium) utmParams.set('utm_medium', options.utmMedium)
        if (options.utmCampaign) utmParams.set('utm_campaign', options.utmCampaign)
        finalUrl = `${finalUrl}${separator}${utmParams.toString()}`
      }

      // Reuse tracking code for duplicate URLs
      let trackingCode = seenUrls.get(href)
      if (!trackingCode) {
        trackingCode = randomBytes(16).toString('hex')
        seenUrls.set(href, trackingCode)
      }

      const trackingParams = new URLSearchParams({
        url: finalUrl,
        ...(campaignEmailId ? { e: campaignEmailId } : {}),
      })
      const trackingUrl = `${TRACKING_DOMAIN}/track/click/${trackingCode}?${trackingParams.toString()}`

      trackedLinks.push({
        original_url: href,
        tracking_url: trackingUrl,
        tracking_code: trackingCode,
        link_index: linkIndex++,
      })

      return `<a ${before}href="${trackingUrl}"${after}>`
    },
  )

  return { html: result, trackedLinks }
}

/**
 * Check whether a URL should be excluded from tracking.
 */
function shouldExclude(url: string): boolean {
  const lowerUrl = url.toLowerCase()
  return EXCLUDE_PATTERNS.some((pattern) => lowerUrl.includes(pattern))
}

/**
 * Build tracked link records ready for database insertion.
 */
export function buildTrackedLinkInserts(
  campaignId: string,
  trackedLinks: TrackedLinkRecord[],
) {
  return trackedLinks.map((link) => ({
    campaign_id: campaignId,
    original_url: link.original_url,
    tracking_url: link.tracking_url,
    tracking_code: link.tracking_code,
    link_index: link.link_index,
    total_clicks: 0,
    unique_clicks: 0,
  }))
}
