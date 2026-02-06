"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Save,
  Play,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { TriggerSelector } from "@/components/automations/trigger-selector"
import { WorkflowCanvas } from "@/components/automations/workflow-canvas"
import { useAutomationStore } from "@/stores/automation-store"
import { createAutomation, activateAutomation } from "@/app/actions/automations"

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NewAutomationPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)

  const {
    name,
    description,
    triggerType,
    triggerConfig,
    steps,
    setName,
    setDescription,
    setTrigger,
    updateTriggerConfig,
    addStep,
    updateStep,
    removeStep,
    moveStep,
    reset,
  } = useAutomationStore()

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  function handleSaveDraft() {
    if (!name.trim()) {
      showToast("error", "Please enter an automation name.")
      return
    }

    startTransition(async () => {
      const result = await createAutomation({
        name: name.trim(),
        description: description || undefined,
        trigger_type: triggerType,
        trigger_config: triggerConfig,
        steps,
      })

      if (result.success) {
        showToast("success", "Automation saved as draft.")
        reset()
        router.push(`/automations/${result.id}`)
      } else {
        showToast("error", result.error ?? "Failed to save automation.")
      }
    })
  }

  function handleActivate() {
    if (!name.trim()) {
      showToast("error", "Please enter an automation name.")
      return
    }

    if (steps.length === 0) {
      showToast("error", "Add at least one step before activating.")
      return
    }

    startTransition(async () => {
      const result = await createAutomation({
        name: name.trim(),
        description: description || undefined,
        trigger_type: triggerType,
        trigger_config: triggerConfig,
        steps,
      })

      if (result.success && result.id) {
        const activateResult = await activateAutomation(result.id)
        if (activateResult.success) {
          showToast("success", "Automation created and activated.")
          reset()
          router.push(`/automations/${result.id}`)
        } else {
          showToast(
            "error",
            activateResult.error ?? "Saved but failed to activate."
          )
          router.push(`/automations/${result.id}`)
        }
      } else {
        showToast("error", result.error ?? "Failed to save automation.")
      }
    })
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/automations">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              New Automation
            </h1>
            <p className="mt-0.5 text-sm text-gray-500">
              Build a new automated workflow.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSaveDraft} loading={isPending}>
            <Save className="h-4 w-4" />
            Save as Draft
          </Button>
          <Button onClick={handleActivate} loading={isPending}>
            <Play className="h-4 w-4" />
            Activate
          </Button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg border px-4 py-3 text-sm shadow-sm",
            toast.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          )}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          {toast.message}
        </div>
      )}

      {/* Name and description */}
      <Card>
        <CardHeader>
          <CardTitle>Automation Details</CardTitle>
          <CardDescription>
            Give your automation a descriptive name.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Name"
            placeholder="e.g., Welcome Onboarding Series"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Textarea
            label="Description (optional)"
            placeholder="Describe what this automation does..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </CardContent>
      </Card>

      {/* Trigger */}
      <Card>
        <CardHeader>
          <CardTitle>Trigger</CardTitle>
          <CardDescription>
            Choose what starts this automation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TriggerSelector
            value={triggerType}
            config={triggerConfig}
            onChange={(type, config) => {
              setTrigger(type, config)
            }}
          />
        </CardContent>
      </Card>

      {/* Workflow */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow</CardTitle>
          <CardDescription>
            Add steps to build your automation flow. Click the + button to add
            steps between nodes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WorkflowCanvas
            triggerType={triggerType}
            steps={steps}
            onAddStep={addStep}
            onUpdateStep={updateStep}
            onRemoveStep={removeStep}
            onMoveStep={moveStep}
          />
        </CardContent>
      </Card>

      {/* Bottom actions */}
      <div className="flex items-center justify-between border-t border-gray-200 pt-6">
        <Button variant="ghost" asChild>
          <Link href="/automations">Cancel</Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSaveDraft} loading={isPending}>
            <Save className="h-4 w-4" />
            Save as Draft
          </Button>
          <Button onClick={handleActivate} loading={isPending}>
            <Play className="h-4 w-4" />
            Activate
          </Button>
        </div>
      </div>
    </div>
  )
}
