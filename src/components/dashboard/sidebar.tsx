"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  List,
  Filter,
  Send,
  FileText,
  Workflow,
  FormInput,
  BarChart3,
  Settings,
  ScrollText,
  Mail,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  ChevronsUpDown,
  Menu,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getInitials } from "@/lib/utils"
import type { Organization, OrganizationUser, MemberRole, PlanTier } from "@/hooks/use-organization"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

interface NavSection {
  title: string
  items: NavItem[]
}

interface SidebarProps {
  organization: Organization | null
  user: OrganizationUser | null
  role: MemberRole | null
}

// ---------------------------------------------------------------------------
// Navigation structure
// ---------------------------------------------------------------------------

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Main",
    items: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
      { label: "Contacts", href: "/contacts", icon: Users },
      { label: "Lists", href: "/lists", icon: List },
      { label: "Segments", href: "/segments", icon: Filter },
    ],
  },
  {
    title: "Campaigns",
    items: [
      { label: "Campaigns", href: "/campaigns", icon: Send },
      { label: "Templates", href: "/templates", icon: FileText },
      { label: "Automations", href: "/automations", icon: Workflow },
    ],
  },
  {
    title: "Growth",
    items: [
      { label: "Forms", href: "/forms", icon: FormInput },
      { label: "Analytics", href: "/analytics", icon: BarChart3 },
    ],
  },
  {
    title: "Settings",
    items: [
      { label: "Settings", href: "/settings", icon: Settings },
      { label: "Logs", href: "/logs", icon: ScrollText },
    ],
  },
]

const STORAGE_KEY = "mailforge-sidebar-collapsed"

// ---------------------------------------------------------------------------
// Plan badge colours
// ---------------------------------------------------------------------------

const PLAN_COLORS: Record<PlanTier, string> = {
  free: "bg-gray-600 text-gray-200",
  starter: "bg-indigo-700 text-indigo-200",
  growth: "bg-emerald-700 text-emerald-200",
  enterprise: "bg-amber-700 text-amber-200",
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Sidebar({ organization, user, role }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Hydrate collapsed state from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === "true") setCollapsed(true)
    } catch {
      // localStorage unavailable
    }
  }, [])

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, String(next))
      } catch {
        // localStorage unavailable
      }
      return next
    })
  }, [])

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Close user menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  // -------------------------------------------------------------------------
  // Sidebar inner content (shared between desktop & mobile)
  // -------------------------------------------------------------------------

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div
        className={cn(
          "flex h-16 shrink-0 items-center border-b border-gray-800 px-4",
          collapsed ? "justify-center" : "gap-3"
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600">
          <Mail className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight text-white">
            MailForge
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="mb-6">
            {!collapsed && (
              <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                {section.title}
              </p>
            )}
            <ul className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "group flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors",
                        collapsed ? "justify-center" : "gap-3",
                        active
                          ? "bg-indigo-600/20 text-white"
                          : "text-gray-400 hover:bg-gray-800 hover:text-white"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5 shrink-0",
                          active
                            ? "text-indigo-400"
                            : "text-gray-500 group-hover:text-gray-300"
                        )}
                      />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Organization info */}
      {organization && (
        <div
          className={cn(
            "shrink-0 border-t border-gray-800 px-4 py-3",
            collapsed && "flex flex-col items-center px-2"
          )}
        >
          {!collapsed ? (
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">
                  {organization.name}
                </p>
                <span
                  className={cn(
                    "mt-0.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                    PLAN_COLORS[organization.plan] ?? PLAN_COLORS.free
                  )}
                >
                  {organization.plan}
                </span>
              </div>
            </div>
          ) : (
            <span
              className={cn(
                "inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                PLAN_COLORS[organization.plan] ?? PLAN_COLORS.free
              )}
              title={`${organization.name} - ${organization.plan}`}
            >
              {organization.plan.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      )}

      {/* User */}
      <div
        ref={userMenuRef}
        className={cn(
          "relative shrink-0 border-t border-gray-800 px-3 py-3",
          collapsed && "flex justify-center px-2"
        )}
      >
        <button
          type="button"
          onClick={() => setUserMenuOpen((prev) => !prev)}
          className={cn(
            "flex w-full items-center rounded-md px-2 py-2 text-sm transition-colors hover:bg-gray-800",
            collapsed ? "justify-center" : "gap-3"
          )}
        >
          {/* Avatar */}
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt=""
              className="h-8 w-8 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
              {user?.full_name ? getInitials(user.full_name) : "U"}
            </div>
          )}
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-medium text-white">
                  {user?.full_name ?? "User"}
                </p>
                <p className="truncate text-xs text-gray-500">
                  {role ?? "member"}
                </p>
              </div>
              <ChevronsUpDown className="h-4 w-4 shrink-0 text-gray-500" />
            </>
          )}
        </button>

        {/* Dropdown */}
        {userMenuOpen && (
          <div
            className={cn(
              "absolute bottom-full z-50 mb-2 w-56 rounded-md border border-gray-700 bg-gray-800 py-1 shadow-lg",
              collapsed ? "left-full ml-2" : "left-3 right-3 w-auto"
            )}
          >
            <Link
              href="/settings/profile"
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
              onClick={() => setUserMenuOpen(false)}
            >
              <User className="h-4 w-4" />
              Profile
            </Link>
            <form action="/auth/sign-out" method="POST">
              <button
                type="submit"
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Collapse toggle (desktop only, rendered at very bottom) */}
      <div className="hidden shrink-0 border-t border-gray-800 p-2 lg:block">
        <button
          type="button"
          onClick={toggleCollapsed}
          className="flex w-full items-center justify-center rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-800 hover:text-gray-300"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 rounded-md bg-gray-900 p-2 text-gray-400 shadow-lg hover:text-white lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-gray-900 transition-transform duration-300 ease-in-out lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="absolute right-3 top-4 rounded-md p-1 text-gray-400 hover:text-white"
          aria-label="Close navigation"
        >
          <X className="h-5 w-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden h-screen shrink-0 bg-gray-900 transition-[width] duration-300 ease-in-out lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:flex-col",
          collapsed ? "lg:w-16" : "lg:w-64"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
