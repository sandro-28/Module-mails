import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'

interface ViewPageProps {
  params: Promise<{ token: string }>
}

// "View in browser" page — renders the HTML content of an email
export default async function ViewInBrowserPage({ params }: ViewPageProps) {
  const { token } = await params
  const supabase = createAdminClient()

  // Token is the campaign_email ID or a lookup token
  const { data: campaignEmail } = await supabase
    .from('campaign_emails')
    .select('id, campaign_id, subject, from_name')
    .eq('id', token)
    .single()

  if (!campaignEmail) {
    notFound()
  }

  // Get campaign HTML content
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('html_content, subject, from_name')
    .eq('id', campaignEmail.campaign_id)
    .single()

  if (!campaign?.html_content) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-sm font-medium text-gray-900">
              {campaignEmail.subject || campaign.subject}
            </h1>
            <p className="text-xs text-gray-500">
              From: {campaignEmail.from_name || campaign.from_name}
            </p>
          </div>
          <span className="text-xs text-gray-400">View in browser</span>
        </div>
      </div>

      {/* Email content */}
      <div className="max-w-3xl mx-auto my-6 bg-white shadow-sm rounded-lg overflow-hidden">
        <div
          dangerouslySetInnerHTML={{ __html: campaign.html_content }}
          className="email-content"
        />
      </div>
    </div>
  )
}
