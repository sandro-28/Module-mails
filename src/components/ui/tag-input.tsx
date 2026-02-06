"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface TagInputProps {
  /** Current tags */
  value: string[]
  /** Called when tags change */
  onChange: (tags: string[]) => void
  /** Input placeholder */
  placeholder?: string
  /** Suggestions to show while typing */
  suggestions?: string[]
  /** Additional class for the container */
  className?: string
  /** Disable the input */
  disabled?: boolean
}

export function TagInput({
  value,
  onChange,
  placeholder = "Type and press Enter...",
  suggestions = [],
  className,
  disabled = false,
}: TagInputProps) {
  const [inputValue, setInputValue] = React.useState("")
  const [showSuggestions, setShowSuggestions] = React.useState(false)
  const [activeIndex, setActiveIndex] = React.useState(-1)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const filteredSuggestions = React.useMemo(() => {
    if (!inputValue.trim()) return []
    const lower = inputValue.toLowerCase()
    return suggestions.filter(
      (s) =>
        s.toLowerCase().includes(lower) &&
        !value.includes(s)
    )
  }, [inputValue, suggestions, value])

  // Close suggestions on outside click
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  function addTag(tag: string) {
    const trimmed = tag.trim()
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed])
    }
    setInputValue("")
    setShowSuggestions(false)
    setActiveIndex(-1)
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault()
      if (activeIndex >= 0 && filteredSuggestions[activeIndex]) {
        addTag(filteredSuggestions[activeIndex])
      } else if (inputValue.trim()) {
        addTag(inputValue)
      }
    } else if (
      e.key === "Backspace" &&
      !inputValue &&
      value.length > 0
    ) {
      removeTag(value[value.length - 1])
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((prev) =>
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === "Escape") {
      setShowSuggestions(false)
      setActiveIndex(-1)
    }
  }

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div
        className={cn(
          "flex min-h-[38px] flex-wrap items-center gap-1.5 rounded-md border border-gray-300 bg-transparent px-3 py-1.5 shadow-sm transition-colors",
          "focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-1",
          disabled && "cursor-not-allowed opacity-50"
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-md bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800"
          >
            {tag}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  removeTag(tag)
                }}
                className="ml-0.5 rounded-sm text-indigo-600 hover:text-indigo-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                aria-label={`Remove ${tag}`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}

        <input
          ref={inputRef}
          type="text"
          className="min-w-[120px] flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            setShowSuggestions(true)
            setActiveIndex(-1)
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ""}
          disabled={disabled}
          role="combobox"
          aria-expanded={showSuggestions && filteredSuggestions.length > 0}
          aria-autocomplete="list"
          aria-controls="tag-suggestions"
        />
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <ul
          id="tag-suggestions"
          role="listbox"
          className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg"
        >
          {filteredSuggestions.map((suggestion, i) => (
            <li
              key={suggestion}
              role="option"
              aria-selected={i === activeIndex}
              className={cn(
                "cursor-pointer px-3 py-1.5 text-sm text-gray-700",
                i === activeIndex
                  ? "bg-indigo-50 text-indigo-900"
                  : "hover:bg-gray-100"
              )}
              onMouseDown={(e) => {
                e.preventDefault()
                addTag(suggestion)
              }}
              onMouseEnter={() => setActiveIndex(i)}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
