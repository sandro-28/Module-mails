"use client"

import { useRouter } from "next/navigation"
import { Send, Users, FileText, Workflow } from "lucide-react"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface QuickAction {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  color: string
  bgColor: string
}

interface QuickActionsProps {
  className?: string
}

// ---------------------------------------------------------------------------
// Actions data
// ---------------------------------------------------------------------------

const QUICK_ACTIONS: QuickAction[] = [
  {
    title: "New Campaign",
    description: "Create and send a new email campaign to your audience.",
    icon: Send,
    href: "/campaigns/new",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
  },
  {
    title: "Import Contacts",
    description: "Upload a CSV or connect an integration to import contacts.",
    icon: Users,
    href: "/contacts/import",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
  {
    title: "Create Template",
    description: "Design a reusable email template with the visual editor.",
    icon: FileText,
    href: "/templates/new",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  {
    title: "New Automation",
    description: "Set up automated email workflows triggered by events.",
    icon: Workflow,
    href: "/automations/new",
    color: "text-violet-600",
    bgColor: "bg-violet-50",
  },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function QuickActions({ className }: QuickActionsProps) {
  const router = useRouter()

  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {QUICK_ACTIONS.map((action) => {
        const Icon = action.icon
        return (
          <button
            key={action.title}
            type="button"
            onClick={() => router.push(action.href)}
            className="group flex flex-col items-start rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-all hover:border-gray-300 hover:shadow-md"
          >
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                action.bgColor,
                "group-hover:scale-105"
              )}
            >
              <Icon className={cn("h-5 w-5", action.color)} />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-gray-900">
              {action.title}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">
              {action.description}
            </p>
          </button>
        )
      })}
    </div>
  )
}
