import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { X, Banknote, CreditCard, Smartphone, Check, Loader2 } from 'lucide-react'
import NumPad from '@/components/common/NumPad'
import type { TaxGroup } from '@/types'

type PaymentMethod = 'CASH' | 'CARD' | 'MOBILE'

interface PaymentSheetProps {
  total: number
  subtotal?: number
  taxLines?: { name: string; amount: number }[]
  onClose: () => void
  onPayment: (method: PaymentMethod, amount: number) => Promise<void>
}

export default function PaymentSheet({ total, subtotal, taxLines = [], onClose, onPayment }: PaymentSheetProps) {
  const [method, setMethod] = useState<PaymentMethod>('CASH')
  const [amount, setAmount] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const paymentAmount = amount ? parseFloat(amount) : total
  const change = method === 'CASH' ? Math.max(0, paymentAmount - total) : 0

  const handlePayment = async () => {
    setIsProcessing(true)
    try {
      await onPayment(method, method === 'CASH' ? paymentAmount : total)
      setIsComplete(true)
    } catch (error) {
      console.error('Payment failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleNumInput = (digit: string) => {
    setAmount((prev) => prev + digit)
  }

  const handleClear = () => setAmount('')
  const handleBackspace = () => setAmount((prev) => prev.slice(0, -1))

  if (isComplete) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Payment Complete</h2>
          {change > 0 && (
            <p className="text-lg text-muted-foreground mb-4">
              Change: <span className="font-bold text-foreground">{formatCurrency(change)}</span>
            </p>
          )}
          <Button onClick={onClose} size="lg" className="w-full">
            Done
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
      <Card className="w-full max-w-lg rounded-b-none rounded-t-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">Payment</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-6 h-6" />
          </Button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto">
          {/* Summary */}
          <div className="bg-secondary/20 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal || total)}</span>
            </div>
            {taxLines.map((line, i) => (
              <div key={i} className="flex justify-between text-xs text-muted-foreground">
                <span>{line.name}</span>
                <span>{formatCurrency(line.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-2 mt-2 border-t border-black/5">
              <p className="font-semibold">Total Amount</p>
              <p className="text-3xl font-black text-primary">{formatCurrency(total)}</p>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'CASH' as const, label: 'Cash', icon: Banknote },
              { id: 'CARD' as const, label: 'Card', icon: CreditCard },
              { id: 'MOBILE' as const, label: 'Mobile', icon: Smartphone },
            ].map((m) => (
              <Button
                key={m.id}
                variant={method === m.id ? 'default' : 'outline'}
                className="flex-col h-20 gap-1"
                onClick={() => {
                  setMethod(m.id)
                  setAmount('')
                }}
              >
                <m.icon className="w-6 h-6" />
                <span className="text-xs">{m.label}</span>
              </Button>
            ))}
          </div>

          {/* Cash Amount Entry */}
          {method === 'CASH' && (
            <div className="space-y-3">
              <div className="bg-secondary/50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">Amount Received</p>
                <p className="text-3xl font-bold">
                  {amount ? formatCurrency(parseFloat(amount)) : formatCurrency(total)}
                </p>
                {change > 0 && (
                  <p className="text-success font-medium mt-1">
                    Change: {formatCurrency(change)}
                  </p>
                )}
              </div>

              {/* Quick amounts */}
              <div className="grid grid-cols-4 gap-2">
                {[total, Math.ceil(total / 1000) * 1000, Math.ceil(total / 5000) * 5000, Math.ceil(total / 10000) * 10000].map((value, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(String(value))}
                  >
                    {formatCurrency(value)}
                  </Button>
                ))}
              </div>

              <NumPad
                onInput={handleNumInput}
                onClear={handleClear}
                onBackspace={handleBackspace}
              />
            </div>
          )}

          {/* Card/Mobile - Simple confirmation */}
          {method !== 'CASH' && (
            <div className="bg-secondary/50 rounded-lg p-6 text-center">
              <p className="text-muted-foreground mb-2">
                {method === 'CARD' ? 'Tap or insert card' : 'Scan QR code'}
              </p>
              <p className="text-2xl font-bold">{formatCurrency(total)}</p>
            </div>
          )}

          {/* Pay Button */}
          <Button
            size="lg"
            className="w-full h-14 text-lg"
            onClick={handlePayment}
            disabled={isProcessing || (method === 'CASH' && paymentAmount < total)}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay ${formatCurrency(method === 'CASH' ? paymentAmount : total)}`
            )}
          </Button>
        </div>
      </Card>
    </div>
  )
}
