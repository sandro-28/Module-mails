'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { SignupFormField, SignupFormType } from '@/types/database'
import { createForm } from '@/app/actions/forms'

const FORM_TYPES: { value: SignupFormType; label: string; description: string }[] = [
  { value: 'embedded', label: 'Embedded', description: 'Embed directly in your website' },
  { value: 'popup', label: 'Popup', description: 'Show as a modal overlay' },
  { value: 'landing', label: 'Landing Page', description: 'Standalone hosted page' },
]

const DEFAULT_FIELDS: SignupFormField[] = [
  {
    key: 'email',
    label: 'Email',
    type: 'email',
    placeholder: 'Enter your email',
    required: true,
    options: null,
    default_value: null,
    custom_field_id: null,
  },
]

const AVAILABLE_FIELD_TYPES = [
  { key: 'first_name', label: 'First Name', type: 'text' as const },
  { key: 'last_name', label: 'Last Name', type: 'text' as const },
  { key: 'phone', label: 'Phone', type: 'text' as const },
  { key: 'company', label: 'Company', type: 'text' as const },
]

export default function NewFormPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form settings
  const [name, setName] = useState('')
  const [formType, setFormType] = useState<SignupFormType>('embedded')
  const [fields, setFields] = useState<SignupFormField[]>(DEFAULT_FIELDS)
  const [submitButtonText, setSubmitButtonText] = useState('Subscribe')
  const [successMessage, setSuccessMessage] = useState('Thank you for subscribing!')
  const [doubleOptIn, setDoubleOptIn] = useState(false)
  const [tags, setTags] = useState('')

  // Style settings
  const [bgColor, setBgColor] = useState('#ffffff')
  const [textColor, setTextColor] = useState('#111827')
  const [buttonColor, setButtonColor] = useState('#2563eb')
  const [buttonTextColor, setButtonTextColor] = useState('#ffffff')

  const addField = useCallback((fieldType: typeof AVAILABLE_FIELD_TYPES[number]) => {
    if (fields.some((f) => f.key === fieldType.key)) return
    setFields((prev) => [
      ...prev,
      {
        key: fieldType.key,
        label: fieldType.label,
        type: fieldType.type,
        placeholder: `Enter your ${fieldType.label.toLowerCase()}`,
        required: false,
        options: null,
        default_value: null,
        custom_field_id: null,
      },
    ])
  }, [fields])

  const removeField = useCallback((key: string) => {
    if (key === 'email') return // Email is always required
    setFields((prev) => prev.filter((f) => f.key !== key))
  }, [])

  const toggleRequired = useCallback((key: string) => {
    if (key === 'email') return
    setFields((prev) =>
      prev.map((f) => (f.key === key ? { ...f, required: !f.required } : f)),
    )
  }, [])

  const moveField = useCallback((index: number, direction: 'up' | 'down') => {
    setFields((prev) => {
      const next = [...prev]
      const target = direction === 'up' ? index - 1 : index + 1
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }, [])

  async function handleSave() {
    if (!name.trim()) {
      setError('Form name is required.')
      return
    }
    setSaving(true)
    setError('')

    try {
      const result = await createForm({
        name: name.trim(),
        type: formType,
        config: {
          fields,
          submit_button_text: submitButtonText,
          success_message: successMessage,
          redirect_url: null,
          double_opt_in: doubleOptIn,
          confirmation_email_template_id: null,
          recaptcha_enabled: false,
          recaptcha_site_key: null,
          honeypot_enabled: true,
          tags_to_apply: tags.split(',').map((t) => t.trim()).filter(Boolean),
          lists_to_add: [],
        },
        style: {
          theme: 'custom',
          background_color: bgColor,
          text_color: textColor,
          button_color: buttonColor,
          button_text_color: buttonTextColor,
          border_radius: 8,
          font_family: 'Inter, sans-serif',
          width: '100%',
          padding: '2rem',
          custom_css: null,
        },
      })

      if (result.error) {
        setError(result.error)
      } else {
        router.push(`/forms/${result.id}`)
      }
    } catch {
      setError('Failed to create form.')
    } finally {
      setSaving(false)
    }
  }

  const embedCode = `<div id="mf-form-${name ? name.toLowerCase().replace(/\s+/g, '-') : 'form'}"></div>
<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/embed/form.js" data-form-id="FORM_ID"></script>`

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Form</h1>
          <p className="text-sm text-gray-500 mt-1">Build a signup form to collect subscribers.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {saving ? 'Saving...' : 'Save Form'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Builder panel */}
        <div className="space-y-6">
          {/* Basic settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
              Basic Settings
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Form Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Newsletter Signup"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Form Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {FORM_TYPES.map((ft) => (
                    <button
                      key={ft.value}
                      type="button"
                      onClick={() => setFormType(ft.value)}
                      className={`p-3 border rounded-lg text-left transition-colors ${
                        formType === ft.value
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-sm font-medium text-gray-900">{ft.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{ft.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Fields */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
              Fields
            </h2>
            <div className="space-y-2 mb-4">
              {fields.map((field, index) => (
                <div
                  key={field.key}
                  className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => moveField(index, 'up')}
                      disabled={index === 0}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => moveField(index, 'down')}
                      disabled={index === fields.length - 1}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs"
                    >
                      ▼
                    </button>
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-800">{field.label}</span>
                    <span className="text-xs text-gray-500 ml-2">({field.type})</span>
                  </div>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={() => toggleRequired(field.key)}
                      disabled={field.key === 'email'}
                      className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-xs text-gray-500">Required</span>
                  </label>
                  {field.key !== 'email' && (
                    <button
                      onClick={() => removeField(field.key)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_FIELD_TYPES.filter((ft) => !fields.some((f) => f.key === ft.key)).map(
                (ft) => (
                  <button
                    key={ft.key}
                    onClick={() => addField(ft)}
                    className="text-xs px-3 py-1.5 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
                  >
                    + {ft.label}
                  </button>
                ),
              )}
            </div>
          </div>

          {/* Style */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
              Style
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Background</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="h-8 w-8 rounded cursor-pointer" />
                  <input type="text" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Text Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="h-8 w-8 rounded cursor-pointer" />
                  <input type="text" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Button Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={buttonColor} onChange={(e) => setButtonColor(e.target.value)} className="h-8 w-8 rounded cursor-pointer" />
                  <input type="text" value={buttonColor} onChange={(e) => setButtonColor(e.target.value)} className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Button Text</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={buttonTextColor} onChange={(e) => setButtonTextColor(e.target.value)} className="h-8 w-8 rounded cursor-pointer" />
                  <input type="text" value={buttonTextColor} onChange={(e) => setButtonTextColor(e.target.value)} className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs" />
                </div>
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
              Options
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
                <input
                  type="text"
                  value={submitButtonText}
                  onChange={(e) => setSubmitButtonText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Success Message</label>
                <input
                  type="text"
                  value={successMessage}
                  onChange={(e) => setSuccessMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="newsletter, website"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={doubleOptIn}
                  onChange={(e) => setDoubleOptIn(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm text-gray-700">Enable double opt-in</span>
              </label>
            </div>
          </div>

          {/* Embed code */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
              Embed Code
            </h2>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
              {embedCode}
            </pre>
            <p className="text-xs text-gray-500 mt-2">
              The embed code will be finalized after saving the form.
            </p>
          </div>
        </div>

        {/* Preview panel */}
        <div className="lg:sticky lg:top-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
              Preview
            </h2>
            <div className="rounded-lg p-6" style={{ backgroundColor: bgColor }}>
              <h3 className="text-lg font-bold mb-4" style={{ color: textColor }}>
                {name || 'Your Form'}
              </h3>
              <div className="space-y-3">
                {fields
                  .filter((f) => f.type !== 'hidden')
                  .map((field) => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium mb-1" style={{ color: textColor }}>
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <input
                        type={field.type}
                        placeholder={field.placeholder ?? ''}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                      />
                    </div>
                  ))}
                <button
                  type="button"
                  disabled
                  className="w-full font-medium py-2.5 px-4 rounded-lg text-sm"
                  style={{ backgroundColor: buttonColor, color: buttonTextColor }}
                >
                  {submitButtonText || 'Subscribe'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
