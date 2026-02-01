import { create } from 'zustand'
import type { CartItem, Product, ProductVariant, Modifier, TaxType, StoreSettings } from '@/types'

interface TaxLine {
  name: string
  amount: number
  isInclusive: boolean
}

interface CartState {
  items: CartItem[]
  orderType: 'DINE_IN' | 'TAKEOUT' | 'DELIVERY'
  tableSessionId: number | null
  taxType: TaxType
  
  addItem: (product: Product, variant: ProductVariant, modifiers?: Modifier[], quantity?: number, notes?: string) => void
  removeItem: (cartItemId: string) => void
  updateQuantity: (cartItemId: string, quantity: number) => void
  clearCart: () => void
  setOrderType: (type: 'DINE_IN' | 'TAKEOUT' | 'DELIVERY') => void
  setTableSession: (sessionId: number | null) => void
  setTaxType: (taxType: TaxType) => void
  
  subtotal: () => number
  taxableSubtotal: () => number
  itemCount: () => number
  calculateTaxByType: (storeSettings: StoreSettings | null) => { total: number; lines: TaxLine[] }
  grandTotal: (storeSettings: StoreSettings | null) => number
}

const generateCartItemId = (variantId: number, modifiers: Modifier[] = [], notes: string = '') => {
  const modifierIds = [...modifiers].sort((a, b) => a.id - b.id).map(m => m.id).join(',')
  return `${variantId}-${modifierIds}-${notes}`
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  orderType: 'TAKEOUT',
  tableSessionId: null,
  taxType: 'NONE',

  addItem: (product, variant, modifiers = [], quantity = 1, notes = '') => {
    set((state) => {
      const cartItemId = generateCartItemId(variant.id, modifiers, notes)
      const existing = state.items.find((item) => item.id === cartItemId)
      
      if (existing) {
        return {
          items: state.items.map((item) =>
            item.id === cartItemId
              ? { ...item, quantity: item.quantity + quantity }
              : item
          ),
        }
      }
      
      return {
        items: [...state.items, { id: cartItemId, product, variant, quantity, modifiers, notes }],
      }
    })
  },

  removeItem: (cartItemId) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== cartItemId),
    }))
  },

  updateQuantity: (cartItemId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(cartItemId)
      return
    }
    
    set((state) => ({
      items: state.items.map((item) =>
        item.id === cartItemId ? { ...item, quantity } : item
      ),
    }))
  },

  clearCart: () => {
    set({ items: [], tableSessionId: null })
  },

  setOrderType: (orderType) => {
    set({ orderType })
    if (orderType !== 'DINE_IN') {
      set({ tableSessionId: null })
    }
  },

  setTableSession: (tableSessionId) => {
    set({ tableSessionId })
  },

  setTaxType: (taxType) => {
    set({ taxType })
  },

  subtotal: () => {
    return get().items.reduce((sum, item) => {
      const basePrice = parseFloat(String(item.variant.price)) || 0
      const modifiersPrice = (item.modifiers || []).reduce(
        (mSum, m) => mSum + (parseFloat(String(m.price_extra)) || 0),
        0
      )
      return sum + (basePrice + modifiersPrice) * item.quantity
    }, 0)
  },

  taxableSubtotal: () => {
    return get().items.reduce((sum, item) => {
      // Only include items where is_taxable is true
      if (item.product.is_taxable === false) {
        return sum
      }
      
      const basePrice = parseFloat(String(item.variant.price)) || 0
      const modifiersPrice = (item.modifiers || []).reduce(
        (mSum, m) => mSum + (parseFloat(String(m.price_extra)) || 0),
        0
      )
      return sum + (basePrice + modifiersPrice) * item.quantity
    }, 0)
  },

  itemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0)
  },

  calculateTaxByType: (storeSettings) => {
    const taxType = get().taxType
    const taxableAmount = get().taxableSubtotal()
    
    if (taxType === 'NONE' || !storeSettings || taxableAmount <= 0) {
      return { total: 0, lines: [] }
    }

    let totalTax = 0
    const lines: TaxLine[] = []

    // Calculate Commercial Tax
    if ((taxType === 'COMMERCIAL' || taxType === 'BOTH') && storeSettings.commercial_tax_rate > 0) {
      const rate = storeSettings.commercial_tax_rate
      const isInclusive = storeSettings.commercial_tax_inclusive
      let taxAmount = 0

      if (isInclusive) {
        // Extract tax from price: tax = amount - (amount / (1 + rate))
        taxAmount = taxableAmount - (taxableAmount / (1 + rate))
      } else {
        // Add tax on top: tax = amount * rate
        taxAmount = taxableAmount * rate
      }

      totalTax += taxAmount
      lines.push({
        name: 'Commercial Tax',
        amount: taxAmount,
        isInclusive,
      })
    }

    // Calculate Service Charge
    if ((taxType === 'SERVICE' || taxType === 'BOTH') && storeSettings.service_charge_rate > 0) {
      const rate = storeSettings.service_charge_rate
      const isInclusive = storeSettings.service_charge_inclusive
      let taxAmount = 0

      if (isInclusive) {
        // Extract tax from price: tax = amount - (amount / (1 + rate))
        taxAmount = taxableAmount - (taxableAmount / (1 + rate))
      } else {
        // Add tax on top: tax = amount * rate
        taxAmount = taxableAmount * rate
      }

      totalTax += taxAmount
      lines.push({
        name: 'Service Charge',
        amount: taxAmount,
        isInclusive,
      })
    }

    return { total: totalTax, lines }
  },

  grandTotal: (storeSettings) => {
    const subtotal = get().subtotal()
    const taxInfo = get().calculateTaxByType(storeSettings)
    
    // Only add exclusive taxes to the total
    const exclusiveTaxTotal = taxInfo.lines.reduce((sum, line) => {
      return line.isInclusive ? sum : sum + line.amount
    }, 0)

    return subtotal + exclusiveTaxTotal
  },
}))
