"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import type { WizardStep } from "@/stores/campaign-wizard-store"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StepDef {
  step: WizardStep
  label: string
}

const STEPS: StepDef[] = [
  { step: 1, label: "Settings" },
  { step: 2, label: "Content" },
  { step: 3, label: "Recipients" },
  { step: 4, label: "Schedule" },
  { step: 5, label: "Review" },
]

interface CampaignWizardStepsProps {
  currentStep: WizardStep
  onStepClick: (step: WizardStep) => void
  completedSteps?: WizardStep[]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CampaignWizardSteps({
  currentStep,
  onStepClick,
  completedSteps = [],
}: CampaignWizardStepsProps) {
  return (
    <nav aria-label="Campaign creation progress" className="mb-8">
      <ol className="flex items-center justify-between">
        {STEPS.map(({ step, label }, idx) => {
          const isCompleted = completedSteps.includes(step)
          const isCurrent = step === currentStep
          const isClickable = isCompleted || step <= currentStep

          return (
            <li key={step} className="flex flex-1 items-center">
              {/* Connector line (before this step, except for the first) */}
              {idx > 0 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 transition-colors",
                    isCompleted || step <= currentStep
                      ? "bg-indigo-600"
                      : "bg-gray-200"
                  )}
                />
              )}

              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick(step)}
                className={cn(
                  "group flex flex-col items-center gap-1.5",
                  isClickable ? "cursor-pointer" : "cursor-default"
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                {/* Circle indicator */}
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                    isCompleted
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : isCurrent
                        ? "border-indigo-600 bg-white text-indigo-600"
                        : "border-gray-300 bg-white text-gray-400"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    step
                  )}
                </span>

                {/* Label */}
                <span
                  className={cn(
                    "text-xs font-medium transition-colors",
                    isCurrent
                      ? "text-indigo-600"
                      : isCompleted
                        ? "text-gray-900"
                        : "text-gray-400"
                  )}
                >
                  {label}
                </span>
              </button>

              {/* Connector line (after this step, except for the last) */}
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 transition-colors",
                    completedSteps.includes(step) || step < currentStep
                      ? "bg-indigo-600"
                      : "bg-gray-200"
                  )}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
