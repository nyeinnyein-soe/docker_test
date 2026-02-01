import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatTime } from '@/lib/utils'
import { Search, X, Receipt, RefreshCw } from 'lucide-react'
import PaymentSheet from '@/components/sell/PaymentSheet'
import api from '@/lib/api'
import type { Order } from '@/types'

type FilterStatus = 'all' | 'active' | 'completed' | 'voided'

export default function Orders() {
  const { shift } = useAuthStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showPayment, setShowPayment] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setIsLoading(true)
    try {
      const response = await api.get('/orders')
      setOrders(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePayOrder = (_order: Order) => {
    setShowPayment(true)
  }

  const handlePayment = async (method: 'CASH' | 'CARD' | 'MOBILE', _amount: number) => {
    if (!shift || !selectedOrder) return

    setIsProcessing(true)
    try {
      await api.post(`/orders/${selectedOrder.uuid}/pay`, {
        shift_id: shift.id,
        terminal_uuid: 'default',
        method: method,
        amount: parseFloat(selectedOrder.grand_total),
      })

      // If this is a DINE_IN order with a table session, check if we should close the session
      if (selectedOrder.type === 'DINE_IN' && selectedOrder.table_session_id) {
        // Check if there are any remaining unpaid orders for this session
        const ordersResponse = await api.get('/orders')
        const sessionOrders = (ordersResponse.data.data || []).filter(
          (order: Order) =>
            order.table_session_id === selectedOrder.table_session_id &&
            order.payment_status !== 'PAID' &&
            order.uuid !== selectedOrder.uuid // Exclude current order (just paid)
        )

        // If no more unpaid orders, close the table session
        if (sessionOrders.length === 0) {
          try {
            // Get table session UUID from the floor data
            const floorResponse = await api.get('/floor')
            const floors = floorResponse.data.data || []
            for (const floor of floors) {
              for (const table of floor.tables || []) {
                if (table.active_session?.id === selectedOrder.table_session_id) {
                  await api.put(`/floor/sessions/${table.active_session.uuid}/close`)
                  break
                }
              }
            }
          } catch (sessionError) {
            console.error('Failed to close table session:', sessionError)
          }
        }
      }

      setShowPayment(false)
      fetchOrders()
      // Refresh selected order
      const response = await api.get(`/orders/${selectedOrder.uuid}`)
      setSelectedOrder(response.data.data)
    } catch (error) {
      console.error('Payment failed:', error)
      throw error
    } finally {
      setIsProcessing(false)
    }
  }

  const handleVoidOrder = async (order: Order) => {
    if (!confirm(`Void order #${order.order_number}? This action cannot be undone.`)) return

    setIsProcessing(true)
    try {
      await api.post(`/orders/${order.uuid}/void`, {
        reason: 'Voided from orders page',
      })

      fetchOrders()
      setSelectedOrder(null)
    } catch (error) {
      console.error('Failed to void order:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const filteredOrders = orders.filter((order) => {
    // Filter by status
    if (filter === 'active' && !['OPEN', 'CONFIRMED', 'PREPARING'].includes(order.status)) {
      return false
    }
    if (filter === 'completed' && order.status !== 'COMPLETED') {
      return false
    }
    if (filter === 'voided' && !['VOIDED', 'REFUNDED'].includes(order.status)) {
      return false
    }

    // Filter by search
    if (searchQuery) {
      return order.order_number.toLowerCase().includes(searchQuery.toLowerCase())
    }

    return true
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
      case 'CONFIRMED':
      case 'PREPARING':
        return <Badge variant="warning">{status}</Badge>
      case 'COMPLETED':
        return <Badge variant="success">{status}</Badge>
      case 'VOIDED':
      case 'REFUNDED':
        return <Badge variant="destructive">{status}</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge variant="success">Paid</Badge>
      case 'PARTIALLY_PAID':
        return <Badge variant="warning">Partial</Badge>
      default:
        return <Badge variant="secondary">Unpaid</Badge>
    }
  }

  return (
    <div className="h-full flex">
      {/* Orders List */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-white space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Orders</h1>
            <Button variant="outline" size="sm" onClick={fetchOrders} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by order number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            {(['all', 'active', 'completed', 'voided'] as FilterStatus[]).map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredOrders.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No orders found</p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <Card
                key={order.id}
                className={`p-4 cursor-pointer transition-all ${
                  selectedOrder?.id === order.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedOrder(order)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">#{order.order_number}</span>
                      {getStatusBadge(order.status)}
                      {getPaymentBadge(order.payment_status)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {order.type} • {order.items?.length || 0} items
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(order.grand_total)}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatTime(order.created_at || new Date().toISOString())}
                    </p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Order Detail */}
      <div className="w-96 border-l bg-white">
        {selectedOrder ? (
          <div className="h-full flex flex-col">
            {/* Detail Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h2 className="font-bold">Order #{selectedOrder.order_number}</h2>
                <p className="text-sm text-muted-foreground">{selectedOrder.type}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(null)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="font-semibold mb-3">Items</h3>
              <div className="space-y-2">
                {selectedOrder.items?.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>
                      {item.quantity}x {item.variant?.name || 'Item'}
                    </span>
                    <span>{formatCurrency(item.total_line_amount)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t mt-4 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                {parseFloat(selectedOrder.total_tax) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Tax</span>
                    <span>{formatCurrency(selectedOrder.total_tax)}</span>
                  </div>
                )}
                {parseFloat(selectedOrder.total_discount) > 0 && (
                  <div className="flex justify-between text-sm text-success">
                    <span>Discount</span>
                    <span>-{formatCurrency(selectedOrder.total_discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span>{formatCurrency(selectedOrder.grand_total)}</span>
                </div>
              </div>

              {/* Payments */}
              {selectedOrder.payments && selectedOrder.payments.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h3 className="font-semibold mb-3">Payments</h3>
                  <div className="space-y-2">
                    {selectedOrder.payments.map((payment) => (
                      <div key={payment.id} className="flex justify-between text-sm">
                        <span>{payment.method}</span>
                        <span>{formatCurrency(payment.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-4 border-t space-y-2">
              {selectedOrder.payment_status === 'UNPAID' && selectedOrder.status !== 'VOIDED' && (
                <>
                  <Button
                    className="w-full"
                    onClick={() => handlePayOrder(selectedOrder)}
                    disabled={isProcessing}
                  >
                    Pay Now
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => handleVoidOrder(selectedOrder)}
                    disabled={isProcessing}
                  >
                    Void Order
                  </Button>
                </>
              )}
              {selectedOrder.status === 'COMPLETED' && (
                <Button variant="outline" className="w-full" disabled>
                  Print Receipt
                </Button>
              )}
              {selectedOrder.payment_status === 'PAID' && selectedOrder.status !== 'REFUNDED' && (
                <Button variant="destructive" className="w-full" disabled>
                  Refund Order
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Select an order to view details</p>
            </div>
          </div>
        )}
      </div>

      {/* Payment Sheet */}
      {showPayment && selectedOrder && (
        <PaymentSheet
          total={parseFloat(selectedOrder.grand_total)}
          onClose={() => setShowPayment(false)}
          onPayment={handlePayment}
        />
      )}
    </div>
  )
}
