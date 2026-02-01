import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { useConfigStore } from '@/stores/config'
import ProductGrid from '@/components/sell/ProductGrid'
import Cart from '@/components/sell/Cart'
import PaymentSheet from '@/components/sell/PaymentSheet'
import ModifierModal from '@/components/sell/ModifierModal'
import api from '@/lib/api'
import type { Category, Product, ProductVariant, Modifier, ModifierGroup } from '@/types'

export default function CafeSell() {
  const { shift } = useAuthStore()
  const { items, addItem, clearCart, subtotal, taxType, setTaxType, calculateTaxByType, grandTotal } = useCartStore()
  const { storeSettings, fetchStoreSettings } = useConfigStore()

  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showPayment, setShowPayment] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    fetchMenu()
    fetchStoreSettings()
  }, [])

  // Set default tax type from store settings
  useEffect(() => {
    if (storeSettings && taxType === 'NONE') {
      setTaxType(storeSettings.default_tax_type)
    }
  }, [storeSettings])

  const fetchMenu = async () => {
    try {
      const response = await api.get('/sync/menu')
      const { categories: cats, products: prods, variants, modifier_groups, modifiers } = response.data

      // Map modifiers to groups
      const groupsWithModifiers = (modifier_groups || []).map((g: ModifierGroup) => ({
        ...g,
        modifiers: (modifiers || []).filter((m: { group_id: number }) => Number(m.group_id) === Number(g.id)),
      }))

      const productsWithVariants = prods.map((p: Product) => {
        // Find which modifier groups belong to this product
        const productGroups = groupsWithModifiers.filter((g: ModifierGroup) => 
          (p.modifier_groups || []).some((pg: any) => Number(pg.id) === Number(g.id))
        )
        
        return {
          ...p,
          variants: variants.filter((v: { product_id: number }) => Number(v.product_id) === Number(p.id)),
          modifier_groups: productGroups,
        }
      })

      setCategories(cats)
      setProducts(productsWithVariants)
    } catch (error) {
      console.error('Failed to fetch menu:', error)
    }
  }

  const handleProductClick = (product: Product) => {
    // Open modifier modal for cafe mode
    setSelectedProduct(product)
  }

  const handleAddWithModifiers = (
    variant: ProductVariant,
    modifiers: Modifier[],
    quantity: number,
    notes: string
  ) => {
    if (!selectedProduct) return

    // Add to cart with modifiers and notes
    addItem(selectedProduct, variant, modifiers, quantity, notes)
    setSelectedProduct(null)
  }

  const handleCheckout = () => {
    setShowPayment(true)
  }

  const handlePayment = async (method: 'CASH' | 'CARD' | 'MOBILE', _amount: number) => {
    if (!shift) return

    setIsProcessing(true)
    try {
      const orderItems = items.map((item) => ({
        variant_id: item.variant.id,
        quantity: item.quantity,
        modifiers: item.modifiers.map(m => m.id),
        notes: item.notes,
      }))

      const orderResponse = await api.post('/orders', {
        shift_id: shift.id,
        type: 'TAKEOUT',
        tax_type: taxType,
        items: orderItems,
      })

      const order = orderResponse.data.data

      await api.post(`/orders/${order.uuid}/pay`, {
        shift_id: shift.id,
        terminal_uuid: 'default',
        method: method,
        amount: parseFloat(order.grand_total),
      })

      clearCart()
    } catch (error) {
      console.error('Payment failed:', error)
      throw error
    } finally {
      setIsProcessing(false)
    }
  }

  const taxInfo = calculateTaxByType(storeSettings)
  const currentSubtotal = subtotal()
  const total = grandTotal(storeSettings)

  return (
    <div className="h-full flex">
      {/* Product Grid */}
      <div className="flex-1 border-r">
        <ProductGrid
          categories={categories}
          products={products}
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
          onProductClick={handleProductClick}
        />
      </div>

      {/* Cart */}
      <div className="w-80 lg:w-96">
        <Cart
          onCheckout={handleCheckout}
          isProcessing={isProcessing}
        />
      </div>

      {/* Modifier Modal */}
      {selectedProduct && (
        <ModifierModal
          product={selectedProduct}
          modifierGroups={selectedProduct.modifier_groups || []}
          onClose={() => setSelectedProduct(null)}
          onAdd={handleAddWithModifiers}
        />
      )}

      {/* Payment Sheet */}
      {showPayment && (
        <PaymentSheet
          total={total}
          subtotal={currentSubtotal}
          taxLines={taxInfo.lines.map(l => ({ name: l.name, amount: l.amount }))}
          onClose={() => setShowPayment(false)}
          onPayment={handlePayment}
        />
      )}
    </div>
  )
}
