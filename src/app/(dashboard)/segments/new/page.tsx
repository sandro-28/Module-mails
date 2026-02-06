"use client"

import { useState, useTransition, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Users, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SegmentBuilder } from "@/components/contacts/segment-builder"
import { createSegment, calculateSegmentCount } from "@/app/actions/segments"
import { useOrganization } from "@/hooks/use-organization"
import type { SegmentConditionGroup } from "@/types/database"

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NewSegmentPage() {
  const router = useRouter()
  const { organization } = useOrganization()
  const [isPending, startTransition] = useTransition()

  // Form state
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [conditions, setConditions] = useState<SegmentConditionGroup>({
    operator: "and",
    conditions: [
      { field: "status", operator: "equals", value: "active" },
    ],
  })
  const [error, setError] = useState<string | null>(null)

  // Live count preview
  const [estimatedCount, setEstimatedCount] = useState<number | null>(null)
  const [countLoading, setCountLoading] = useState(false)

  // Debounced count calculation
  const calculateCount = useCallback(async () => {
    if (!organization?.id) return

    // Only calculate if there's at least one condition with a value or valueless operator
    const hasValidCondition = conditions.conditions.some((c) => {
      if ("field" in c) {
        return (
          c.operator === "is_set" ||
          c.operator === "is_not_set" ||
          (c.value !== null && c.value !== "")
        )
      }
      return true
    })

    if (!hasValidCondition) {
      setEstimatedCount(null)
      return
    }

    setCountLoading(true)
    try {
      const result = await calculateSegmentCount(organization.id, conditions)
      if ("count" in result) {
        setEstimatedCount(result.count ?? null)
      }
    } catch {
      // Silently fail for count preview
    } finally {
      setCountLoading(false)
    }
  }, [organization?.id, conditions])

  useEffect(() => {
    const timer = setTimeout(calculateCount, 500)
    return () => clearTimeout(timer)
  }, [calculateCount])

  // Save handler
  function handleSave() {
    if (!name.trim()) {
      setError("Name is required")
      return
    }
    if (!organization?.id) {
      setError("Organization not found")
      return
    }

    setError(null)
    startTransition(async () => {
      const result = await createSegment({
        organization_id: organization.id,
        name: name.trim(),
        description: description.trim() || undefined,
        conditions,
      })

      if (result.error) {
        setError(result.error)
        return
      }

      router.push("/segments")
    })
  }

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <Link
        href="/segments"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Segments
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Create Segment
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Define conditions to dynamically group your contacts.
          </p>
        </div>
        <Button onClick={handleSave} loading={isPending}>
          <Save className="h-4 w-4" />
          Save Segment
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Form fields */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Name"
                placeholder="e.g. Highly Engaged Users"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setError(null)
                }}
              />
              <Textarea
                label="Description"
                placeholder="Optional description for this segment"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              <SegmentBuilder
                value={conditions}
                onChange={setConditions}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Live count preview */}
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-base">Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center rounded-lg bg-gray-50 py-8">
                {countLoading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                ) : (
                  <Users className="h-8 w-8 text-indigo-500" />
                )}
                <div className="mt-3 text-3xl font-bold text-gray-900">
                  {countLoading
                    ? "..."
                    : estimatedCount !== null
                      ? estimatedCount.toLocaleString()
                      : "--"}
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  estimated matching contacts
                </p>
              </div>
              <p className="mt-3 text-center text-xs text-gray-400">
                Count updates automatically as you adjust conditions.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
