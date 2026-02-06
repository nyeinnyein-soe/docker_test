import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { useConfigStore } from '@/stores/config'
import ProductGrid from '@/components/sell/ProductGrid'
import Cart from '@/components/sell/Cart'
import PaymentSheet from '@/components/sell/PaymentSheet'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import api from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import type { Category, Product } from '@/types'

export default function RetailSell() {
  const { shift } = useAuthStore()
  const { items, addItem, clearCart, subtotal, taxType, setTaxType, calculateTaxByType, grandTotal, itemCount, setOrderType } = useCartStore()
  const { storeSettings, fetchStoreSettings } = useConfigStore()

  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [showPayment, setShowPayment] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showMobileCart, setShowMobileCart] = useState(false)

  useEffect(() => {
    fetchMenu()
    fetchStoreSettings()
    setOrderType('TAKEOUT')
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
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 flex overflow-hidden relative">
        {/* Product Grid */}
        <div className="flex-1 border-r flex flex-col overflow-hidden">
          <ProductGrid
            categories={categories}
            products={products}
            selectedCategory={selectedCategory}
            onCategorySelect={setSelectedCategory}
            onProductClick={handleProductClick}
          />
        </div>

        {/* Desktop Cart */}
        <div className="hidden md:block w-80 lg:w-96 border-l bg-white">
          <Cart
            onCheckout={handleCheckout}
            isProcessing={isProcessing}
          />
        </div>

        {/* Mobile Cart Overlay */}
        {showMobileCart && (
          <div className="md:hidden fixed inset-0 z-50 bg-background flex flex-col animate-in slide-in-from-bottom-10">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold text-lg">Current Order</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowMobileCart(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <Cart
                onCheckout={() => {
                  handleCheckout()
                  setShowMobileCart(false)
                }}
                isProcessing={isProcessing}
              />
            </div>
          </div>
        )}
      </div>

      {/* Mobile Summary Bar */}
      {!showMobileCart && items.length > 0 && (
        <div className="md:hidden border-t bg-white p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <Button className="w-full flex items-center justify-between py-6" onClick={() => setShowMobileCart(true)}>
            <div className="flex items-center gap-2">
              <div className="bg-primary-foreground/20 rounded-full w-6 h-6 flex items-center justify-center text-xs text-primary-foreground font-bold">
                {itemCount()}
              </div>
              <span>View Order</span>
            </div>
            <span className="font-bold">{formatCurrency(grandTotal(storeSettings))}</span>
          </Button>
        </div>
      )}

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
