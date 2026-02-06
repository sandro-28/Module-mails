'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import type { SignupFormConfig, SignupFormStyle, SignupFormField } from '@/types/database'

interface FormData {
  id: string
  name: string
  config: SignupFormConfig
  style: SignupFormStyle | null
}

export default function SubscribePage() {
  const { slug } = useParams<{ slug: string }>()
  const [form, setForm] = useState<FormData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'check_email' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [formValues, setFormValues] = useState<Record<string, string>>({})

  useEffect(() => {
    async function loadForm() {
      try {
        const res = await fetch(`/api/public/forms/${slug}`)
        if (!res.ok) throw new Error('Form not found')
        const data = await res.json()
        setForm(data.data)

        // Initialize form values with defaults
        const defaults: Record<string, string> = {}
        for (const field of data.data.config.fields) {
          defaults[field.key] = field.default_value ?? ''
        }
        setFormValues(defaults)
      } catch {
        setErrorMessage('This form is not available.')
      } finally {
        setLoading(false)
      }
    }
    loadForm()
  }, [slug])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form) return

    // Client-side validation
    for (const field of form.config.fields) {
      if (field.required && !formValues[field.key]?.trim()) {
        setErrorMessage(`${field.label} is required.`)
        return
      }
    }

    setSubmitting(true)
    setErrorMessage('')

    try {
      const res = await fetch('/api/public/forms/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form_id: form.id,
          data: formValues,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error?.message ?? 'Submission failed')
      }

      if (result.data?.double_opt_in) {
        setStatus('check_email')
      } else {
        setStatus('success')
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong')
      setStatus('error')
    } finally {
      setSubmitting(false)
    }
  }

  function renderField(field: SignupFormField) {
    const commonProps = {
      id: field.key,
      name: field.key,
      value: formValues[field.key] ?? '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setFormValues((prev) => ({ ...prev, [field.key]: e.target.value })),
      placeholder: field.placeholder ?? '',
      required: field.required,
      className:
        'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
    }

    if (field.type === 'select' && field.options) {
      return (
        <select {...commonProps}>
          <option value="">Select...</option>
          {field.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )
    }

    if (field.type === 'checkbox') {
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formValues[field.key] === 'true'}
            onChange={(e) =>
              setFormValues((prev) => ({
                ...prev,
                [field.key]: e.target.checked ? 'true' : 'false',
              }))
            }
            className="h-4 w-4 rounded border-gray-300 text-blue-600"
          />
          <span className="text-sm text-gray-700">{field.label}</span>
        </label>
      )
    }

    if (field.type === 'hidden') {
      return <input type="hidden" name={field.key} value={formValues[field.key] ?? ''} />
    }

    return <input type={field.type} {...commonProps} />
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-500">Loading form...</div>
      </div>
    )
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Form Not Found</h1>
          <p className="text-gray-600">{errorMessage}</p>
        </div>
      </div>
    )
  }

  const style = form.style
  const bgColor = style?.background_color ?? '#ffffff'
  const textColor = style?.text_color ?? '#111827'
  const buttonColor = style?.button_color ?? '#2563eb'
  const buttonTextColor = style?.button_text_color ?? '#ffffff'

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: bgColor }}>
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: textColor }}>
            {form.config.success_message || 'Thank you for subscribing!'}
          </h2>
        </div>
      </div>
    )
  }

  if (status === 'check_email') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: bgColor }}>
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: textColor }}>Check your email</h2>
          <p className="text-gray-600">
            We have sent you a confirmation email. Please click the link to confirm your subscription.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: bgColor }}>
      <div
        className="max-w-md w-full bg-white rounded-lg shadow-sm p-8"
        style={{ borderRadius: style?.border_radius ? `${style.border_radius}px` : undefined }}
      >
        <h1 className="text-2xl font-bold mb-6 text-center" style={{ color: textColor }}>
          {form.name}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {form.config.fields
            .filter((f) => f.type !== 'hidden')
            .map((field) => (
              <div key={field.key}>
                {field.type !== 'checkbox' && (
                  <label htmlFor={field.key} className="block text-sm font-medium mb-1" style={{ color: textColor }}>
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                )}
                {renderField(field)}
              </div>
            ))}

          {/* Hidden fields */}
          {form.config.fields
            .filter((f) => f.type === 'hidden')
            .map((field) => renderField(field))}

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full font-medium py-2.5 px-4 rounded-lg transition-opacity disabled:opacity-50"
            style={{ backgroundColor: buttonColor, color: buttonTextColor }}
          >
            {submitting ? 'Subscribing...' : (form.config.submit_button_text || 'Subscribe')}
          </button>
        </form>
      </div>
    </div>
  )
}
