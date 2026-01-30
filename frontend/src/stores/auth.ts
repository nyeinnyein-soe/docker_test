import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Employee, Shift } from '@/types'
import api from '@/lib/api'

interface ShiftStats {
  orders_count: number
  items_count: number
  modifiers_count: number
  total_sales: string
  total_tax: string
  total_discount: string
  payments: {
    cash: string
    card: string
    other: string
  }
}

interface AuthState {
  employee: Employee | null
  shift: Shift | null
  shiftStats: ShiftStats | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  
  login: (email: string, pin: string) => Promise<boolean>
  logout: () => Promise<void>
  fetchProfile: () => Promise<void>
  openShift: (startingCash: number) => Promise<Shift>
  fetchCurrentShift: () => Promise<void>
  closeShift: (actualCash: number) => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      employee: null,
      shift: null,
      shiftStats: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, pin: string) => {
        set({ isLoading: true, error: null })
        try {
          const response = await api.post('/auth/login', { email, pin })
          const { token, employee: emp, store_id, role } = response.data.data
          
          // Map backend response to our Employee type
          const employee: Employee = {
            id: emp.id,
            uuid: emp.uuid,
            store_id: store_id,
            name: `${emp.first_name} ${emp.last_name}`,
            email: emp.email,
            role: role?.toUpperCase() || 'CASHIER',
            is_active: true,
          }
          
          localStorage.setItem('auth_token', token)
          set({ employee, isAuthenticated: true, isLoading: false })
          
          // Try to fetch current shift after login
          await get().fetchCurrentShift()
          
          return true
        } catch (error: unknown) {
          const message = error instanceof Error 
            ? error.message 
            : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed'
          set({ error: message, isLoading: false })
          return false
        }
      },

      logout: async () => {
        set({ isLoading: true })
        try {
          await api.post('/auth/logout')
        } catch {
          // Ignore logout errors
        } finally {
          localStorage.removeItem('auth_token')
          set({ 
            employee: null, 
            shift: null,
            isAuthenticated: false, 
            isLoading: false 
          })
        }
      },

      fetchProfile: async () => {
        try {
          const response = await api.get('/auth/me')
          set({ employee: response.data.data })
        } catch {
          // Token might be invalid
          localStorage.removeItem('auth_token')
          set({ employee: null, isAuthenticated: false })
        }
      },

      openShift: async (startingCash: number) => {
        set({ isLoading: true, error: null })
        try {
          const response = await api.post('/shifts/open', { starting_cash: startingCash })
          const shift = response.data.data
          set({ shift, isLoading: false })
          // Refresh to get full shift with relationships
          await get().fetchCurrentShift()
          return shift
        } catch (error: unknown) {
          const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to open shift'
          set({ error: message, isLoading: false })
          throw error
        }
      },

      fetchCurrentShift: async () => {
        try {
          const response = await api.get('/shifts/current')
          const shift = response.data.data
          const stats = response.data.stats
          set({ shift, shiftStats: stats })
        } catch {
          set({ shift: null, shiftStats: null })
        }
      },

      closeShift: async (actualCash: number) => {
        const { shift } = get()
        if (!shift) return

        set({ isLoading: true, error: null })
        try {
          await api.post(`/shifts/${shift.id}/close`, { actual_cash: actualCash })
          set({ shift: null, shiftStats: null, isLoading: false })
        } catch (error: unknown) {
          const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to close shift'
          set({ error: message, isLoading: false })
          throw error
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        employee: state.employee,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
