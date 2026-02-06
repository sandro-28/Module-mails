const TRACKING_DOMAIN = process.env.NEXT_PUBLIC_TRACKING_DOMAIN || 'http://localhost:3000'

/**
 * Inject a 1x1 tracking pixel into the HTML email content.
 * The pixel is inserted just before the closing </body> tag.
 *
 * Pixel URL format: /track/open/{campaignEmailId}
 */
export function injectOpenTracker(html: string, campaignEmailId: string): string {
  const pixelUrl = `${TRACKING_DOMAIN}/track/open/${campaignEmailId}`
  const pixelHtml = `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none;width:1px;height:1px;border:0;" />`

  // Insert before </body> if it exists
  const bodyCloseIndex = html.toLowerCase().lastIndexOf('</body>')
  if (bodyCloseIndex !== -1) {
    return html.slice(0, bodyCloseIndex) + pixelHtml + html.slice(bodyCloseIndex)
  }

  // Otherwise append at the end
  return html + pixelHtml
}

/**
 * Check whether HTML content already contains an open tracking pixel.
 */
export function hasOpenTrackingPixel(html: string): boolean {
  return html.includes(`${TRACKING_DOMAIN}/track/open/`)
}
