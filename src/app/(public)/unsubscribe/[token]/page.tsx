'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'

const REASONS = [
  { value: 'too_many', label: 'Too many emails' },
  { value: 'not_relevant', label: 'Content is not relevant to me' },
  { value: 'didnt_sign_up', label: "I didn't sign up for this" },
  { value: 'other', label: 'Other' },
]

export default function UnsubscribePage() {
  const { token } = useParams<{ token: string }>()
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [reason, setReason] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleUnsubscribe() {
    setStatus('loading')
    try {
      const res = await fetch('/api/public/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, reason }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error?.message ?? 'Failed to unsubscribe')
      }

      setStatus('success')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">You have been unsubscribed</h1>
          <p className="text-gray-600">
            You will no longer receive emails from us. If this was a mistake, you can
            re-subscribe through your preference center.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Unsubscribe</h1>
        <p className="text-gray-600 mb-6 text-center">
          We are sorry to see you go. Please confirm that you would like to unsubscribe
          from our mailing list.
        </p>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            May we ask why? (optional)
          </label>
          <div className="space-y-2">
            {REASONS.map((r) => (
              <label key={r.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="reason"
                  value={r.value}
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                  className="h-4 w-4 text-blue-600 border-gray-300"
                />
                <span className="text-sm text-gray-700">{r.label}</span>
              </label>
            ))}
          </div>
        </div>

        {status === 'error' && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <button
          onClick={handleUnsubscribe}
          disabled={status === 'loading'}
          className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
        >
          {status === 'loading' ? 'Processing...' : 'Unsubscribe'}
        </button>

        <p className="mt-4 text-xs text-gray-500 text-center">
          You can also{' '}
          <a href={`/preferences/${token}`} className="text-blue-600 hover:underline">
            manage your email preferences
          </a>{' '}
          instead.
        </p>
      </div>
    </div>
  )
}
