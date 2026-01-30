import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import ProductGrid from '@/components/sell/ProductGrid'
import Cart from '@/components/sell/Cart'
import PaymentSheet from '@/components/sell/PaymentSheet'
import api from '@/lib/api'
import type { Category, Product, TaxGroup } from '@/types'

export default function RetailSell() {
  const { shift } = useAuthStore()
  const { items, addItem, clearCart, subtotal } = useCartStore()

  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [taxGroups, setTaxGroups] = useState<TaxGroup[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [showPayment, setShowPayment] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    fetchMenu()
  }, [])

  const fetchMenu = async () => {
    try {
      const response = await api.get('/sync/menu')
      const { categories: cats, products: prods, variants, tax_groups } = response.data

      const productsWithVariants = prods.map((p: Product) => ({
        ...p,
        variants: variants.filter((v: { product_id: number }) => Number(v.product_id) === Number(p.id)),
      }))

      setCategories(cats)
      setProducts(productsWithVariants)
      setTaxGroups(tax_groups || [])
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
        items: orderItems,
      })

      const order = orderResponse.data.data

      // Get terminal (use first available)
      const terminalResponse = await api.get('/sync/menu')
      const terminal = terminalResponse.data?.terminal || { uuid: 'default' }

      // Process payment
      await api.post(`/orders/${order.uuid}/pay`, {
        shift_id: shift.id,
        terminal_uuid: terminal.uuid || 'default',
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
          taxGroups={taxGroups}
        />
      </div>

      {/* Payment Sheet */}
      {showPayment && (
        <PaymentSheet
          total={grandTotal(taxGroups)}
          subtotal={subtotal()}
          taxLines={calculateTax(taxGroups).lines}
          onClose={handlePaymentClose}
          onPayment={handlePayment}
        />
      )}
    </div>
  )
}
