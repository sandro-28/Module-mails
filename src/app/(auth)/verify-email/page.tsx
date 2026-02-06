'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MailCheck, RefreshCw, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

export default function VerifyEmailPage() {
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleResend() {
    setResending(true)
    setError(null)
    setResent(false)

    try {
      const supabase = createClient()

      // Get the user's email from the current session (if available)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user?.email) {
        setError('Unable to determine your email address. Please try signing up again.')
        return
      }

      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      })

      if (resendError) {
        setError(resendError.message)
      } else {
        setResent(true)
      }
    } catch {
      setError('Failed to resend verification email. Please try again.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="text-center">
      {/* Icon */}
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100">
        <MailCheck className="h-7 w-7 text-indigo-600" />
      </div>

      <h2 className="text-xl font-semibold text-gray-900">
        Check your email
      </h2>
      <p className="mt-2 text-sm text-gray-500">
        We&apos;ve sent a verification link to your email address. Please click
        the link to verify your account and get started.
      </p>

      <div className="mt-6 space-y-3">
        {/* Resend verification */}
        <Button
          variant="outline"
          className="w-full"
          onClick={handleResend}
          loading={resending}
          disabled={resent}
        >
          <RefreshCw className="h-4 w-4" />
          {resent ? 'Verification email sent!' : 'Resend verification email'}
        </Button>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        {/* Success */}
        {resent && (
          <p className="text-sm text-green-600">
            A new verification email has been sent. Please check your inbox.
          </p>
        )}
      </div>

      <div className="mt-6 border-t border-gray-100 pt-6">
        <p className="text-sm text-gray-500">
          Didn&apos;t receive the email? Check your spam folder or try a
          different email address.
        </p>
      </div>

      <Link href="/login" className="mt-4 block">
        <Button variant="ghost" className="w-full">
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Button>
      </Link>
    </div>
  )
}
