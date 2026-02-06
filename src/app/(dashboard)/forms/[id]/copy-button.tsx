'use client'

import { useState } from 'react'

interface CopyEmbedCodeProps {
  embedCode: string
  formId: string
  appUrl: string
}

export function CopyEmbedCode({ embedCode, formId, appUrl }: CopyEmbedCodeProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(embedCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Embed Code
        </h2>
        <button
          onClick={handleCopy}
          className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
        {embedCode}
      </pre>
      <p className="text-xs text-gray-500 mt-2">
        Public URL:{' '}
        <a
          href={`/subscribe/${formId}`}
          className="text-blue-600 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {appUrl}/subscribe/{formId}
        </a>
      </p>
    </div>
  )
}
