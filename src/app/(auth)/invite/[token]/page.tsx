'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Users,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  UserPlus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { acceptInvitation, declineInvitation } from '@/app/actions/auth'

interface InvitationInfo {
  organizationName: string
  role: string
  email: string
}

export default function InviteAcceptPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [invitation, setInvitation] = useState<InvitationInfo | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [declining, setDeclining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Registration form state (shown when user is not logged in)
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [registering, setRegistering] = useState(false)

  useEffect(() => {
    async function loadInvitation() {
      try {
        const supabase = createClient()

        // Check if user is logged in
        const {
          data: { user },
        } = await supabase.auth.getUser()
        setIsLoggedIn(!!user)

        // Fetch invitation details (public access via token)
        const { data: rawData, error: fetchError } = await supabase
          .from('invitations')
          .select('email, role, status, organizations(name)')
          .eq('token', token)
          .single()

        if (fetchError || !rawData) {
          setError('This invitation link is invalid or has expired.')
          setPageLoading(false)
          return
        }

        // Cast to work around Supabase typed client inference limitations
        const data = rawData as unknown as {
          email: string
          role: string
          status: string
          organizations: { name: string } | null
        }

        if (data.status !== 'pending') {
          setError(
            data.status === 'accepted'
              ? 'This invitation has already been accepted.'
              : 'This invitation has been declined or expired.'
          )
          setPageLoading(false)
          return
        }

        setInvitation({
          organizationName: data.organizations?.name ?? 'Unknown Organization',
          role: data.role,
          email: data.email,
        })
      } catch {
        setError('Failed to load invitation details.')
      } finally {
        setPageLoading(false)
      }
    }

    loadInvitation()
  }, [token])

  async function handleAccept() {
    setAccepting(true)
    setError(null)

    try {
      const result = await acceptInvitation(token)
      if (result?.error) {
        setError(result.error)
      }
      // On success, the server action redirects to /dashboard
    } catch {
      setError('Failed to accept invitation. Please try again.')
    } finally {
      setAccepting(false)
    }
  }

  async function handleDecline() {
    setDeclining(true)
    setError(null)

    try {
      const result = await declineInvitation(token)
      if (result?.error) {
        setError(result.error)
      }
      // On success, the server action redirects to /login
    } catch {
      setError('Failed to decline invitation. Please try again.')
    } finally {
      setDeclining(false)
    }
  }

  async function handleRegisterAndAccept(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (!invitation) return

    if (!fullName || !password || !confirmPassword) {
      setError('All fields are required.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setRegistering(true)

    try {
      const supabase = createClient()

      // Create the account
      const { error: signUpError } = await supabase.auth.signUp({
        email: invitation.email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      // Sign in immediately
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: invitation.email,
        password,
      })

      if (signInError) {
        setError('Account created. Please verify your email, then sign in to accept the invitation.')
        return
      }

      // Accept the invitation
      const result = await acceptInvitation(token)
      if (result?.error) {
        setError(result.error)
      }
      // On success, the server action redirects to /dashboard
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setRegistering(false)
    }
  }

  function formatRole(role: string): string {
    return role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')
  }

  /* ---------------------------------------------------------------------- */
  /*  Loading state                                                          */
  /* ---------------------------------------------------------------------- */

  if (pageLoading) {
    return (
      <div className="flex flex-col items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="mt-3 text-sm text-gray-500">Loading invitation...</p>
      </div>
    )
  }

  /* ---------------------------------------------------------------------- */
  /*  Error state (invalid/expired invitation)                               */
  /* ---------------------------------------------------------------------- */

  if (!invitation) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
          <XCircle className="h-7 w-7 text-red-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">
          Invalid Invitation
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          {error || 'This invitation link is invalid or has expired.'}
        </p>
        <Link href="/login" className="mt-6 block">
          <Button variant="outline" className="w-full">
            Go to sign in
          </Button>
        </Link>
      </div>
    )
  }

  /* ---------------------------------------------------------------------- */
  /*  Invitation details                                                     */
  /* ---------------------------------------------------------------------- */

  return (
    <div>
      {/* Invitation info */}
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100">
          <Users className="h-7 w-7 text-indigo-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">
          You&apos;ve been invited
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          You&apos;ve been invited to join{' '}
          <strong className="text-gray-900">{invitation.organizationName}</strong>{' '}
          as a{' '}
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
              invitation.role === 'admin'
                ? 'bg-purple-100 text-purple-700'
                : invitation.role === 'editor'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700'
            )}
          >
            {formatRole(invitation.role)}
          </span>
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Logged in: show accept/decline buttons */}
      {isLoggedIn ? (
        <div className="space-y-3">
          <Button
            className="w-full"
            onClick={handleAccept}
            loading={accepting}
            disabled={declining}
          >
            <CheckCircle2 className="h-4 w-4" />
            Accept invitation
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleDecline}
            loading={declining}
            disabled={accepting}
          >
            <XCircle className="h-4 w-4" />
            Decline
          </Button>
        </div>
      ) : (
        /* Not logged in: show register form */
        <div>
          <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Create an account to join{' '}
            <strong>{invitation.organizationName}</strong>. Your account will be
            created with the email{' '}
            <strong>{invitation.email}</strong>.
          </div>

          <form onSubmit={handleRegisterAndAccept} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              value={invitation.email}
              disabled
            />

            <Input
              label="Full name"
              type="text"
              name="fullName"
              placeholder="John Doe"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={registering}
            />

            <Input
              label="Password"
              type="password"
              name="password"
              placeholder="At least 8 characters"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={registering}
            />

            <Input
              label="Confirm password"
              type="password"
              name="confirmPassword"
              placeholder="Re-enter your password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={
                confirmPassword.length > 0 && password !== confirmPassword
                  ? 'Passwords do not match.'
                  : undefined
              }
              disabled={registering}
            />

            <Button
              type="submit"
              className="w-full"
              loading={registering}
            >
              <UserPlus className="h-4 w-4" />
              Create account & join
            </Button>
          </form>

          <div className="mt-4 flex items-center justify-between text-sm">
            <Link
              href={`/login?redirect=/invite/${token}`}
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Already have an account? Sign in
            </Link>
            <button
              type="button"
              onClick={handleDecline}
              className="text-gray-400 hover:text-gray-600"
              disabled={declining}
            >
              Decline
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
