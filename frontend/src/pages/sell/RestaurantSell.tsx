import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { useConfigStore } from '@/stores/config'
import ProductGrid from '@/components/sell/ProductGrid'
import Cart from '@/components/sell/Cart'
import PaymentSheet from '@/components/sell/PaymentSheet'
import ModifierModal from '@/components/sell/ModifierModal'
import BillModal from '@/components/sell/BillModal'
import FloorMap from '@/components/sell/FloorMap'
import AlertModal from '@/components/common/AlertModal'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Users, Receipt, ShoppingBag, X, ChevronUp } from 'lucide-react'
import api from '@/lib/api'
import { cn, formatCurrency } from '@/lib/utils'
import type { Category, Product, Floor, Table, ProductVariant, Modifier } from '@/types'

type View = 'floor' | 'order'

export default function RestaurantSell() {
  const { shift } = useAuthStore()
  const { items, addItem, clearCart, setTableSession, setOrderType, taxType, setTaxType, subtotal, grandTotal, calculateTaxByType, itemCount } = useCartStore()
  const { storeSettings, fetchStoreSettings } = useConfigStore()

  const [view, setView] = useState<View>('floor')
  const [floors, setFloors] = useState<Floor[]>([])
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null)
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [showPayment, setShowPayment] = useState(false)
  const [showBill, setShowBill] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [guestCount, setGuestCount] = useState(2)
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [billTotal, setBillTotal] = useState(0)
  const [billSubtotal, setBillSubtotal] = useState(0)
  const [billTaxLines, setBillTaxLines] = useState<{ name: string; amount: number }[]>([])
  const [alertModal, setAlertModal] = useState<{ open: boolean; title: string; message: string; variant: 'error' | 'success' | 'info' }>({
    open: false,
    title: '',
    message: '',
    variant: 'error',
  })
  const [showMobileCart, setShowMobileCart] = useState(false)

  useEffect(() => {
    fetchFloors()
    fetchMenu()
    fetchStoreSettings()
  }, [])

  // Set default tax type from store settings
  useEffect(() => {
    if (storeSettings && taxType === 'NONE') {
      setTaxType(storeSettings.default_tax_type)
    }
  }, [storeSettings])

  const fetchFloors = async () => {
    try {
      const response = await api.get('/floor')
      // Backend returns { data: [...] } where data is array of floors
      const floorsData = response.data.data || response.data.sections || []
      const floorsArray = Array.isArray(floorsData) ? floorsData : []
      setFloors(floorsArray)
      if (floorsArray.length > 0 && !selectedFloor) {
        setSelectedFloor(floorsArray[0].id)
      }
    } catch (error) {
      console.error('Failed to fetch floors:', error)
      setFloors([])
    }
  }

  const fetchMenu = async () => {
    try {
      const response = await api.get('/sync/menu')
      const { categories: cats, products: prods, variants, modifier_groups, modifiers } = response.data

      // Map modifiers to groups
      const groupsWithModifiers = (modifier_groups || []).map((g: any) => ({
        ...g,
        modifiers: (modifiers || []).filter((m: any) => Number(m.group_id) === Number(g.id)),
      }))

      const productsWithVariants = prods.map((p: Product) => {
        // Find which modifier groups belong to this product
        const productGroups = groupsWithModifiers.filter((g: any) =>
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

  const handleTableSelect = (table: Table) => {
    if (table.status === 'AVAILABLE') {
      // Just select the table - session will be created when first order is placed
      setSelectedTable(table)
      setTableSession(null)
      setCurrentSessionId(null)
      setOrderType('DINE_IN')
      setView('order')
    } else if (table.active_session) {
      // Continue existing session
      setSelectedTable(table)
      setTableSession(table.active_session.id)
      setCurrentSessionId(table.active_session.id)
      setOrderType('DINE_IN')
      setView('order')
    }
  }

  const handleBackToFloor = async () => {
    // Refresh floor data to get latest order counts
    await fetchFloors()

    setView('floor')
    setSelectedTable(null)
    setCurrentSessionId(null)
    clearCart()
  }

  const handleProductClick = (product: Product) => {
    // Always open modifier modal for dine-in mode (same as cafe mode)
    // This allows selecting variants and modifiers
    setSelectedProduct(product)
  }

  const handleAddWithModifiers = (
    variant: ProductVariant,
    modifiers: Modifier[],
    quantity: number,
    notes: string
  ) => {
    if (!selectedProduct) return

    // Add to cart with selected variant, modifiers, and quantity
    addItem(selectedProduct, variant, modifiers, quantity, notes)
    setSelectedProduct(null)
  }

  const handleAddOrder = async () => {
    if (!shift || !selectedTable || items.length === 0) return

    setIsProcessing(true)
    try {
      let sessionId = currentSessionId

      // If no session exists yet, create one now
      if (!sessionId) {
        const response = await api.post('/floor/sessions', {
          table_id: selectedTable.id,
          guest_count: guestCount,
        })
        const session = response.data.data || response.data
        sessionId = session.id

        // Update state with the new session
        setCurrentSessionId(session.id)
        setTableSession(session.id)
        setSelectedTable({
          ...selectedTable,
          status: 'OCCUPIED',
          active_session: {
            id: session.id,
            uuid: session.uuid,
            table_id: selectedTable.id,
            status: 'ACTIVE',
            guest_count: guestCount,
          },
        })
        fetchFloors() // Refresh floor status
      }

      const orderItems = items.map((item) => ({
        variant_id: item.variant.id,
        quantity: item.quantity,
        modifiers: item.modifiers.map(m => m.id),
        notes: item.notes,
      }))

      await api.post('/orders', {
        shift_id: shift.id,
        type: 'DINE_IN',
        tax_type: taxType,
        table_session_id: sessionId,
        items: orderItems,
      })

      // Refresh floor data to update order count on table
      fetchFloors()

      // Clear cart after adding order, but stay on order view
      clearCart()
    } catch (error) {
      console.error('Failed to add order:', error)
      setAlertModal({
        open: true,
        title: 'Error',
        message: 'Failed to add order. Please try again.',
        variant: 'error',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleShowBill = () => {
    setShowBill(true)
  }

  const handlePayBill = async (total: number, subtotal: number, taxLines: { name: string; amount: number }[]) => {
    setBillTotal(total)
    setBillSubtotal(subtotal)
    setBillTaxLines(taxLines)
    setShowBill(false)
    setShowPayment(true)
  }

  const handlePayment = async (method: 'CASH' | 'CARD' | 'MOBILE', _amount: number) => {
    if (!shift || !currentSessionId || !selectedTable) return

    setIsProcessing(true)
    try {
      // Get all unpaid orders for this session
      const ordersResponse = await api.get('/orders')
      const sessionOrders = (ordersResponse.data.data || []).filter(
        (order: { table_session_id: number; payment_status: string }) =>
          order.table_session_id === currentSessionId && order.payment_status !== 'PAID'
      )

      // Process payment for each order
      for (const order of sessionOrders) {
        await api.post(`/orders/${order.uuid}/pay`, {
          shift_id: shift.id,
          terminal_uuid: 'default',
          method: method,
          amount: parseFloat(order.grand_total),
        })
      }

      // Note: Backend automatically closes the table session when the last order is paid
      // via autoCloseTableSessionIfAllPaid in PayOrder action.

      // Refresh floor data before showing floor view
      await fetchFloors()

      clearCart()
      setView('floor')
      setSelectedTable(null)
      setCurrentSessionId(null)
      setShowPayment(false)
    } catch (error) {
      console.error('Payment failed:', error)
      throw error
    } finally {
      setIsProcessing(false)
    }
  }

  // Floor view
  if (view === 'floor') {
    return (
      <div className="h-full flex flex-col md:flex-row overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <FloorMap
            floors={floors}
            selectedFloor={selectedFloor}
            onFloorSelect={setSelectedFloor}
            onTableSelect={handleTableSelect}
          />
        </div>

        {/* Guest count selector */}
        <div className="w-full md:w-64 border-t md:border-t-0 md:border-l bg-white p-4 overflow-y-auto">
          <h3 className="font-semibold mb-4">New Table</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Guests</label>
              <div className="flex items-center gap-2 mt-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                >
                  -
                </Button>
                <div className="flex-1 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Users className="w-5 h-5" />
                    <span className="text-2xl font-bold">{guestCount}</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setGuestCount(guestCount + 1)}
                >
                  +
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Select an available table to start a new order
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Order view
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Table header */}
      <div className="bg-white border-b px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBackToFloor}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="font-semibold">{selectedTable?.name}</h2>
            <p className="text-sm text-muted-foreground">
              {selectedTable?.active_session?.guest_count || guestCount} guests
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleShowBill}
          disabled={!currentSessionId}
        >
          <Receipt className="w-4 h-4 mr-2" />
          Bill
        </Button>
      </div>

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
            onCheckout={handleAddOrder}
            isProcessing={isProcessing}
            checkoutLabel="Add Order"
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
                  handleAddOrder()
                  setShowMobileCart(false)
                }}
                isProcessing={isProcessing}
                checkoutLabel="Add Order"
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

      {/* Modifier Modal */}
      {selectedProduct && (
        <ModifierModal
          product={selectedProduct}
          modifierGroups={selectedProduct.modifier_groups || []}
          onClose={() => setSelectedProduct(null)}
          onAdd={handleAddWithModifiers}
        />
      )}

      {/* Bill Modal */}
      {showBill && currentSessionId && selectedTable && (
        <BillModal
          tableSessionId={currentSessionId}
          tableName={selectedTable.name}
          onClose={() => setShowBill(false)}
          onPay={handlePayBill}
        />
      )}

      {/* Payment Sheet */}
      {showPayment && (
        <PaymentSheet
          total={billTotal}
          subtotal={billSubtotal}
          taxLines={billTaxLines}
          onClose={() => {
            setShowPayment(false)
            setBillTotal(0)
            setBillSubtotal(0)
            setBillTaxLines([])
          }}
          onPayment={handlePayment}
        />
      )}

      {/* Alert Modal */}
      <AlertModal
        open={alertModal.open}
        onOpenChange={(open) => setAlertModal({ ...alertModal, open })}
        title={alertModal.title}
        message={alertModal.message}
        variant={alertModal.variant}
      />
    </div>
  )
}
