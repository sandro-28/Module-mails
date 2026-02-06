export type ContactStatus = "active" | "unsubscribed" | "bounced" | "complained" | "cleaned" | "pending";

export type ConsentSource = "form" | "import" | "api" | "manual";

export interface ContactFilters {
  search?: string;
  status?: ContactStatus;
  listId?: string;
  tags?: string[];
  engagementMin?: number;
  engagementMax?: number;
  source?: string;
  dateFrom?: string;
  dateTo?: string;
  sortField?: string;
  sortDirection?: "asc" | "desc";
  page?: number;
  perPage?: number;
}

export interface ImportOptions {
  targetListIds: string[];
  tagsToAdd: string[];
  updateBehavior: "update" | "skip" | "create_duplicate";
  consentSource: ConsentSource;
  consentGiven: boolean;
}

export interface ImportMapping {
  csvColumn: string;
  contactField: string | null;
}

export interface ImportResult {
  total: number;
  imported: number;
  updated: number;
  skipped: number;
  errors: ImportError[];
}

export interface ImportError {
  row: number;
  email: string;
  reason: string;
}

export const CONTACT_STATUS_COLORS: Record<ContactStatus, string> = {
  active: "bg-green-100 text-green-700",
  unsubscribed: "bg-gray-100 text-gray-700",
  bounced: "bg-red-100 text-red-700",
  complained: "bg-red-100 text-red-700",
  cleaned: "bg-gray-100 text-gray-600",
  pending: "bg-yellow-100 text-yellow-700",
};

export const CONTACT_STATUS_LABELS: Record<ContactStatus, string> = {
  active: "Active",
  unsubscribed: "Unsubscribed",
  bounced: "Bounced",
  complained: "Complained",
  cleaned: "Cleaned",
  pending: "Pending",
};

export const CONTACT_FIELDS_MAP: Record<string, string> = {
  email: "Email",
  "e-mail": "Email",
  "adresse email": "Email",
  "first_name": "First Name",
  "firstname": "First Name",
  "first name": "First Name",
  "prénom": "First Name",
  "prenom": "First Name",
  "last_name": "Last Name",
  "lastname": "Last Name",
  "last name": "Last Name",
  "nom": "Last Name",
  "nom de famille": "Last Name",
  "phone": "Phone",
  "téléphone": "Phone",
  "telephone": "Phone",
  "tel": "Phone",
  "company": "Company",
  "entreprise": "Company",
  "société": "Company",
  "societe": "Company",
  "job_title": "Job Title",
  "titre": "Job Title",
  "poste": "Job Title",
  "city": "City",
  "ville": "City",
  "country": "Country",
  "pays": "Country",
  "postal_code": "Postal Code",
  "code postal": "Postal Code",
  "zip": "Postal Code",
};
