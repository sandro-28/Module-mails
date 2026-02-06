"use client"

import * as React from "react"
import { AlertTriangle } from "lucide-react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface ConfirmDialogProps {
  /** Whether the dialog is open */
  open: boolean
  /** Called when the dialog should close (cancel / overlay click / escape) */
  onClose: () => void
  /** Called when the user confirms the action */
  onConfirm: () => void
  /** Dialog title */
  title?: string
  /** Descriptive text */
  description?: string
  /** Text shown on the confirm button */
  confirmText?: string
  /** Text shown on the cancel button */
  cancelText?: string
  /** Visual variant of the confirm button */
  variant?: "default" | "destructive"
  /** Show a loading spinner on the confirm button */
  loading?: boolean
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left">
        {/* Icon */}
        <div
          className={cn(
            "mb-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-full sm:mb-0 sm:mr-4",
            variant === "destructive" ? "bg-red-100" : "bg-indigo-100"
          )}
        >
          <AlertTriangle
            className={cn(
              "h-5 w-5",
              variant === "destructive" ? "text-red-600" : "text-indigo-600"
            )}
            aria-hidden="true"
          />
        </div>

        <div className="flex-1">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          {description && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onClose} disabled={loading}>
          {cancelText}
        </Button>
        <Button
          variant={variant === "destructive" ? "destructive" : "default"}
          onClick={onConfirm}
          loading={loading}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  )
}
