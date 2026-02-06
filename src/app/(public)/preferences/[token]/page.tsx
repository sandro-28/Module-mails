'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

interface ListSubscription {
  list_id: string
  list_name: string
  subscribed: boolean
}

interface ProfileData {
  first_name: string
  last_name: string
  email: string
  lists: ListSubscription[]
}

export default function PreferencesPage() {
  const { token } = useParams<{ token: string }>()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadPreferences() {
      try {
        const res = await fetch(`/api/public/preferences?token=${token}`)
        if (!res.ok) throw new Error('Failed to load preferences')
        const data = await res.json()
        setProfile(data.data)
      } catch {
        setError('Unable to load your preferences. The link may be invalid or expired.')
      } finally {
        setLoading(false)
      }
    }
    loadPreferences()
  }, [token])

  function toggleList(listId: string) {
    if (!profile) return
    setProfile({
      ...profile,
      lists: profile.lists.map((l) =>
        l.list_id === listId ? { ...l, subscribed: !l.subscribed } : l,
      ),
    })
  }

  async function handleSave() {
    if (!profile) return
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch('/api/public/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          first_name: profile.first_name,
          last_name: profile.last_name,
          lists: profile.lists.map((l) => ({
            list_id: l.list_id,
            subscribed: l.subscribed,
          })),
        }),
      })
      if (!res.ok) throw new Error('Failed to save preferences')
      setSaved(true)
    } catch {
      setError('Failed to save preferences. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-500">Loading preferences...</div>
      </div>
    )
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-lg w-full bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Email Preferences</h1>
        <p className="text-gray-600 mb-6">Manage your subscriptions and profile information.</p>

        {/* Profile info */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Profile
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Email</label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">First Name</label>
                <input
                  type="text"
                  value={profile.first_name}
                  onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Last Name</label>
                <input
                  type="text"
                  value={profile.last_name}
                  onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* List subscriptions */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Mailing Lists
          </h2>
          {profile.lists.length === 0 ? (
            <p className="text-sm text-gray-500">No mailing lists found.</p>
          ) : (
            <div className="space-y-2">
              {profile.lists.map((list) => (
                <label
                  key={list.list_id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <span className="text-sm text-gray-800">{list.list_name}</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={list.subscribed}
                    onClick={() => toggleList(list.list_id)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                      list.subscribed ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
                        list.subscribed ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </label>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {error}
          </div>
        )}
        {saved && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
            Your preferences have been saved.
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>

        <div className="mt-6 pt-4 border-t border-gray-200 text-center">
          <a
            href={`/unsubscribe/${token}`}
            className="text-sm text-red-600 hover:underline"
          >
            Unsubscribe from all emails
          </a>
        </div>
      </div>
    </div>
  )
}
