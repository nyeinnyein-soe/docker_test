import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { useConfigStore } from '@/stores/config'
import ProductGrid from '@/components/sell/ProductGrid'
import Cart from '@/components/sell/Cart'
import PaymentSheet from '@/components/sell/PaymentSheet'
import api from '@/lib/api'
import type { Category, Product } from '@/types'

export default function RetailSell() {
  const { shift } = useAuthStore()
  const { items, addItem, clearCart, subtotal, taxType, setTaxType, calculateTaxByType, grandTotal } = useCartStore()
  const { storeSettings, fetchStoreSettings } = useConfigStore()

  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
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
      const { categories: cats, products: prods, variants } = response.data

      const productsWithVariants = prods.map((p: Product) => ({
        ...p,
        variants: variants.filter((v: { product_id: number }) => Number(v.product_id) === Number(p.id)),
      }))

      setCategories(cats)
      setProducts(productsWithVariants)
    } catch (error) {
      console.error('Failed to fetch menu:', error)
    }
  }

  const handleProductClick = (product: Product) => {
    const defaultVariant = product.variants.find((v) => v.is_default) || product.variants[0]
    if (defaultVariant) {
      addItem(product, defaultVariant)
    }
  }

  const handleCheckout = () => {
    setShowPayment(true)
  }

  const handlePayment = async (method: 'CASH' | 'CARD' | 'MOBILE', _amount: number) => {
    if (!shift) return

    setIsProcessing(true)
    try {
      // Create order
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

      // Process payment
      await api.post(`/orders/${order.uuid}/pay`, {
        shift_id: shift.id,
        terminal_uuid: 'default',
        method: method,
        amount: parseFloat(order.grand_total),
      })

      // Clear cart after successful payment
      clearCart()
    } catch (error) {
      console.error('Payment failed:', error)
      throw error
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePaymentClose = () => {
    setShowPayment(false)
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

      {/* Payment Sheet */}
      {showPayment && (
        <PaymentSheet
          total={total}
          subtotal={currentSubtotal}
          taxLines={taxInfo.lines.map(l => ({ name: l.name, amount: l.amount }))}
          onClose={handlePaymentClose}
          onPayment={handlePayment}
        />
      )}
    </div>
  )
}
