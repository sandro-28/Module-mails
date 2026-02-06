"use client";

import { useState } from "react";
import { Download, FileText, FileJson, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ExportFormat = "csv" | "json";

export default function ExportContactsPage() {
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [isExporting, setIsExporting] = useState(false);
  const [includeFields, setIncludeFields] = useState({
    email: true,
    first_name: true,
    last_name: true,
    phone: true,
    company: true,
    status: true,
    tags: true,
    engagement_score: true,
    custom_fields: true,
    consent_info: true,
    activity_stats: true,
  });

  const handleExport = async () => {
    setIsExporting(true);
    // Export logic would call a server action
    // For now, simulate a delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsExporting(false);
  };

  const fields = [
    { key: "email", label: "Email" },
    { key: "first_name", label: "First Name" },
    { key: "last_name", label: "Last Name" },
    { key: "phone", label: "Phone" },
    { key: "company", label: "Company" },
    { key: "status", label: "Status" },
    { key: "tags", label: "Tags" },
    { key: "engagement_score", label: "Engagement Score" },
    { key: "custom_fields", label: "Custom Fields" },
    { key: "consent_info", label: "GDPR Consent Info" },
    { key: "activity_stats", label: "Activity Statistics" },
  ] as const;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Export Contacts</h1>
        <p className="mt-1 text-sm text-gray-500">
          Export your contacts data in CSV or JSON format. This export is
          GDPR-compliant and includes consent information.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Export Format
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setFormat("csv")}
              className={cn(
                "flex items-center gap-3 p-4 rounded-lg border-2 transition-colors",
                format === "csv"
                  ? "border-indigo-600 bg-indigo-50"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <FileText
                className={cn(
                  "h-6 w-6",
                  format === "csv" ? "text-indigo-600" : "text-gray-400"
                )}
              />
              <div className="text-left">
                <p className="font-medium text-gray-900">CSV</p>
                <p className="text-xs text-gray-500">
                  Compatible with Excel, Google Sheets
                </p>
              </div>
            </button>
            <button
              onClick={() => setFormat("json")}
              className={cn(
                "flex items-center gap-3 p-4 rounded-lg border-2 transition-colors",
                format === "json"
                  ? "border-indigo-600 bg-indigo-50"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <FileJson
                className={cn(
                  "h-6 w-6",
                  format === "json" ? "text-indigo-600" : "text-gray-400"
                )}
              />
              <div className="text-left">
                <p className="font-medium text-gray-900">JSON</p>
                <p className="text-xs text-gray-500">
                  Structured data, GDPR portable
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Fields Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Fields to Include
          </label>
          <div className="space-y-2">
            {fields.map((field) => (
              <label
                key={field.key}
                className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={
                    includeFields[field.key as keyof typeof includeFields]
                  }
                  onChange={(e) =>
                    setIncludeFields((prev) => ({
                      ...prev,
                      [field.key]: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">{field.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isExporting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-5 w-5" />
              Export Contacts
            </>
          )}
        </button>
      </div>
    </div>
  );
}
