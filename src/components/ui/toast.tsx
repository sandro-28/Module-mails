"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type ToastVariant = "default" | "success" | "error" | "warning"

interface Toast {
  id: string
  title?: string
  description?: string
  variant: ToastVariant
  duration?: number
}

interface ToastAction {
  type: "ADD" | "REMOVE"
  toast?: Toast
  id?: string
}

/* -------------------------------------------------------------------------- */
/*  Global state (singleton store)                                            */
/* -------------------------------------------------------------------------- */

type Listener = () => void

let toasts: Toast[] = []
const listeners = new Set<Listener>()

function dispatch(action: ToastAction) {
  switch (action.type) {
    case "ADD":
      if (action.toast) {
        toasts = [action.toast, ...toasts].slice(0, 5)
      }
      break
    case "REMOVE":
      toasts = toasts.filter((t) => t.id !== action.id)
      break
  }
  listeners.forEach((l) => l())
}

function subscribe(listener: Listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return toasts
}

/* -------------------------------------------------------------------------- */
/*  useToast hook                                                             */
/* -------------------------------------------------------------------------- */

let toastCount = 0

export function useToast() {
  const currentToasts = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getSnapshot
  )

  const toast = React.useCallback(
    ({
      title,
      description,
      variant = "default",
      duration = 5000,
    }: {
      title?: string
      description?: string
      variant?: ToastVariant
      duration?: number
    }) => {
      const id = `toast-${++toastCount}`
      dispatch({
        type: "ADD",
        toast: { id, title, description, variant, duration },
      })
      return id
    },
    []
  )

  const dismiss = React.useCallback((id: string) => {
    dispatch({ type: "REMOVE", id })
  }, [])

  return { toasts: currentToasts, toast, dismiss }
}

/* -------------------------------------------------------------------------- */
/*  Variant styles & icons                                                    */
/* -------------------------------------------------------------------------- */

const variantStyles: Record<ToastVariant, string> = {
  default: "border-gray-200 bg-white text-gray-900",
  success: "border-green-200 bg-green-50 text-green-900",
  error: "border-red-200 bg-red-50 text-red-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
}

const variantIcons: Record<ToastVariant, React.ReactNode> = {
  default: <Info className="h-5 w-5 text-gray-500" />,
  success: <CheckCircle2 className="h-5 w-5 text-green-600" />,
  error: <AlertCircle className="h-5 w-5 text-red-600" />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-600" />,
}

/* -------------------------------------------------------------------------- */
/*  Single toast item                                                         */
/* -------------------------------------------------------------------------- */

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  React.useEffect(() => {
    if (!toast.duration) return
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration)
    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onDismiss])

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        "pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg border shadow-lg",
        "animate-in slide-in-from-top-2 fade-in duration-200",
        variantStyles[toast.variant]
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <span className="mt-0.5 shrink-0" aria-hidden="true">
          {variantIcons[toast.variant]}
        </span>
        <div className="flex-1">
          {toast.title && (
            <p className="text-sm font-semibold">{toast.title}</p>
          )}
          {toast.description && (
            <p className="mt-0.5 text-sm opacity-80">{toast.description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="shrink-0 rounded-md p-1 opacity-60 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-label="Close notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Toaster (render all toasts via portal)                                    */
/* -------------------------------------------------------------------------- */

export function Toaster() {
  const { toasts, dismiss } = useToast()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return createPortal(
    <div
      aria-label="Notifications"
      className="pointer-events-none fixed right-0 top-0 z-[100] flex max-h-screen flex-col items-end gap-2 p-4 sm:p-6"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
      ))}
    </div>,
    document.body
  )
}
