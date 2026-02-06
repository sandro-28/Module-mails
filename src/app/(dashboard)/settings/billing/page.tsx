"use client"

import { useState } from "react"
import {
  CreditCard,
  Zap,
  CheckCircle2,
  Users,
  Mail,
  BarChart3,
  ArrowRight,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"

// ---------------------------------------------------------------------------
// Plan definitions
// ---------------------------------------------------------------------------

interface Plan {
  name: string
  price: string
  priceDetail: string
  features: string[]
  emailLimit: string
  contactLimit: string
  highlighted?: boolean
}

const PLANS: Plan[] = [
  {
    name: "Free",
    price: "$0",
    priceDetail: "forever",
    emailLimit: "1,000",
    contactLimit: "500",
    features: [
      "1,000 emails/month",
      "500 contacts",
      "1 team member",
      "Basic templates",
      "Email support",
    ],
  },
  {
    name: "Starter",
    price: "$29",
    priceDetail: "/month",
    emailLimit: "10,000",
    contactLimit: "2,500",
    features: [
      "10,000 emails/month",
      "2,500 contacts",
      "3 team members",
      "All templates",
      "Basic automations",
      "Custom domain",
      "Priority support",
    ],
  },
  {
    name: "Pro",
    price: "$79",
    priceDetail: "/month",
    emailLimit: "50,000",
    contactLimit: "15,000",
    highlighted: true,
    features: [
      "50,000 emails/month",
      "15,000 contacts",
      "10 team members",
      "Advanced automations",
      "A/B testing",
      "Advanced analytics",
      "API access",
      "Webhooks",
      "Custom branding",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    priceDetail: "contact us",
    emailLimit: "Unlimited",
    contactLimit: "Unlimited",
    features: [
      "Unlimited emails",
      "Unlimited contacts",
      "Unlimited team members",
      "Dedicated IP",
      "SSO / SAML",
      "SLA guarantee",
      "Dedicated account manager",
      "Custom integrations",
      "Onboarding & training",
    ],
  },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BillingPage() {
  // Mock current plan data
  const currentPlan = "pro"
  const emailsSent = 32_450
  const emailLimit = 50_000
  const contactsUsed = 8_742
  const contactLimit = 15_000

  const emailPct = Math.min((emailsSent / emailLimit) * 100, 100)
  const contactPct = Math.min((contactsUsed / contactLimit) * 100, 100)

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Billing & Usage
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your subscription plan and monitor usage.
        </p>
      </div>

      {/* Current plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-gray-400" />
              <CardTitle>Current Plan</CardTitle>
            </div>
            <Badge variant="default">Pro Plan</Badge>
          </div>
          <CardDescription>
            Your current billing period runs from Jun 1 to Jun 30, 2025.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Mail className="h-4 w-4" />
                Emails Sent This Month
              </div>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-2xl font-bold text-gray-900">
                  {emailsSent.toLocaleString()}
                </span>
                <span className="mb-0.5 text-sm text-gray-500">
                  / {emailLimit.toLocaleString()}
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    emailPct > 90
                      ? "bg-red-500"
                      : emailPct > 70
                        ? "bg-amber-500"
                        : "bg-indigo-500"
                  )}
                  style={{ width: `${emailPct}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {(100 - emailPct).toFixed(1)}% remaining
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Users className="h-4 w-4" />
                Contacts
              </div>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-2xl font-bold text-gray-900">
                  {contactsUsed.toLocaleString()}
                </span>
                <span className="mb-0.5 text-sm text-gray-500">
                  / {contactLimit.toLocaleString()}
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    contactPct > 90
                      ? "bg-red-500"
                      : contactPct > 70
                        ? "bg-amber-500"
                        : "bg-indigo-500"
                  )}
                  style={{ width: `${contactPct}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {(100 - contactPct).toFixed(1)}% remaining
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan comparison */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Compare Plans
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => {
            const isCurrent =
              plan.name.toLowerCase() === currentPlan.toLowerCase()
            return (
              <Card
                key={plan.name}
                className={cn(
                  "relative",
                  plan.highlighted &&
                    "border-indigo-300 shadow-md ring-1 ring-indigo-100"
                )}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="default">
                      <Sparkles className="mr-1 h-3 w-3" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-gray-900">
                      {plan.price}
                    </span>
                    <span className="text-sm text-gray-500">
                      {plan.priceDetail}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>
                      <strong>{plan.emailLimit}</strong> emails/mo
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span>
                      <strong>{plan.contactLimit}</strong> contacts
                    </span>
                  </div>

                  <div className="border-t border-gray-100 pt-3">
                    <ul className="space-y-1.5">
                      {plan.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-2 text-xs text-gray-600"
                        >
                          <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2">
                    {isCurrent ? (
                      <Button
                        variant="secondary"
                        className="w-full"
                        disabled
                      >
                        Current Plan
                      </Button>
                    ) : plan.name === "Enterprise" ? (
                      <Button variant="outline" className="w-full">
                        Contact Sales
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant={plan.highlighted ? "default" : "outline"}
                        className="w-full"
                      >
                        <Zap className="h-4 w-4" />
                        Upgrade
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Billing info notice */}
      <Card>
        <CardContent className="flex items-center gap-3 py-4">
          <CreditCard className="h-5 w-5 text-gray-400" />
          <div className="text-sm text-gray-600">
            Stripe integration is not yet configured. When ready, billing
            management, invoices, and payment method updates will be available
            here.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
