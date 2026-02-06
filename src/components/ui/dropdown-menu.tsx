"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export interface DropdownMenuItem {
  /** Display label */
  label: string
  /** Click handler */
  onClick?: () => void
  /** Optional icon (Lucide component or ReactNode) */
  icon?: React.ReactNode
  /** Renders item in destructive (red) style */
  destructive?: boolean
  /** Render a separator line instead of an item */
  separator?: boolean
  /** Disable this item */
  disabled?: boolean
}

export interface DropdownMenuProps {
  /** The element that triggers the menu */
  trigger: React.ReactNode
  /** Menu items */
  items: DropdownMenuItem[]
  /** Horizontal alignment relative to trigger */
  align?: "left" | "right"
  /** Additional class for the menu panel */
  className?: string
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export function DropdownMenu({
  trigger,
  items,
  align = "right",
  className,
}: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const menuRef = React.useRef<HTMLDivElement>(null)

  // Close on outside click
  React.useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  // Close on Escape
  React.useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open])

  // Focus first item on open
  React.useEffect(() => {
    if (open && menuRef.current) {
      const first = menuRef.current.querySelector<HTMLButtonElement>(
        '[role="menuitem"]:not(:disabled)'
      )
      first?.focus()
    }
  }, [open])

  // Keyboard navigation inside menu
  function handleMenuKeyDown(e: React.KeyboardEvent) {
    if (!menuRef.current) return
    const items = Array.from(
      menuRef.current.querySelectorAll<HTMLButtonElement>(
        '[role="menuitem"]:not(:disabled)'
      )
    )
    const current = document.activeElement as HTMLButtonElement
    const idx = items.indexOf(current)

    if (e.key === "ArrowDown") {
      e.preventDefault()
      items[(idx + 1) % items.length]?.focus()
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      items[(idx - 1 + items.length) % items.length]?.focus()
    } else if (e.key === "Tab") {
      setOpen(false)
    }
  }

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      {/* Trigger */}
      <div
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            setOpen((prev) => !prev)
          }
        }}
        role="button"
        tabIndex={0}
        aria-haspopup="true"
        aria-expanded={open}
      >
        {trigger}
      </div>

      {/* Menu */}
      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-orientation="vertical"
          onKeyDown={handleMenuKeyDown}
          className={cn(
            "absolute z-50 mt-1 min-w-[180px] rounded-md border border-gray-200 bg-white py-1 shadow-lg",
            "animate-in fade-in zoom-in-95 duration-100",
            align === "right" ? "right-0" : "left-0",
            className
          )}
        >
          {items.map((item, i) => {
            if (item.separator) {
              return (
                <div
                  key={`sep-${i}`}
                  className="my-1 h-px bg-gray-200"
                  role="separator"
                />
              )
            }

            return (
              <button
                key={`${item.label}-${i}`}
                role="menuitem"
                type="button"
                disabled={item.disabled}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                  "focus:bg-gray-100 focus:outline-none",
                  "hover:bg-gray-100",
                  "disabled:pointer-events-none disabled:opacity-50",
                  item.destructive
                    ? "text-red-600 hover:bg-red-50 focus:bg-red-50"
                    : "text-gray-700"
                )}
                onClick={() => {
                  item.onClick?.()
                  setOpen(false)
                }}
              >
                {item.icon && (
                  <span className="flex h-4 w-4 items-center justify-center" aria-hidden="true">
                    {item.icon}
                  </span>
                )}
                {item.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
