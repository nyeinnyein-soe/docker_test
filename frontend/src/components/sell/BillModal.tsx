import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { X, Receipt, Loader2 } from 'lucide-react'
import api from '@/lib/api'
import type { Order } from '@/types'

interface BillModalProps {
  tableSessionId: number
  tableName: string
  onClose: () => void
  onPay: (total: number, subtotal: number, taxLines: { name: string; amount: number }[]) => void
}

export default function BillModal({ tableSessionId, tableName, onClose, onPay }: BillModalProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdatingTax, setIsUpdatingTax] = useState(false)
  const [taxType, setTaxType] = useState<string>('NONE')

  useEffect(() => {
    fetchOrders()
  }, [tableSessionId])

  const fetchOrders = async () => {
    setIsLoading(true)
    try {
      const response = await api.get('/orders')
      // Filter orders for this table session
      const sessionOrders = (response.data.data || []).filter(
        (order: Order) => order.table_session_id === tableSessionId && order.payment_status !== 'PAID'
      )
      setOrders(sessionOrders)

      // Default to the tax type of the first order
      if (sessionOrders.length > 0) {
        setTaxType(sessionOrders[0].tax_type)
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateTaxType = async (newType: string) => {
    setTaxType(newType)
    setIsUpdatingTax(true)
    try {
      // Update all orders in the session with the new tax type
      await Promise.all(
        orders.map(order => api.patch(`/orders/${order.uuid}/tax`, { tax_type: newType }))
      )
      await fetchOrders()
    } catch (error) {
      console.error('Failed to update tax type:', error)
    } finally {
      setIsUpdatingTax(false)
    }
  }

  const subtotal = orders.reduce((sum, order) => sum + parseFloat(order.subtotal), 0)
  // ... (rest of total calculations)
  const totalTax = orders.reduce((sum, order) => sum + parseFloat(order.total_tax), 0)
  const totalDiscount = orders.reduce((sum, order) => sum + parseFloat(order.total_discount), 0)
  const total = orders.reduce((sum, order) => sum + parseFloat(order.grand_total), 0)

  // Aggregate tax lines
  const taxLines: { name: string; amount: number }[] = []
  orders.forEach(order => {
    if (order.tax_lines && order.tax_lines.length > 0) {
      order.tax_lines.forEach(tl => {
        const existing = taxLines.find(l => l.name === tl.tax_name)
        if (existing) {
          existing.amount += parseFloat(tl.tax_amount)
        } else {
          taxLines.push({ name: tl.tax_name, amount: parseFloat(tl.tax_amount) })
        }
      })
    } else if (parseFloat(order.total_tax) > 0) {
      const existing = taxLines.find(l => l.name === 'Tax')
      if (existing) {
        existing.amount += parseFloat(order.total_tax)
      } else {
        taxLines.push({ name: 'Tax', amount: parseFloat(order.total_tax) })
      }
    }
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-xl font-bold">Bill - {tableName}</h2>
            <p className="text-sm text-muted-foreground">{orders.length} order(s)</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Orders List */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No orders found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="border rounded-lg p-4 bg-secondary/10">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-primary">Order #{order.order_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.items?.length || 0} items
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(order.grand_total)}</p>
                      {parseFloat(order.total_tax) > 0 && (
                        <p className="text-[10px] text-muted-foreground">Incl. {formatCurrency(order.total_tax)} tax</p>
                      )}
                    </div>
                  </div>
                  <div className="text-sm space-y-1">
                    {order.items?.slice(0, 5).map((item) => (
                      <div key={item.id} className="flex flex-col">
                        <div className="flex justify-between">
                          <span className="font-medium">
                            {item.quantity}x {item.variant?.name || 'Item'}
                          </span>
                          <span>{formatCurrency(item.total_line_amount)}</span>
                        </div>
                        {item.modifiers && item.modifiers.length > 0 && (
                          <div className="pl-4 flex flex-wrap gap-x-2 gap-y-0.5 opacity-70 text-[11px]">
                            {item.modifiers.map((m: any) => (
                              <span key={m.id}>+ {m.modifier?.name || 'Modifier'}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {order.items && order.items.length > 5 && (
                      <p className="text-muted-foreground text-xs pt-1">
                        +{order.items.length - 5} more items
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Total Breakdown */}
        <div className="border-t p-4 space-y-4 bg-secondary/5">
          {/* Tax Type Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Tax Selection
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'NONE', label: 'No Tax' },
                { value: 'COMMERCIAL', label: 'Comm. Tax' },
                { value: 'SERVICE', label: 'Service Chg.' },
                { value: 'BOTH', label: 'Both' },
              ].map((opt) => (
                <Button
                  key={opt.value}
                  variant={taxType === opt.value ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs h-9"
                  disabled={isUpdatingTax || isLoading}
                  onClick={() => handleUpdateTaxType(opt.value)}
                >
                  {isUpdatingTax && taxType === opt.value ? (
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  ) : null}
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {taxLines.map((line, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{line.name}</span>
                <span className="text-primary">+{formatCurrency(line.amount)}</span>
              </div>
            ))}
            {totalDiscount > 0 && (
              <div className="flex justify-between text-sm text-destructive font-medium">
                <span>Discounts</span>
                <span>-{formatCurrency(totalDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-lg pt-2 border-t mt-2">
              <span className="font-bold">Grand Total</span>
              <span className="text-2xl font-black text-primary">
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          <Button
            size="lg"
            className="w-full mt-4 h-14 text-lg"
            onClick={() => onPay(total, subtotal, taxLines)}
            disabled={isLoading || orders.length === 0 || total === 0}
          >
            Process Payment
          </Button>
        </div>
      </Card>
    </div>
  )
}
