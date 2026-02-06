import { create } from 'zustand'
import type { CampaignType, AbTestConfig } from '@/types/database'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WizardStep = 1 | 2 | 3 | 4 | 5

export interface CampaignWizardData {
  // Step 1 - Settings
  name: string
  type: CampaignType
  subject: string
  preview_text: string
  from_name: string
  from_email: string
  reply_to: string

  // Step 2 - Content
  html_content: string
  text_content: string
  template_id: string | null

  // Step 3 - Recipients
  recipient_list_ids: string[]
  recipient_segment_ids: string[]
  exclude_list_ids: string[]
  exclude_segment_ids: string[]

  // Step 4 - Schedule
  send_now: boolean
  scheduled_at: string | null
  timezone: string

  // A/B test (optional)
  ab_test_config: AbTestConfig | null

  // UTM params
  utm_source: string
  utm_medium: string
  utm_campaign: string
  utm_content: string
  utm_term: string
}

export interface StepValidation {
  valid: boolean
  errors: string[]
}

interface CampaignWizardState {
  currentStep: WizardStep
  campaignData: CampaignWizardData
  isDirty: boolean

  // Actions
  setStep: (step: WizardStep) => void
  updateCampaignData: (data: Partial<CampaignWizardData>) => void
  reset: () => void
  validateStep: (step: WizardStep) => StepValidation
}

// ---------------------------------------------------------------------------
// Default data
// ---------------------------------------------------------------------------

const defaultCampaignData: CampaignWizardData = {
  name: '',
  type: 'regular',
  subject: '',
  preview_text: '',
  from_name: '',
  from_email: '',
  reply_to: '',
  html_content: '',
  text_content: '',
  template_id: null,
  recipient_list_ids: [],
  recipient_segment_ids: [],
  exclude_list_ids: [],
  exclude_segment_ids: [],
  send_now: true,
  scheduled_at: null,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  ab_test_config: null,
  utm_source: '',
  utm_medium: 'email',
  utm_campaign: '',
  utm_content: '',
  utm_term: '',
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useCampaignWizardStore = create<CampaignWizardState>((set, get) => ({
  currentStep: 1,
  campaignData: { ...defaultCampaignData },
  isDirty: false,

  setStep: (step) => set({ currentStep: step }),

  updateCampaignData: (data) =>
    set((state) => ({
      campaignData: { ...state.campaignData, ...data },
      isDirty: true,
    })),

  reset: () =>
    set({
      currentStep: 1,
      campaignData: { ...defaultCampaignData },
      isDirty: false,
    }),

  validateStep: (step) => {
    const { campaignData } = get()
    const errors: string[] = []

    switch (step) {
      case 1: {
        if (!campaignData.name.trim()) errors.push('Campaign name is required')
        if (!campaignData.subject.trim()) errors.push('Subject line is required')
        if (!campaignData.from_name.trim()) errors.push('From name is required')
        if (!campaignData.from_email.trim()) errors.push('From email is required')
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(campaignData.from_email))
          errors.push('From email must be a valid email address')
        if (campaignData.reply_to && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(campaignData.reply_to))
          errors.push('Reply-to must be a valid email address')
        break
      }
      case 2: {
        if (!campaignData.html_content.trim() && !campaignData.template_id)
          errors.push('Email content or a template is required')
        break
      }
      case 3: {
        if (
          campaignData.recipient_list_ids.length === 0 &&
          campaignData.recipient_segment_ids.length === 0
        )
          errors.push('At least one list or segment must be selected')
        break
      }
      case 4: {
        if (!campaignData.send_now && !campaignData.scheduled_at)
          errors.push('A schedule date/time is required when not sending immediately')
        if (!campaignData.send_now && campaignData.scheduled_at) {
          const scheduledDate = new Date(campaignData.scheduled_at)
          if (scheduledDate <= new Date())
            errors.push('Scheduled date must be in the future')
        }
        break
      }
      case 5: {
        // Aggregate all previous steps
        for (let s = 1; s <= 4; s++) {
          const v = get().validateStep(s as WizardStep)
          errors.push(...v.errors)
        }
        break
      }
    }

    return { valid: errors.length === 0, errors }
  },
}))
