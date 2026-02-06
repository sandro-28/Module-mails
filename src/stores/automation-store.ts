import { create } from "zustand"
import type {
  AutomationStep,
  AutomationTriggerType,
  AutomationTriggerConfig,
} from "@/types/database"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AutomationBuilderState {
  /** The automation name */
  name: string
  /** Optional description */
  description: string
  /** Trigger type */
  triggerType: AutomationTriggerType
  /** Full trigger configuration */
  triggerConfig: AutomationTriggerConfig
  /** Ordered list of steps */
  steps: AutomationStep[]
  /** Whether the builder has unsaved changes */
  isDirty: boolean
}

export interface AutomationBuilderActions {
  /** Replace the entire builder state (e.g. when loading an existing automation) */
  load: (state: Partial<AutomationBuilderState>) => void
  /** Set the automation name */
  setName: (name: string) => void
  /** Set the automation description */
  setDescription: (description: string) => void
  /** Set the trigger type and optionally its config */
  setTrigger: (
    type: AutomationTriggerType,
    config?: Partial<AutomationTriggerConfig>
  ) => void
  /** Update trigger config fields */
  updateTriggerConfig: (config: Partial<AutomationTriggerConfig>) => void
  /** Add a step at a given position (defaults to end) */
  addStep: (step: AutomationStep, atIndex?: number) => void
  /** Remove a step by its id */
  removeStep: (stepId: string) => void
  /** Update a step's properties */
  updateStep: (stepId: string, updates: Partial<AutomationStep>) => void
  /** Move a step from one index to another */
  moveStep: (fromIndex: number, toIndex: number) => void
  /** Reset builder to initial state */
  reset: () => void
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const initialState: AutomationBuilderState = {
  name: "",
  description: "",
  triggerType: "contact_created",
  triggerConfig: {
    trigger_type: "contact_created",
  },
  steps: [],
  isDirty: false,
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAutomationStore = create<
  AutomationBuilderState & AutomationBuilderActions
>((set) => ({
  ...initialState,

  load: (state) =>
    set(() => ({
      ...initialState,
      ...state,
      isDirty: false,
    })),

  setName: (name) =>
    set(() => ({
      name,
      isDirty: true,
    })),

  setDescription: (description) =>
    set(() => ({
      description,
      isDirty: true,
    })),

  setTrigger: (type, config) =>
    set(() => ({
      triggerType: type,
      triggerConfig: {
        trigger_type: type,
        ...config,
      },
      isDirty: true,
    })),

  updateTriggerConfig: (config) =>
    set((state) => ({
      triggerConfig: {
        ...state.triggerConfig,
        ...config,
      },
      isDirty: true,
    })),

  addStep: (step, atIndex) =>
    set((state) => {
      const newSteps = [...state.steps]
      const insertAt = atIndex !== undefined ? atIndex : newSteps.length
      newSteps.splice(insertAt, 0, step)
      // Re-index positions
      return {
        steps: newSteps.map((s, i) => ({ ...s, position: i })),
        isDirty: true,
      }
    }),

  removeStep: (stepId) =>
    set((state) => ({
      steps: state.steps
        .filter((s) => s.id !== stepId)
        .map((s, i) => ({ ...s, position: i })),
      isDirty: true,
    })),

  updateStep: (stepId, updates) =>
    set((state) => ({
      steps: state.steps.map((s) =>
        s.id === stepId ? ({ ...s, ...updates } as AutomationStep) : s
      ),
      isDirty: true,
    })),

  moveStep: (fromIndex, toIndex) =>
    set((state) => {
      const newSteps = [...state.steps]
      const [moved] = newSteps.splice(fromIndex, 1)
      newSteps.splice(toIndex, 0, moved)
      return {
        steps: newSteps.map((s, i) => ({ ...s, position: i })),
        isDirty: true,
      }
    }),

  reset: () => set(() => ({ ...initialState })),
}))
