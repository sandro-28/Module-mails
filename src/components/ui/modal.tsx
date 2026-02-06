"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ModalProps {
  /** Whether the modal is open */
  open: boolean
  /** Callback fired when the modal should close */
  onClose: () => void
  /** Title shown in the modal header */
  title?: string
  /** Description shown beneath the title */
  description?: string
  /** Modal body content */
  children: React.ReactNode
  /** Width preset */
  size?: "sm" | "default" | "lg" | "xl" | "full"
}

const sizeClasses: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "max-w-sm",
  default: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-[calc(100vw-2rem)]",
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = "default",
}: ModalProps) {
  const [mounted, setMounted] = React.useState(false)

  // Ensure portal target is available (client-only)
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Close on Escape key
  React.useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, onClose])

  // Lock body scroll when open
  React.useEffect(() => {
    if (!open) return
    const original = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = original
    }
  }, [open])

  if (!mounted || !open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
      aria-describedby={description ? "modal-desc" : undefined}
    >
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          "relative z-10 mx-4 w-full rounded-lg bg-white shadow-xl",
          "animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200",
          sizeClasses[size]
        )}
      >
        {/* Header */}
        {(title || description) && (
          <div className="border-b border-gray-200 px-6 py-4">
            {title && (
              <h2
                id="modal-title"
                className="text-lg font-semibold text-gray-900"
              >
                {title}
              </h2>
            )}
            {description && (
              <p id="modal-desc" className="mt-1 text-sm text-gray-500">
                {description}
              </p>
            )}
          </div>
        )}

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm p-1 text-gray-400 transition-colors hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Body */}
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>,
    document.body
  )
}
