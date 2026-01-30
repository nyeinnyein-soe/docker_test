import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import ProductGrid from '@/components/sell/ProductGrid'
import Cart from '@/components/sell/Cart'
import PaymentSheet from '@/components/sell/PaymentSheet'
import ModifierModal from '@/components/sell/ModifierModal'
import BillModal from '@/components/sell/BillModal'
import FloorMap from '@/components/sell/FloorMap'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Users, Receipt } from 'lucide-react'
import api from '@/lib/api'
import type { Category, Product, Floor, Table, ProductVariant, Modifier } from '@/types'

type View = 'floor' | 'order'

export default function RestaurantSell() {
  const { shift } = useAuthStore()
  const { items, addItem, clearCart, setTableSession, setOrderType } = useCartStore()

  const [view, setView] = useState<View>('floor')
  const [floors, setFloors] = useState<Floor[]>([])
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null)
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [taxGroups, setTaxGroups] = useState<TaxGroup[]>([])
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

  useEffect(() => {
    fetchFloors()
    fetchMenu()
  }, [])

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
      const { categories: cats, products: prods, variants, modifier_groups, modifiers, tax_groups } = response.data

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
      setTaxGroups(tax_groups || [])
    } catch (error) {
      console.error('Failed to fetch menu:', error)
    }
  }

  const handleTableSelect = async (table: Table) => {
    setSelectedTable(table)

    if (table.status === 'AVAILABLE') {
      // Open new session
      try {
        const response = await api.post('/floor/sessions', {
          table_id: table.id,
          guest_count: guestCount,
        })
        const session = response.data.data || response.data
        if (session) {
          setTableSession(session.id)
          setCurrentSessionId(session.id)
          setOrderType('DINE_IN')
          setView('order')
          fetchFloors() // Refresh floor status
        }
      } catch (error) {
        console.error('Failed to open table:', error)
        alert('Failed to open table session. Please try again.')
      }
    } else if (table.active_session) {
      // Continue existing session
      setTableSession(table.active_session.id)
      setCurrentSessionId(table.active_session.id)
      setOrderType('DINE_IN')
      setView('order')
    }
  }

  const handleBackToFloor = () => {
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
    if (!shift || !currentSessionId || items.length === 0) return

    setIsProcessing(true)
    try {
      const orderItems = items.map((item) => ({
        variant_id: item.variant.id,
        quantity: item.quantity,
        modifiers: item.modifiers.map(m => m.id),
        notes: item.notes,
      }))

      await api.post('/orders', {
        shift_id: shift.id,
        type: 'DINE_IN',
        table_session_id: currentSessionId,
        items: orderItems,
      })

      // Clear cart after adding order, but stay on order view
      clearCart()
    } catch (error) {
      console.error('Failed to add order:', error)
      alert('Failed to add order. Please try again.')
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

      // Close table session after all orders are paid
      if (selectedTable.active_session) {
        await api.put(`/floor/sessions/${selectedTable.active_session.uuid}/close`)
      }

      clearCart()
      setView('floor')
      setSelectedTable(null)
      setCurrentSessionId(null)
      setShowPayment(false)
      fetchFloors()
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
      <div className="h-full flex">
        <div className="flex-1">
          <FloorMap
            floors={floors}
            selectedFloor={selectedFloor}
            onFloorSelect={setSelectedFloor}
            onTableSelect={handleTableSelect}
          />
        </div>

        {/* Guest count selector */}
        <div className="w-64 border-l bg-white p-4">
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
    <div className="h-full flex flex-col">
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
        <Button variant="outline" onClick={handleShowBill}>
          <Receipt className="w-4 h-4 mr-2" />
          Bill
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
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
            onCheckout={handleAddOrder}
            isProcessing={isProcessing}
            checkoutLabel="Add Order"
            taxGroups={taxGroups}
          />
        </div>
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
    </div>
  )
}
