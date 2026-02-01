import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { StoreSettings, TaxType } from '@/types'
import api from '@/lib/api'

export type PosMode = 'RETAIL' | 'CAFE' | 'RESTAURANT'

interface ConfigState {
  // Business config
  posMode: PosMode
  setupComplete: boolean
  businessName: string
  currency: string
  isLoading: boolean
  error: string | null

  // Store tax settings
  storeSettings: StoreSettings | null

  // Business config actions
  setMode: (mode: PosMode) => void
  setBusinessName: (name: string) => void
  setCurrency: (currency: string) => void
  completeSetup: () => void
  fetchConfig: () => Promise<void>
  saveConfig: () => Promise<void>
  clearError: () => void

  // Store settings actions
  fetchStoreSettings: () => Promise<void>
  updateStoreSettings: (settings: Partial<StoreSettings>) => Promise<void>
}

const defaultStoreSettings: StoreSettings = {
  commercial_tax_rate: 0,
  commercial_tax_inclusive: false,
  service_charge_rate: 0,
  service_charge_inclusive: false,
  default_tax_type: 'NONE',
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      posMode: 'RETAIL',
      setupComplete: false,
      businessName: '',
      currency: 'MMK',
      isLoading: false,
      error: null,
      storeSettings: null,

      setMode: (posMode) => set({ posMode }),

      setBusinessName: (businessName) => set({ businessName }),

      setCurrency: (currency) => set({ currency }),

      completeSetup: () => set({ setupComplete: true }),

      fetchConfig: async () => {
        set({ isLoading: true, error: null })
        try {
          const response = await api.get('/config')
          const config = response.data.data
          set({
            posMode: config.pos_mode || 'RETAIL',
            businessName: config.business_name || '',
            currency: config.currency || 'MMK',
            setupComplete: config.setup_complete || false,
            isLoading: false,
          })
        } catch {
          // Config might not exist yet, use defaults
          set({ isLoading: false })
        }
      },

      saveConfig: async () => {
        const { posMode, businessName, currency, setupComplete } = get()
        set({ isLoading: true, error: null })
        try {
          await api.put('/config', {
            pos_mode: posMode,
            business_name: businessName,
            currency: currency,
            setup_complete: setupComplete,
          })
          set({ isLoading: false })
        } catch (error: unknown) {
          const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save config'
          set({ error: message, isLoading: false })
          throw error
        }
      },

      clearError: () => set({ error: null }),

      fetchStoreSettings: async () => {
        set({ isLoading: true, error: null })
        try {
          const response = await api.get('/store/settings')
          set({ storeSettings: response.data.data, isLoading: false })
        } catch (error: unknown) {
          console.error('Failed to fetch store settings:', error)
          // Use defaults if fetch fails
          set({ storeSettings: defaultStoreSettings, isLoading: false })
        }
      },

      updateStoreSettings: async (settings: Partial<StoreSettings>) => {
        set({ isLoading: true, error: null })
        try {
          const response = await api.put('/store/settings', settings)
          set({ storeSettings: response.data.data, isLoading: false })
        } catch (error: unknown) {
          const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update settings'
          set({ error: message, isLoading: false })
          throw error
        }
      },
    }),
    {
      name: 'config-storage',
      partialize: (state) => ({
        posMode: state.posMode,
        setupComplete: state.setupComplete,
        businessName: state.businessName,
        currency: state.currency,
        storeSettings: state.storeSettings,
      }),
    }
  )
)

// Helper to get tax type label
export const getTaxTypeLabel = (taxType: TaxType): string => {
  switch (taxType) {
    case 'NONE':
      return 'No Tax'
    case 'COMMERCIAL':
      return 'Commercial Tax Only'
    case 'SERVICE':
      return 'Service Charge Only'
    case 'BOTH':
      return 'Commercial Tax + Service Charge'
    default:
      return 'No Tax'
  }
}

// Available tax type options for select
export const TAX_TYPE_OPTIONS: { value: TaxType; label: string }[] = [
  { value: 'NONE', label: 'No Tax' },
  { value: 'COMMERCIAL', label: 'Commercial Tax Only' },
  { value: 'SERVICE', label: 'Service Charge Only' },
  { value: 'BOTH', label: 'Commercial Tax + Service Charge' },
]
