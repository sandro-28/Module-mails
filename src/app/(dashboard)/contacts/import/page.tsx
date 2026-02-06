'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { parseCSV } from '@/lib/import/csv-parser'
import { autoMapFields, type FieldMapping } from '@/lib/import/field-mapper'
import { processImport } from '@/app/actions/import'

type Step = 1 | 2 | 3 | 4

interface ParsedData {
  headers: string[]
  rows: Record<string, string>[]
}

const CONTACT_FIELDS = [
  { key: '', label: '-- Skip this column --' },
  { key: 'email', label: 'Email' },
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'company', label: 'Company' },
  { key: 'job_title', label: 'Job Title' },
  { key: 'tags', label: 'Tags' },
  { key: 'language', label: 'Language' },
  { key: 'timezone', label: 'Timezone' },
]

export default function ImportPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)
  const [mappings, setMappings] = useState<FieldMapping[]>([])
  const [pasteData, setPasteData] = useState('')

  // Step 3 options
  const [targetList, setTargetList] = useState('')
  const [importTags, setImportTags] = useState('')
  const [updateBehavior, setUpdateBehavior] = useState<'update' | 'skip'>('update')
  const [consentSource, setConsentSource] = useState('')

  // Step 4 / results
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<{
    imported: number
    updated: number
    skipped: number
    errors: number
    errorRows: { row: number; email: string; reason: string }[]
  } | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    const text = await file.text()
    const { headers, rows } = parseCSV(text)
    setParsedData({ headers, rows })

    // Auto-map fields
    const suggested = autoMapFields(headers)
    setMappings(suggested)
    setStep(2)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
  })

  function handlePaste() {
    if (!pasteData.trim()) return
    const { headers, rows } = parseCSV(pasteData)
    setParsedData({ headers, rows })
    const suggested = autoMapFields(headers)
    setMappings(suggested)
    setStep(2)
  }

  function updateMapping(csvHeader: string, targetField: string) {
    setMappings((prev) =>
      prev.map((m) =>
        m.csvHeader === csvHeader ? { ...m, targetField } : m,
      ),
    )
  }

  function getPreviewRows() {
    if (!parsedData) return []
    return parsedData.rows.slice(0, 10)
  }

  function getStats() {
    if (!parsedData) return { total: 0, invalidEmails: 0, duplicates: 0 }
    const emailMapping = mappings.find((m) => m.targetField === 'email')
    if (!emailMapping) return { total: parsedData.rows.length, invalidEmails: 0, duplicates: 0 }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const emails = new Set<string>()
    let invalidEmails = 0
    let duplicates = 0

    for (const row of parsedData.rows) {
      const email = row[emailMapping.csvHeader]?.trim().toLowerCase()
      if (!email || !emailRegex.test(email)) {
        invalidEmails++
      } else if (emails.has(email)) {
        duplicates++
      } else {
        emails.add(email)
      }
    }

    return { total: parsedData.rows.length, invalidEmails, duplicates }
  }

  async function handleImport() {
    if (!parsedData) return
    setImporting(true)
    setProgress(0)

    // Simulate progress
    const interval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 10, 90))
    }, 500)

    try {
      const result = await processImport({
        rows: parsedData.rows,
        mappings,
        targetListId: targetList || undefined,
        tags: importTags.split(',').map((t) => t.trim()).filter(Boolean),
        updateBehavior,
        consentSource: consentSource || 'import',
      })

      clearInterval(interval)
      setProgress(100)
      setResults(result)
    } catch {
      clearInterval(interval)
      setResults({
        imported: 0,
        updated: 0,
        skipped: 0,
        errors: 1,
        errorRows: [{ row: 0, email: '', reason: 'Import failed. Please try again.' }],
      })
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Import Contacts</h1>
        <p className="text-sm text-gray-500 mt-1">Upload a CSV file or paste data to import contacts.</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                s === step
                  ? 'bg-blue-600 text-white'
                  : s < step
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-400'
              }`}
            >
              {s < step ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                s
              )}
            </div>
            <span
              className={`text-sm ${s === step ? 'text-gray-900 font-medium' : 'text-gray-500'}`}
            >
              {s === 1 ? 'Upload' : s === 2 ? 'Map Columns' : s === 3 ? 'Options' : 'Review'}
            </span>
            {s < 4 && <div className="w-12 h-px bg-gray-200" />}
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <div className="space-y-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm text-gray-600 mb-1">
              {isDragActive ? 'Drop your file here' : 'Drag and drop a CSV or XLSX file here'}
            </p>
            <p className="text-xs text-gray-400">or click to browse</p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-sm text-gray-500">or paste your data</span>
            </div>
          </div>

          <div>
            <textarea
              value={pasteData}
              onChange={(e) => setPasteData(e.target.value)}
              placeholder="email,first_name,last_name&#10;john@example.com,John,Doe&#10;jane@example.com,Jane,Smith"
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handlePaste}
              disabled={!pasteData.trim()}
              className="mt-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Parse Data
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Column mapping */}
      {step === 2 && parsedData && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              Map your columns to contact fields
            </h2>
            <div className="space-y-3">
              {mappings.map((mapping) => (
                <div key={mapping.csvHeader} className="flex items-center gap-4">
                  <div className="w-1/3">
                    <span className="text-sm font-medium text-gray-800">
                      {mapping.csvHeader}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      (e.g. {parsedData.rows[0]?.[mapping.csvHeader] ?? '-'})
                    </span>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                  <select
                    value={mapping.targetField}
                    onChange={(e) => updateMapping(mapping.csvHeader, e.target.value)}
                    className="w-1/3 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    {CONTACT_FIELDS.map((f) => (
                      <option key={f.key} value={f.key}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                  {mapping.confidence > 0.5 && (
                    <span className="text-xs text-green-600">Auto-mapped</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {!mappings.some((m) => m.targetField === 'email') && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
              Please map at least the email column to proceed.
            </div>
          )}

          <div className="flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!mappings.some((m) => m.targetField === 'email')}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Options */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Import Options</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Add to List (optional)
                </label>
                <input
                  type="text"
                  value={targetList}
                  onChange={(e) => setTargetList(e.target.value)}
                  placeholder="List ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={importTags}
                  onChange={(e) => setImportTags(e.target.value)}
                  placeholder="imported, newsletter"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  If contact already exists
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="update"
                      checked={updateBehavior === 'update'}
                      onChange={() => setUpdateBehavior('update')}
                      className="h-4 w-4 text-blue-600 border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Update existing contact</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="update"
                      checked={updateBehavior === 'skip'}
                      onChange={() => setUpdateBehavior('skip')}
                      className="h-4 w-4 text-blue-600 border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Skip existing contacts</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Consent Source
                </label>
                <input
                  type="text"
                  value={consentSource}
                  onChange={(e) => setConsentSource(e.target.value)}
                  placeholder="e.g. Website signup, Event registration"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setStep(4)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Review */}
      {step === 4 && parsedData && (
        <div className="space-y-6">
          {!results ? (
            <>
              {/* Summary */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">Import Summary</h2>
                {(() => {
                  const stats = getStats()
                  return (
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                        <div className="text-xs text-gray-500">Total rows</div>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-700">{stats.invalidEmails}</div>
                        <div className="text-xs text-gray-500">Invalid emails</div>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-700">{stats.duplicates}</div>
                        <div className="text-xs text-gray-500">Duplicates</div>
                      </div>
                    </div>
                  )
                })()}

                {/* Preview table */}
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Preview (first 10 rows)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        {mappings
                          .filter((m) => m.targetField)
                          .map((m) => (
                            <th key={m.csvHeader} className="text-left px-3 py-2 text-xs font-medium text-gray-500">
                              {m.targetField}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {getPreviewRows().map((row, i) => (
                        <tr key={i}>
                          {mappings
                            .filter((m) => m.targetField)
                            .map((m) => (
                              <td key={m.csvHeader} className="px-3 py-2 text-gray-700">
                                {row[m.csvHeader] ?? '-'}
                              </td>
                            ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Progress bar */}
              {importing && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Importing...</span>
                    <span className="text-sm text-gray-500">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(3)}
                  disabled={importing}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {importing ? 'Importing...' : 'Start Import'}
                </button>
              </div>
            </>
          ) : (
            /* Results */
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Import Complete</h2>
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">{results.imported}</div>
                  <div className="text-xs text-gray-500">Imported</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-700">{results.updated}</div>
                  <div className="text-xs text-gray-500">Updated</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-700">{results.skipped}</div>
                  <div className="text-xs text-gray-500">Skipped</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-700">{results.errors}</div>
                  <div className="text-xs text-gray-500">Errors</div>
                </div>
              </div>

              {results.errorRows.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Errors</h3>
                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Row</th>
                          <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Email</th>
                          <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {results.errorRows.map((err, i) => (
                          <tr key={i}>
                            <td className="px-3 py-2 text-gray-700">{err.row}</td>
                            <td className="px-3 py-2 text-gray-700">{err.email}</td>
                            <td className="px-3 py-2 text-red-600">{err.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <button
                onClick={() => router.push('/contacts')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Go to Contacts
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
