import Papa from 'papaparse'

export interface ParseResult {
  headers: string[]
  rows: Record<string, string>[]
  totalRows: number
  errors: string[]
}

/**
 * Parse CSV text into headers and rows.
 * Automatically detects separator and handles common encodings.
 */
export function parseCSV(text: string): ParseResult {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim(),
    transform: (value: string) => value.trim(),
  })

  const headers = result.meta.fields ?? []
  const rows = result.data.filter((row) => {
    // Filter out completely empty rows
    return Object.values(row).some((v) => v && v.trim() !== '')
  })

  return {
    headers,
    rows,
    totalRows: rows.length,
    errors: result.errors.map((e) => `Row ${e.row}: ${e.message}`),
  }
}

/**
 * Parse a File object (from file upload) as CSV.
 */
export function parseCSVFile(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      if (!content) {
        reject(new Error('Failed to read file'))
        return
      }
      resolve(parseCSV(content))
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

/**
 * Detect whether the text is likely CSV, TSV, or semicolon-separated.
 */
export function detectSeparator(text: string): string {
  const firstLine = text.split('\n')[0] ?? ''
  const separators = [',', ';', '\t', '|']
  let bestSeparator = ','
  let maxCount = 0

  for (const sep of separators) {
    const count = (firstLine.match(new RegExp(`\\${sep}`, 'g')) ?? []).length
    if (count > maxCount) {
      maxCount = count
      bestSeparator = sep
    }
  }

  return bestSeparator
}

/**
 * Parse CSV text with explicit separator override.
 */
export function parseCSVWithSeparator(text: string, delimiter: string): ParseResult {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    delimiter,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim(),
    transform: (value: string) => value.trim(),
  })

  const headers = result.meta.fields ?? []
  const rows = result.data.filter((row) =>
    Object.values(row).some((v) => v && v.trim() !== ''),
  )

  return {
    headers,
    rows,
    totalRows: rows.length,
    errors: result.errors.map((e) => `Row ${e.row}: ${e.message}`),
  }
}
