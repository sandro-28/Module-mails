import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireTenantContext } from '@/lib/auth/tenant-context'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatNumber, formatPercentage } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { CopyEmbedCode } from './copy-button'

interface FormDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function FormDetailPage({ params }: FormDetailPageProps) {
  const { id } = await params
  const ctx = await requireTenantContext()
  const supabase = createAdminClient()

  const { data: form } = await supabase
    .from('signup_forms')
    .select('*')
    .eq('id', id)
    .eq('organization_id', ctx.organizationId)
    .single()

  if (!form) {
    notFound()
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const embedCode = `<div id="mf-form-${id}"></div>\n<script src="${appUrl}/embed/form.js" data-form-id="${id}"></script>`

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{form.name}</h1>
            <Badge variant={form.status === 'active' ? 'default' : 'secondary'} className="capitalize">
              {form.status}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Created {new Date(form.created_at).toLocaleDateString()}
          </p>
        </div>
        <Link
          href={`/forms/new?edit=${id}`}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Edit Form
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm text-gray-500 mb-1">Total Views</div>
          <div className="text-2xl font-bold text-gray-900">{formatNumber(form.total_views)}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm text-gray-500 mb-1">Submissions</div>
          <div className="text-2xl font-bold text-gray-900">{formatNumber(form.total_submissions)}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm text-gray-500 mb-1">Conversion Rate</div>
          <div className="text-2xl font-bold text-gray-900">{formatPercentage(form.conversion_rate)}</div>
        </div>
      </div>

      {/* Embed code */}
      <CopyEmbedCode embedCode={embedCode} formId={id} appUrl={appUrl} />

      {/* Recent submissions placeholder */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
          Recent Submissions
        </h2>
        {form.total_submissions === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            No submissions yet. Share your form to start collecting subscribers.
          </p>
        ) : (
          <p className="text-sm text-gray-500 text-center py-8">
            {formatNumber(form.total_submissions)} total submissions.
            Last submission: {form.last_submission_at ? new Date(form.last_submission_at).toLocaleString() : 'N/A'}
          </p>
        )}
      </div>
    </div>
  )
}
