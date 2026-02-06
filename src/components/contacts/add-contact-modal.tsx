"use client"

import { useState, useTransition, useEffect } from "react"
import { X, Loader2, Plus, Check } from "lucide-react"
import { z } from "zod"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createContact } from "@/app/actions/contacts"
import { createClient } from "@/lib/supabase/client"

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const formSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  consent_given: z.boolean(),
})

type FormErrors = Partial<Record<keyof z.infer<typeof formSchema> | "_form", string[]>>

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AvailableList {
  id: string
  name: string
}

interface AddContactModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AddContactModal({ open, onClose, onSuccess }: AddContactModalProps) {
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<FormErrors>({})
  const [lists, setLists] = useState<AvailableList[]>([])
  const [selectedLists, setSelectedLists] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [consentGiven, setConsentGiven] = useState(false)

  // Fetch available lists on mount
  useEffect(() => {
    if (!open) return
    const supabase = createClient()
    supabase
      .from("lists")
      .select("id, name")
      .order("name")
      .then(({ data }) => {
        if (data) setLists(data as AvailableList[])
      })
  }, [open])

  // Reset form when closed
  useEffect(() => {
    if (!open) {
      setErrors({})
      setSelectedLists([])
      setTags([])
      setTagInput("")
      setConsentGiven(false)
    }
  }, [open])

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      const value = tagInput.trim().replace(/,/g, "")
      if (value && !tags.includes(value)) {
        setTags((prev) => [...prev, value])
      }
      setTagInput("")
    }
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag))
  }

  function toggleList(listId: string) {
    setSelectedLists((prev) =>
      prev.includes(listId) ? prev.filter((id) => id !== listId) : [...prev, listId]
    )
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)

    // Client-side validation
    const raw = {
      email: fd.get("email") as string,
      first_name: (fd.get("first_name") as string) || undefined,
      last_name: (fd.get("last_name") as string) || undefined,
      phone: (fd.get("phone") as string) || undefined,
      company: (fd.get("company") as string) || undefined,
      consent_given: consentGiven,
    }

    const parsed = formSchema.safeParse(raw)
    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors as FormErrors)
      return
    }

    // Append list_ids and tags to formData
    selectedLists.forEach((id) => fd.append("list_ids", id))
    tags.forEach((tag) => fd.append("tags", tag))
    fd.set("consent_given", String(consentGiven))

    setErrors({})

    startTransition(async () => {
      const result = await createContact(fd)
      if (result.error) {
        setErrors(result.error as FormErrors)
        return
      }
      onSuccess?.()
      onClose()
    })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
        aria-hidden
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add Contact"
        className="relative z-50 mx-4 w-full max-w-lg rounded-xl bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Add Contact</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4">
          <div className="space-y-4">
            {/* Email */}
            <Input
              name="email"
              label="Email *"
              type="email"
              placeholder="contact@example.com"
              error={errors.email?.[0]}
              autoFocus
              required
            />

            {/* Name row */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                name="first_name"
                label="First Name"
                placeholder="Jane"
                error={errors.first_name?.[0]}
              />
              <Input
                name="last_name"
                label="Last Name"
                placeholder="Doe"
                error={errors.last_name?.[0]}
              />
            </div>

            {/* Phone & Company */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                name="phone"
                label="Phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                error={errors.phone?.[0]}
              />
              <Input
                name="company"
                label="Company"
                placeholder="Acme Inc."
                error={errors.company?.[0]}
              />
            </div>

            {/* Lists */}
            {lists.length > 0 && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Add to Lists
                </label>
                <div className="max-h-32 overflow-y-auto rounded-md border border-gray-300 p-2">
                  {lists.map((list) => (
                    <label
                      key={list.id}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-gray-50",
                        selectedLists.includes(list.id) && "bg-indigo-50"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-4 w-4 items-center justify-center rounded border",
                          selectedLists.includes(list.id)
                            ? "border-indigo-600 bg-indigo-600"
                            : "border-gray-300"
                        )}
                      >
                        {selectedLists.includes(list.id) && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={selectedLists.includes(list.id)}
                        onChange={() => toggleList(list.id)}
                      />
                      <span className="text-gray-700">{list.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Tags
              </label>
              <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-gray-300 px-2 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-1">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="rounded-full p-0.5 hover:bg-indigo-200"
                      aria-label={`Remove tag ${tag}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder={tags.length === 0 ? "Type and press Enter..." : ""}
                  className="flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-gray-400"
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Press Enter or comma to add a tag
              </p>
            </div>

            {/* Consent */}
            <label className="flex items-start gap-3 rounded-md border border-gray-200 bg-gray-50 p-3">
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Consent to receive emails
                </span>
                <p className="mt-0.5 text-xs text-gray-500">
                  By checking this box, you confirm that the contact has given
                  explicit consent to receive marketing emails. Consent date
                  will be recorded automatically.
                </p>
              </div>
            </label>

            {/* Server errors */}
            {errors._form && (
              <div className="rounded-md bg-red-50 p-3">
                <p className="text-sm text-red-600">{errors._form[0]}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isPending ? "Adding..." : "Add Contact"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
