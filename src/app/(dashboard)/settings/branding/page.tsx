"use client"

import { useState, useTransition, useRef } from "react"
import {
  Palette,
  Upload,
  Globe,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  X,
  Save,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { updateBranding } from "@/app/actions/settings"

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BrandingPage() {
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [primaryColor, setPrimaryColor] = useState("#4F46E5")
  const [accentColor, setAccentColor] = useState("#10B981")
  const [customDomain, setCustomDomain] = useState("")
  const [toast, setToast] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      showToast("error", "Please upload an image file.")
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast("error", "Image must be smaller than 2MB.")
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      setLogoPreview(ev.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateBranding({
        logo_url: logoPreview,
        metadata: {
          primary_color: primaryColor,
          accent_color: accentColor,
          custom_domain: customDomain || null,
        },
      })
      if (result.success) {
        showToast("success", "Branding settings saved successfully.")
      } else {
        showToast("error", result.error ?? "Failed to save branding settings.")
      }
    })
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Branding
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Customize the look and feel of your emails and forms.
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg border px-4 py-3 text-sm shadow-sm",
            toast.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          )}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          {toast.message}
        </div>
      )}

      {/* Logo */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-gray-400" />
            <CardTitle>Logo</CardTitle>
          </div>
          <CardDescription>
            Upload your organization logo. Recommended size: 200x50px, PNG or SVG.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div
              className={cn(
                "flex h-24 w-48 items-center justify-center rounded-lg border-2 border-dashed",
                logoPreview
                  ? "border-gray-200 bg-gray-50"
                  : "border-gray-300 bg-gray-50"
              )}
            >
              {logoPreview ? (
                <div className="relative">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="max-h-20 max-w-44 object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setLogoPreview(null)}
                    className="absolute -right-2 -top-2 rounded-full bg-white p-0.5 shadow-sm border border-gray-200 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="mx-auto h-6 w-6 text-gray-400" />
                  <p className="mt-1 text-xs text-gray-500">No logo</p>
                </div>
              )}
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                Upload Logo
              </Button>
              <p className="mt-2 text-xs text-gray-500">
                PNG, SVG, or JPEG. Max 2MB.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Colors */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-gray-400" />
            <CardTitle>Brand Colors</CardTitle>
          </div>
          <CardDescription>
            Set your primary and accent colors for emails, forms, and hosted pages.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Primary Color
              </label>
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-lg border border-gray-200 shadow-sm"
                  style={{ backgroundColor: primaryColor }}
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#4F46E5"
                  className="font-mono"
                />
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-10 w-10 cursor-pointer rounded border border-gray-200"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Accent Color
              </label>
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-lg border border-gray-200 shadow-sm"
                  style={{ backgroundColor: accentColor }}
                />
                <Input
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  placeholder="#10B981"
                  className="font-mono"
                />
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="h-10 w-10 cursor-pointer rounded border border-gray-200"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom domain */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-gray-400" />
            <CardTitle>Custom Domain</CardTitle>
          </div>
          <CardDescription>
            Use a custom domain for hosted forms, landing pages, and unsubscribe pages.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            label="Custom Domain"
            value={customDomain}
            onChange={(e) => setCustomDomain(e.target.value)}
            placeholder="mail.yourdomain.com"
            helperText="Point a CNAME record to hosting.mailforge.app"
          />
        </CardContent>
      </Card>

      {/* Live preview */}
      <Card>
        <CardHeader>
          <CardTitle>Live Preview</CardTitle>
          <CardDescription>
            See how your branding looks on emails and forms.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            {/* Email header preview */}
            <div
              className="px-6 py-4"
              style={{ backgroundColor: primaryColor }}
            >
              <div className="flex items-center gap-3">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo"
                    className="h-8 max-w-[120px] object-contain"
                  />
                ) : (
                  <div className="text-sm font-bold text-white">
                    Your Logo
                  </div>
                )}
              </div>
            </div>
            <div className="bg-white px-6 py-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Welcome to our newsletter!
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                This is a preview of how your branded emails will look. The
                header uses your primary color, and the button uses your accent
                color.
              </p>
              <button
                className="mt-4 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-white"
                style={{ backgroundColor: accentColor }}
              >
                Read More
              </button>
            </div>
            <div className="border-t border-gray-100 bg-gray-50 px-6 py-3">
              <p className="text-xs text-gray-400">
                Sent via MailForge
                {customDomain ? ` - ${customDomain}` : ""}
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSave} loading={isPending}>
            <Save className="h-4 w-4" />
            Save Branding
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
