import { create } from 'zustand'
import api from '@/lib/api'
import type { Order } from '@/types'

interface OrdersState {
  orders: Order[]
  isLoading: boolean
  error: string | null

  fetchOrders: () => Promise<void>
  refundOrder: (orderUuid: string, reason: string) => Promise<void>
  clearError: () => void
}

export const useOrdersStore = create<OrdersState>((set, get) => ({
  orders: [],
  isLoading: false,
  error: null,

  fetchOrders: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.get('/orders')
      set({ orders: response.data.data || [], isLoading: false })
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to fetch orders'
      set({ error: message, isLoading: false })
    }
  },

  refundOrder: async (orderUuid: string, reason: string) => {
    set({ isLoading: true, error: null })
    try {
      await api.post(`/orders/${orderUuid}/refund`, { reason })
      // Refresh orders list
      await get().fetchOrders()
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to refund order'
      set({ error: message, isLoading: false })
      throw error
    }
  },

  clearError: () => set({ error: null }),
}))
