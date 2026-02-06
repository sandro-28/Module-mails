import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  apiResponse,
  apiError,
  authenticateApiKey,
  isErrorResponse,
} from '@/lib/api/helpers'

interface RouteParams {
  params: Promise<{ id: string }>
}

// DELETE /api/v1/webhooks/:id — delete webhook
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = await authenticateApiKey(request)
  if (isErrorResponse(auth)) return auth

  const { id } = await params
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('webhooks')
    .delete()
    .eq('id', id)
    .eq('organization_id', auth.organizationId)

  if (error) {
    return apiError('Failed to delete webhook.', 500)
  }

  return apiResponse({ deleted: true })
}
