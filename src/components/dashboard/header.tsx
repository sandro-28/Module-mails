"use client"

import { useState, useRef, useEffect, Fragment } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Search,
  Bell,
  ChevronRight,
  Menu,
  User,
  LogOut,
  ChevronsUpDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getInitials } from "@/lib/utils"
import { useOrganization } from "@/hooks/use-organization"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Breadcrumb {
  label: string
  href?: string
}

interface HeaderProps {
  title?: string
  breadcrumbs?: Breadcrumb[]
  onMobileMenuToggle?: () => void
}

// ---------------------------------------------------------------------------
// Route label map (used when no explicit breadcrumbs provided)
// ---------------------------------------------------------------------------

const ROUTE_LABELS: Record<string, string> = {
  "/": "Dashboard",
  "/contacts": "Contacts",
  "/lists": "Lists",
  "/segments": "Segments",
  "/campaigns": "Campaigns",
  "/templates": "Templates",
  "/automations": "Automations",
  "/forms": "Forms",
  "/analytics": "Analytics",
  "/settings": "Settings",
  "/logs": "Logs",
}

function buildBreadcrumbs(pathname: string): Breadcrumb[] {
  if (pathname === "/") {
    return [{ label: "Dashboard" }]
  }

  const segments = pathname.split("/").filter(Boolean)
  const crumbs: Breadcrumb[] = [{ label: "Dashboard", href: "/" }]

  let path = ""
  segments.forEach((seg, idx) => {
    path += `/${seg}`
    const label =
      ROUTE_LABELS[path] ??
      seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " ")
    const isLast = idx === segments.length - 1
    crumbs.push({ label, href: isLast ? undefined : path })
  })

  return crumbs
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Header({ title, breadcrumbs, onMobileMenuToggle }: HeaderProps) {
  const pathname = usePathname()
  const { user } = useOrganization()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const crumbs = breadcrumbs ?? buildBreadcrumbs(pathname)
  const pageTitle = title ?? crumbs[crumbs.length - 1]?.label ?? "Dashboard"

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

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-4 border-b border-gray-200 bg-white px-4 sm:px-6 lg:px-8">
      {/* Mobile menu button */}
      {onMobileMenuToggle && (
        <button
          type="button"
          onClick={onMobileMenuToggle}
          className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      {/* Left side: breadcrumbs + title */}
      <div className="min-w-0 flex-1">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="hidden sm:block">
          <ol className="flex items-center gap-1 text-sm text-gray-500">
            {crumbs.map((crumb, idx) => (
              <Fragment key={idx}>
                {idx > 0 && (
                  <li aria-hidden="true">
                    <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                  </li>
                )}
                <li>
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      className="hover:text-gray-700 transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="font-medium text-gray-900">
                      {crumb.label}
                    </span>
                  )}
                </li>
              </Fragment>
            ))}
          </ol>
        </nav>

        {/* Title (visible on mobile instead of breadcrumbs) */}
        <h1 className="truncate text-lg font-semibold text-gray-900 sm:hidden">
          {pageTitle}
        </h1>
      </div>

      {/* Right side: actions */}
      <div className="flex items-center gap-2">
        {/* Search (Cmd+K placeholder) */}
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          onClick={() => {
            // Placeholder: open command palette
          }}
        >
          <Search className="h-4 w-4" />
          <span className="hidden md:inline">Search...</span>
          <kbd className="hidden rounded border border-gray-300 bg-white px-1.5 py-0.5 text-[10px] font-medium text-gray-400 md:inline">
            {"\u2318"}K
          </kbd>
        </button>

        {/* Notifications */}
        <button
          type="button"
          className="relative rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          aria-label="View notifications"
        >
          <Bell className="h-5 w-5" />
          {/* Dot indicator */}
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-indigo-600" />
        </button>

        {/* User menu */}
        <div ref={userMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setUserMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-gray-100"
          >
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt=""
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
                {user?.full_name ? getInitials(user.full_name) : "U"}
              </div>
            )}
            <ChevronsUpDown className="hidden h-4 w-4 text-gray-400 sm:block" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
              <div className="border-b border-gray-100 px-3 py-2">
                <p className="truncate text-sm font-medium text-gray-900">
                  {user?.full_name ?? "User"}
                </p>
                <p className="truncate text-xs text-gray-500">
                  {user?.email ?? ""}
                </p>
              </div>
              <Link
                href="/settings/profile"
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setUserMenuOpen(false)}
              >
                <User className="h-4 w-4" />
                Profile
              </Link>
              <form action="/auth/sign-out" method="POST">
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
