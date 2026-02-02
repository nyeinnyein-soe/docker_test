import { useCartStore } from '@/stores/cart'
import { useConfigStore, TAX_TYPE_OPTIONS } from '@/stores/config'
import { Button } from '@/components/ui/button'
import { formatCurrency, cn } from '@/lib/utils'
import { ShoppingCart, Plus, Minus, Trash2, ChevronDown } from 'lucide-react'
import type { TaxType } from '@/types'

interface CartProps {
  onCheckout: () => void
  isProcessing?: boolean
  checkoutLabel?: string
}

export default function Cart({
  onCheckout,
  isProcessing = false,
  checkoutLabel = 'Checkout',
}: CartProps) {
  const { items, updateQuantity, removeItem, clearCart, subtotal, itemCount, taxType, setTaxType, calculateTaxByType, orderType } = useCartStore()
  const { storeSettings } = useConfigStore()

  const taxInfo = calculateTaxByType(storeSettings)
  const currentSubtotal = subtotal()

  // Calculate total based on tax info
  const total = currentSubtotal + taxInfo.lines.reduce((sum, line) => {
    // Only add exclusive taxes to the total
    return line.isInclusive ? sum : sum + line.amount
  }, 0)

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Cart Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Cart</h2>
          <span className="text-sm text-muted-foreground">
            {itemCount()} items
          </span>
        </div>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {items.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Cart is empty</p>
            <p className="text-sm">Tap products to add them</p>
          </div>
        ) : (
          items.map((item) => {
            const itemBasePrice = parseFloat(String(item.variant.price)) || 0
            const itemModifiersPrice = (item.modifiers || []).reduce(
              (sum, m) => sum + (parseFloat(String(m.price_extra)) || 0),
              0
            )
            const itemTotalPrice = (itemBasePrice + itemModifiersPrice) * item.quantity

            return (
              <div
                key={item.id}
                className="flex flex-col gap-2 bg-secondary/30 rounded-lg p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{item.product.name}</h4>
                    {item.variant.name !== 'Default' && (
                      <p className="text-xs text-muted-foreground">{item.variant.name}</p>
                    )}
                    {item.modifiers.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {item.modifiers.map((m) => (
                          <span
                            key={m.id}
                            className="text-[10px] bg-white/50 px-1.5 py-0.5 rounded border border-black/5"
                          >
                            + {m.name}
                          </span>
                        ))}
                      </div>
                    )}
                    {item.notes && (
                      <p className="text-xs text-muted-foreground italic mt-1">"{item.notes}"</p>
                    )}
                    <p className="text-primary font-semibold text-sm mt-1">
                      {formatCurrency(itemTotalPrice)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive ml-1"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Cart Footer */}
      <div className="border-t p-4 space-y-3 bg-secondary/5">
        {/* Tax Selection - Only for immediate-pay modes (Takeout/Delivery) */}
        {orderType !== 'DINE_IN' && (
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">
              Tax Selection
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {TAX_TYPE_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  variant={taxType === option.value ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    "h-8 text-[10px] font-bold px-2",
                    taxType === option.value ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-white text-slate-600 border-slate-200"
                  )}
                  onClick={() => setTaxType(option.value)}
                >
                  {option.label.split(' ')[0]} {option.label.includes('Service') ? 'Srv.' : option.label.includes('Comm') ? 'Tax' : ''}
                  {option.value === 'NONE' && 'None'}
                  {option.value === 'BOTH' && 'Both'}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-1">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(currentSubtotal)}</span>
          </div>

          {taxInfo.lines.map((line, i) => (
            <div key={i} className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">
                {line.name} {line.isInclusive && '(incl.)'}
              </span>
              <span>{formatCurrency(line.amount)}</span>
            </div>
          ))}

          <div className="flex justify-between items-center pt-2 mt-2 border-t">
            <span className="font-semibold text-lg">Total</span>
            <span className="text-2xl font-bold text-primary">{formatCurrency(total)}</span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            onClick={clearCart}
            disabled={items.length === 0}
            className="flex-shrink-0"
          >
            Clear
          </Button>
          <Button
            className="flex-1"
            size="lg"
            onClick={onCheckout}
            disabled={items.length === 0 || isProcessing}
          >
            {isProcessing ? 'Processing...' : checkoutLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
