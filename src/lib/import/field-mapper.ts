export interface FieldMapping {
  csvHeader: string
  targetField: string
  confidence: number
}

/**
 * Known aliases for contact fields.
 * Keys are normalised lowercase CSV header names, values are MailForge field keys.
 */
const FIELD_ALIASES: Record<string, string> = {
  // Email
  email: 'email',
  'e-mail': 'email',
  email_address: 'email',
  emailaddress: 'email',
  'email address': 'email',
  courriel: 'email',
  mail: 'email',

  // First name
  first_name: 'first_name',
  firstname: 'first_name',
  'first name': 'first_name',
  first: 'first_name',
  given_name: 'first_name',
  givenname: 'first_name',
  'given name': 'first_name',
  prénom: 'first_name',
  prenom: 'first_name',
  vorname: 'first_name',
  nombre: 'first_name',

  // Last name
  last_name: 'last_name',
  lastname: 'last_name',
  'last name': 'last_name',
  last: 'last_name',
  surname: 'last_name',
  family_name: 'last_name',
  familyname: 'last_name',
  'family name': 'last_name',
  nom: 'last_name',
  nachname: 'last_name',
  apellido: 'last_name',

  // Full name
  name: 'first_name',
  full_name: 'first_name',
  fullname: 'first_name',
  'full name': 'first_name',

  // Phone
  phone: 'phone',
  phone_number: 'phone',
  phonenumber: 'phone',
  'phone number': 'phone',
  telephone: 'phone',
  tel: 'phone',
  mobile: 'phone',
  cell: 'phone',
  téléphone: 'phone',

  // Company
  company: 'company',
  company_name: 'company',
  companyname: 'company',
  'company name': 'company',
  organization: 'company',
  organisation: 'company',
  org: 'company',
  entreprise: 'company',
  firma: 'company',
  empresa: 'company',

  // Job title
  job_title: 'job_title',
  jobtitle: 'job_title',
  'job title': 'job_title',
  title: 'job_title',
  position: 'job_title',
  role: 'job_title',
  fonction: 'job_title',

  // Tags
  tags: 'tags',
  tag: 'tags',
  labels: 'tags',
  label: 'tags',

  // Language
  language: 'language',
  lang: 'language',
  locale: 'language',
  langue: 'language',

  // Timezone
  timezone: 'timezone',
  tz: 'timezone',
  time_zone: 'timezone',
  'time zone': 'timezone',
}

const TARGET_FIELDS = [
  { key: 'email', label: 'Email', required: true },
  { key: 'first_name', label: 'First Name', required: false },
  { key: 'last_name', label: 'Last Name', required: false },
  { key: 'phone', label: 'Phone', required: false },
  { key: 'company', label: 'Company', required: false },
  { key: 'job_title', label: 'Job Title', required: false },
  { key: 'tags', label: 'Tags', required: false },
  { key: 'language', label: 'Language', required: false },
  { key: 'timezone', label: 'Timezone', required: false },
]

/**
 * Normalise a header string for comparison.
 * Lowercases, trims, removes BOM and non-printable characters.
 */
function normalise(header: string): string {
  return header
    .replace(/^\uFEFF/, '') // BOM
    .toLowerCase()
    .trim()
    .replace(/[_\-\s]+/g, '_')
    .replace(/[^a-z0-9_àâäéèêëïîôùûüÿçñ]/g, '')
}

/**
 * Compute a simple string similarity score (0..1) using Dice coefficient.
 */
function similarity(a: string, b: string): number {
  if (a === b) return 1
  if (a.length < 2 || b.length < 2) return 0

  const bigrams = new Map<string, number>()
  for (let i = 0; i < a.length - 1; i++) {
    const bigram = a.substring(i, i + 2)
    bigrams.set(bigram, (bigrams.get(bigram) ?? 0) + 1)
  }

  let intersectionSize = 0
  for (let i = 0; i < b.length - 1; i++) {
    const bigram = b.substring(i, i + 2)
    const count = bigrams.get(bigram) ?? 0
    if (count > 0) {
      bigrams.set(bigram, count - 1)
      intersectionSize++
    }
  }

  return (2.0 * intersectionSize) / (a.length - 1 + (b.length - 1))
}

/**
 * Auto-map CSV headers to contact fields.
 * Returns a mapping array with confidence scores.
 */
export function autoMapFields(headers: string[]): FieldMapping[] {
  const usedFields = new Set<string>()

  return headers.map((csvHeader) => {
    const normalised = normalise(csvHeader)

    // 1. Exact alias match
    if (FIELD_ALIASES[normalised] && !usedFields.has(FIELD_ALIASES[normalised])) {
      const target = FIELD_ALIASES[normalised]
      usedFields.add(target)
      return { csvHeader, targetField: target, confidence: 1 }
    }

    // 2. Try without underscores/spaces
    const collapsed = normalised.replace(/_/g, '')
    for (const [alias, field] of Object.entries(FIELD_ALIASES)) {
      if (alias.replace(/[_\s]/g, '') === collapsed && !usedFields.has(field)) {
        usedFields.add(field)
        return { csvHeader, targetField: field, confidence: 0.9 }
      }
    }

    // 3. Fuzzy match using similarity
    let bestField = ''
    let bestScore = 0

    for (const [alias, field] of Object.entries(FIELD_ALIASES)) {
      if (usedFields.has(field)) continue
      const score = similarity(normalised, alias.replace(/[_\s]/g, ''))
      if (score > bestScore && score > 0.6) {
        bestScore = score
        bestField = field
      }
    }

    if (bestField) {
      usedFields.add(bestField)
      return { csvHeader, targetField: bestField, confidence: bestScore }
    }

    return { csvHeader, targetField: '', confidence: 0 }
  })
}

/**
 * Get available target fields for mapping UI.
 */
export function getTargetFields() {
  return TARGET_FIELDS
}
