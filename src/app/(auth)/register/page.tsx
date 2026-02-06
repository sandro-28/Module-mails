'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { UserPlus, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { signUp } from '@/app/actions/auth'

/* -------------------------------------------------------------------------- */
/*  Password strength helpers                                                 */
/* -------------------------------------------------------------------------- */

interface PasswordStrength {
  score: number // 0-4
  label: string
  color: string
}

function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return { score: 0, label: '', color: 'bg-gray-200' }

  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  // Cap at 4
  score = Math.min(score, 4)

  const levels: Record<number, { label: string; color: string }> = {
    0: { label: '', color: 'bg-gray-200' },
    1: { label: 'Weak', color: 'bg-red-500' },
    2: { label: 'Fair', color: 'bg-orange-500' },
    3: { label: 'Good', color: 'bg-yellow-500' },
    4: { label: 'Strong', color: 'bg-green-500' },
  }

  return { score, ...levels[score] }
}

/* -------------------------------------------------------------------------- */
/*  Page component                                                            */
/* -------------------------------------------------------------------------- */

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password])
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    // Client-side validation
    if (!fullName || !email || !password || !confirmPassword || !organizationName) {
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

    if (!acceptTerms) {
      setError('You must accept the terms of service to continue.')
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.set('fullName', fullName)
      formData.set('email', email)
      formData.set('password', password)
      formData.set('confirmPassword', confirmPassword)
      formData.set('organizationName', organizationName)

      const result = await signUp(formData)

      if (result?.error) {
        setError(result.error)
      }
      // On success, the server action redirects to /verify-email
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-xl font-semibold text-gray-900">
          Create your account
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Get started with MailForge for free.
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full name"
          type="text"
          name="fullName"
          placeholder="John Doe"
          autoComplete="name"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          disabled={loading}
        />

        <Input
          label="Email address"
          type="email"
          name="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />

        <div>
          <Input
            label="Password"
            type="password"
            name="password"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          {/* Password strength indicator */}
          {password.length > 0 && (
            <div className="mt-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={cn(
                      'h-1.5 flex-1 rounded-full transition-colors',
                      level <= passwordStrength.score
                        ? passwordStrength.color
                        : 'bg-gray-200'
                    )}
                  />
                ))}
              </div>
              <p
                className={cn(
                  'mt-1 text-xs',
                  passwordStrength.score <= 1
                    ? 'text-red-600'
                    : passwordStrength.score === 2
                      ? 'text-orange-600'
                      : passwordStrength.score === 3
                        ? 'text-yellow-600'
                        : 'text-green-600'
                )}
              >
                {passwordStrength.label}
              </p>
            </div>
          )}
        </div>

        <div>
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
              confirmPassword.length > 0 && !passwordsMatch
                ? 'Passwords do not match.'
                : undefined
            }
            disabled={loading}
          />
        </div>

        <Input
          label="Organization name"
          type="text"
          name="organizationName"
          placeholder="Acme Inc."
          required
          value={organizationName}
          onChange={(e) => setOrganizationName(e.target.value)}
          helperText="You can always change this later."
          disabled={loading}
        />

        {/* Terms acceptance */}
        <label className="flex items-start gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            className={cn(
              'mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600',
              'focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1'
            )}
          />
          <span>
            I agree to the{' '}
            <Link
              href="/terms"
              className="font-medium text-indigo-600 hover:text-indigo-500"
              target="_blank"
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              href="/privacy"
              className="font-medium text-indigo-600 hover:text-indigo-500"
              target="_blank"
            >
              Privacy Policy
            </Link>
          </span>
        </label>

        <Button
          type="submit"
          className="w-full"
          loading={loading}
          disabled={!acceptTerms}
        >
          <UserPlus className="h-4 w-4" />
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-indigo-600 hover:text-indigo-500"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
