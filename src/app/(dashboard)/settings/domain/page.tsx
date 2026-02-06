"use client"

import { useState, useTransition, useEffect } from "react"
import {
  Globe,
  ShieldCheck,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  Copy,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { verifyDomain } from "@/app/actions/settings"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RecordStatus = "verified" | "pending" | "missing"

interface DnsRecord {
  type: string
  name: string
  value: string
  status: RecordStatus
}

// ---------------------------------------------------------------------------
// Status icon helper
// ---------------------------------------------------------------------------

function StatusIcon({ status }: { status: RecordStatus }) {
  switch (status) {
    case "verified":
      return <CheckCircle2 className="h-4 w-4 text-green-600" />
    case "pending":
      return <Clock className="h-4 w-4 text-amber-500" />
    case "missing":
      return <XCircle className="h-4 w-4 text-red-500" />
  }
}

function StatusBadge({ status }: { status: RecordStatus }) {
  const map: Record<RecordStatus, { label: string; variant: "success" | "warning" | "destructive" }> = {
    verified: { label: "Verified", variant: "success" },
    pending: { label: "Pending", variant: "warning" },
    missing: { label: "Missing", variant: "destructive" },
  }
  const s = map[status]
  return <Badge variant={s.variant}>{s.label}</Badge>
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DomainSettingsPage() {
  const [isPending, startTransition] = useTransition()
  const [domain, setDomain] = useState("")
  const [records, setRecords] = useState<DnsRecord[]>([])
  const [verificationDone, setVerificationDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  function handleVerify() {
    if (!domain.trim()) {
      setError("Please enter a domain.")
      return
    }
    setError(null)

    startTransition(async () => {
      const result = await verifyDomain(domain.trim())
      if (!result.success) {
        setError(result.error ?? "Verification failed")
        return
      }
      if (result.records) {
        const recs: DnsRecord[] = [
          { type: result.records.dkim.type, name: result.records.dkim.name, value: result.records.dkim.value, status: result.records.dkim.status },
          { type: result.records.spf.type, name: result.records.spf.name, value: result.records.spf.value, status: result.records.spf.status },
          { type: result.records.dmarc.type, name: result.records.dmarc.name, value: result.records.dmarc.value, status: result.records.dmarc.status },
          { type: result.records.returnPath.type, name: result.records.returnPath.name, value: result.records.returnPath.value, status: result.records.returnPath.status },
        ]
        setRecords(recs)
        setVerificationDone(true)
      }
    })
  }

  function copyToClipboard(text: string, idx: number) {
    navigator.clipboard.writeText(text)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  const verifiedCount = records.filter((r) => r.status === "verified").length

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Domain Settings
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure your sending domain and verify DNS records for optimal deliverability.
        </p>
      </div>

      {/* Domain input */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-gray-400" />
            <CardTitle>Sending Domain</CardTitle>
          </div>
          <CardDescription>
            Enter the domain you want to send emails from. We will provide DNS records for you to add.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="example.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                error={error ?? undefined}
              />
            </div>
            <Button onClick={handleVerify} loading={isPending}>
              <ShieldCheck className="h-4 w-4" />
              Verify Domain
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* DNS records */}
      {verificationDone && records.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>DNS Records</CardTitle>
                <CardDescription className="mt-1">
                  Add the following records to your DNS configuration.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {/* Progress */}
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <span className="font-medium text-gray-900">
                    {verifiedCount}
                  </span>
                  <span>/ {records.length} verified</span>
                </div>
                <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-green-500 transition-all"
                    style={{
                      width: `${(verifiedCount / records.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {records.map((record, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-gray-200 bg-gray-50 p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{record.type}</Badge>
                      <span className="text-sm font-medium text-gray-700">
                        {idx === 0
                          ? "DKIM"
                          : idx === 1
                            ? "SPF"
                            : idx === 2
                              ? "DMARC"
                              : "Return-Path"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusIcon status={record.status} />
                      <StatusBadge status={record.status} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-medium uppercase text-gray-400">
                        Name
                      </p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <code className="flex-1 rounded bg-white px-2 py-1 text-xs text-gray-800 border border-gray-200">
                          {record.name}
                        </code>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(record.name, idx * 2)}
                          className="rounded p-1 text-gray-400 hover:text-gray-600"
                          title="Copy"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          {copiedIdx === idx * 2 && (
                            <span className="sr-only">Copied</span>
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase text-gray-400">
                        Value
                      </p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <code className="flex-1 break-all rounded bg-white px-2 py-1 text-xs text-gray-800 border border-gray-200">
                          {record.value}
                        </code>
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(record.value, idx * 2 + 1)
                          }
                          className="rounded p-1 text-gray-400 hover:text-gray-600"
                          title="Copy"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-3">
              <Button variant="outline" onClick={handleVerify} loading={isPending}>
                <RefreshCw className="h-4 w-4" />
                Re-check Records
              </Button>
              <p className="text-xs text-gray-500">
                DNS changes can take up to 48 hours to propagate.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {isPending && !verificationDone && (
        <Card>
          <CardContent className="space-y-4 py-6">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
