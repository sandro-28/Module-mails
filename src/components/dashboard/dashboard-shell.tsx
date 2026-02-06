"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import {
  OrganizationProvider,
  type Organization,
  type Membership,
  type OrganizationUser,
} from "@/hooks/use-organization"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DashboardShellProps {
  children: React.ReactNode
  organization: Organization | null
  membership: Membership | null
  user: OrganizationUser | null
}

const STORAGE_KEY = "mailforge-sidebar-collapsed"

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DashboardShell({
  children,
  organization,
  membership,
  user,
}: DashboardShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === "true") setSidebarCollapsed(true)
    } catch {
      // localStorage unavailable
    }

    // Listen for storage changes from the sidebar toggle
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) {
        setSidebarCollapsed(e.newValue === "true")
      }
    }
    window.addEventListener("storage", onStorage)

    // Also observe changes via a polling approach for same-tab updates
    const interval = setInterval(() => {
      try {
        const current = localStorage.getItem(STORAGE_KEY) === "true"
        setSidebarCollapsed((prev) => (prev !== current ? current : prev))
      } catch {
        // noop
      }
    }, 300)

    return () => {
      window.removeEventListener("storage", onStorage)
      clearInterval(interval)
    }
  }, [])

  return (
    <OrganizationProvider
      initialOrganization={organization}
      initialMembership={membership}
      initialUser={user}
    >
      <div className="min-h-screen bg-gray-50">
        <Sidebar
          organization={organization}
          user={user}
          role={membership?.role ?? null}
        />

        {/* Main content area, offset by sidebar width */}
        <div
          className={cn(
            "flex min-h-screen flex-col transition-[margin-left] duration-300 ease-in-out",
            sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
          )}
        >
          <Header />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </OrganizationProvider>
  )
}
