import Link from 'next/link'
import { requireTenantContext } from '@/lib/auth/tenant-context'
import { createAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'
import { formatNumber, formatPercentage } from '@/lib/utils'

export default async function FormsListPage() {
  const ctx = await requireTenantContext()
  const supabase = createAdminClient()

  const { data: forms } = await supabase
    .from('signup_forms')
    .select('*')
    .eq('organization_id', ctx.organizationId)
    .order('created_at', { ascending: false })

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Forms</h1>
          <p className="text-sm text-gray-500 mt-1">
            Signup forms to grow your email list.
          </p>
        </div>
        <Link
          href="/forms/new"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Form
        </Link>
      </div>

      {!forms || forms.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-sm font-medium text-gray-900 mb-1">No forms yet</h3>
          <p className="text-sm text-gray-500 mb-4">
            Create your first signup form to start collecting subscribers.
          </p>
          <Link
            href="/forms/new"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Create Form
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Name</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Type</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Submissions</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Conversion</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Status</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {forms.map((form) => (
                <tr key={form.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/forms/${form.id}`} className="text-sm font-medium text-blue-600 hover:underline">
                      {form.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="text-xs capitalize">
                      {form.type}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-700">
                    {formatNumber(form.total_submissions)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-700">
                    {formatPercentage(form.conversion_rate)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={form.status === 'active' ? 'default' : 'secondary'}
                      className="text-xs capitalize"
                    >
                      {form.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(form.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
