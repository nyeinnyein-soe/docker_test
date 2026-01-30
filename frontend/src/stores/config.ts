import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/lib/api'

export type PosMode = 'RETAIL' | 'CAFE' | 'RESTAURANT'

interface ConfigState {
  posMode: PosMode
  setupComplete: boolean
  businessName: string
  currency: string
  isLoading: boolean
  error: string | null

  setMode: (mode: PosMode) => void
  setBusinessName: (name: string) => void
  setCurrency: (currency: string) => void
  completeSetup: () => void
  fetchConfig: () => Promise<void>
  saveConfig: () => Promise<void>
  clearError: () => void
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
    }),
    {
      name: 'config-storage',
      partialize: (state) => ({
        posMode: state.posMode,
        setupComplete: state.setupComplete,
        businessName: state.businessName,
        currency: state.currency,
      }),
    }
  )
)
