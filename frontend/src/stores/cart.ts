import { create } from 'zustand'
import type { CartItem, Product, ProductVariant, Modifier } from '@/types'

interface CartState {
  items: CartItem[]
  orderType: 'DINE_IN' | 'TAKEOUT' | 'DELIVERY'
  tableSessionId: number | null
  
  addItem: (product: Product, variant: ProductVariant, modifiers?: Modifier[], quantity?: number, notes?: string) => void
  removeItem: (cartItemId: string) => void
  updateQuantity: (cartItemId: string, quantity: number) => void
  clearCart: () => void
  setOrderType: (type: 'DINE_IN' | 'TAKEOUT' | 'DELIVERY') => void
  setTableSession: (sessionId: number | null) => void
  
  subtotal: () => number
  itemCount: () => number
  calculateTax: (taxGroups: TaxGroup[]) => { total: number; lines: { name: string; amount: number }[] }
  grandTotal: (taxGroups: TaxGroup[]) => number
}

const generateCartItemId = (variantId: number, modifiers: Modifier[] = [], notes: string = '') => {
  const modifierIds = [...modifiers].sort((a, b) => a.id - b.id).map(m => m.id).join(',')
  return `${variantId}-${modifierIds}-${notes}`
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  orderType: 'TAKEOUT',
  tableSessionId: null,

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

  itemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0)
  },

  calculateTax: (taxGroups) => {
    const items = get().items
    let totalTax = 0
    const lines: { name: string; amount: number }[] = []

    items.forEach(item => {
      const taxGroupId = item.product.tax_group_id
      if (!taxGroupId) return

      const group = taxGroups.find(g => g.id === taxGroupId)
      if (!group) return

      const basePrice = parseFloat(String(item.variant.price)) || 0
      const modifiersPrice = (item.modifiers || []).reduce(
        (mSum, m) => mSum + (parseFloat(String(m.price_extra)) || 0),
        0
      )
      const itemSubtotal = (basePrice + modifiersPrice) * item.quantity

      group.taxes.forEach(tax => {
        const rate = parseFloat(tax.rate)
        let taxAmount = 0

        if (tax.is_inclusive) {
          // tax = itemSubtotal - (itemSubtotal / (1 + rate))
          taxAmount = itemSubtotal - (itemSubtotal / (1 + rate))
        } else {
          // tax = itemSubtotal * rate
          taxAmount = itemSubtotal * rate
        }

        totalTax += taxAmount
        
        const existingLine = lines.find(l => l.name === tax.name)
        if (existingLine) {
          existingLine.amount += taxAmount
        } else {
          lines.push({ name: tax.name, amount: taxAmount })
        }
      })
    })

    return { total: totalTax, lines }
  },

  grandTotal: (taxGroups) => {
    const subtotal = get().subtotal()
    const taxInfo = get().calculateTax(taxGroups)
    
    const exclusiveTaxTotal = taxInfo.lines.reduce((sum, line) => {
      const isInclusive = taxGroups.some(g => g.taxes.some(t => t.name === line.name && t.is_inclusive))
      return isInclusive ? sum : sum + line.amount
    }, 0)

    return subtotal + exclusiveTaxTotal
  },
}))
