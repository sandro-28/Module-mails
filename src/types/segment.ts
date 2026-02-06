export type MatchType = "all" | "any";

export type FieldType = "text" | "number" | "date" | "select" | "tags" | "boolean";

export type Operator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "starts_with"
  | "ends_with"
  | "greater_than"
  | "less_than"
  | "between"
  | "is_set"
  | "is_not_set"
  | "within_last"
  | "not_within_last"
  | "before_date"
  | "after_date"
  | "in_list"
  | "not_in_list";

export type TimeUnit = "days" | "hours" | "weeks" | "months";

export interface SegmentRule {
  id: string;
  field: string;
  operator: Operator;
  value: string | number | boolean | string[];
  unit?: TimeUnit;
}

export interface SegmentGroup {
  id: string;
  match: MatchType;
  rules: (SegmentRule | SegmentGroup)[];
}

export interface SegmentConditions {
  match: MatchType;
  rules: (SegmentRule | SegmentGroup)[];
}

export interface SegmentField {
  key: string;
  label: string;
  type: FieldType;
  operators: Operator[];
  options?: { value: string; label: string }[];
}

export const SEGMENT_FIELDS: SegmentField[] = [
  { key: "email", label: "Email", type: "text", operators: ["equals", "not_equals", "contains", "not_contains", "starts_with", "ends_with"] },
  { key: "first_name", label: "First Name", type: "text", operators: ["equals", "not_equals", "contains", "is_set", "is_not_set"] },
  { key: "last_name", label: "Last Name", type: "text", operators: ["equals", "not_equals", "contains", "is_set", "is_not_set"] },
  { key: "status", label: "Status", type: "select", operators: ["equals", "not_equals"], options: [
    { value: "active", label: "Active" },
    { value: "unsubscribed", label: "Unsubscribed" },
    { value: "bounced", label: "Bounced" },
    { value: "complained", label: "Complained" },
    { value: "cleaned", label: "Cleaned" },
    { value: "pending", label: "Pending" },
  ]},
  { key: "engagement_score", label: "Engagement Score", type: "number", operators: ["equals", "greater_than", "less_than", "between"] },
  { key: "city", label: "City", type: "text", operators: ["equals", "not_equals", "contains", "is_set", "is_not_set"] },
  { key: "country", label: "Country", type: "text", operators: ["equals", "not_equals", "is_set", "is_not_set"] },
  { key: "source", label: "Source", type: "select", operators: ["equals", "not_equals"], options: [
    { value: "website_form", label: "Website Form" },
    { value: "import_csv", label: "CSV Import" },
    { value: "api", label: "API" },
    { value: "manual", label: "Manual" },
    { value: "integration", label: "Integration" },
  ]},
  { key: "tags", label: "Tags", type: "tags", operators: ["contains", "not_contains"] },
  { key: "created_at", label: "Created Date", type: "date", operators: ["before_date", "after_date", "within_last", "not_within_last"] },
  { key: "last_email_opened_at", label: "Last Email Opened", type: "date", operators: ["before_date", "after_date", "within_last", "not_within_last", "is_set", "is_not_set"] },
  { key: "last_email_clicked_at", label: "Last Email Clicked", type: "date", operators: ["before_date", "after_date", "within_last", "not_within_last", "is_set", "is_not_set"] },
  { key: "last_activity_at", label: "Last Activity", type: "date", operators: ["before_date", "after_date", "within_last", "not_within_last", "is_set", "is_not_set"] },
  { key: "total_emails_sent", label: "Total Emails Sent", type: "number", operators: ["equals", "greater_than", "less_than", "between"] },
  { key: "total_emails_opened", label: "Total Emails Opened", type: "number", operators: ["equals", "greater_than", "less_than", "between"] },
];
