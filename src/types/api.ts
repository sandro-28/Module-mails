export interface ApiResponse<T = unknown> {
  data: T | null;
  error: ApiError | null;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

export interface PaginatedApiResponse<T = unknown> {
  data: T[];
  meta: PaginationMeta;
  error: ApiError | null;
}

export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  has_more: boolean;
  cursor?: string;
}

export interface ApiKeyContext {
  organizationId: string;
  keyId: string;
  permissions: string[];
}

export interface WebhookEvent {
  id: string;
  type: string;
  data: Record<string, unknown>;
  created_at: string;
}

export type SortDirection = "asc" | "desc";

export interface SortParams {
  field: string;
  direction: SortDirection;
}

export interface FilterParams {
  field: string;
  operator: string;
  value: string | number | boolean;
}
