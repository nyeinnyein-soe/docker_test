import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatTime } from '@/lib/utils'
import { Clock, DollarSign, TrendingUp, AlertCircle, Loader2, X } from 'lucide-react'
import NumPad from '@/components/common/NumPad'

export default function Shift() {
  const navigate = useNavigate()
  const { employee, shift, shiftStats, closeShift, fetchCurrentShift, isLoading, error } = useAuthStore()
  
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [cashCount, setCashCount] = useState('')

  useEffect(() => {
    fetchCurrentShift()
  }, [])

  const handleCloseShift = async () => {
    if (!cashCount) return

    try {
      await closeShift(parseFloat(cashCount))
      navigate('/open-shift', { replace: true })
    } catch {
      // Error handled by store
    }
  }

  const handleNumInput = (digit: string) => {
    setCashCount((prev) => prev + digit)
  }

  const handleClear = () => setCashCount('')
  const handleBackspace = () => setCashCount((prev) => prev.slice(0, -1))

  if (!shift) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-warning" />
            <h2 className="text-xl font-bold mb-2">No Active Shift</h2>
            <p className="text-muted-foreground mb-4">
              You need to open a shift to start selling.
            </p>
            <Button onClick={() => navigate('/open-shift')}>
              Open Shift
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const startTime = new Date(shift.start_time || Date.now())
  const duration = Math.floor((Date.now() - startTime.getTime()) / 1000 / 60)
  const hours = Math.floor(duration / 60)
  const minutes = duration % 60

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Shift Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Current Shift
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-secondary/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Cashier</p>
              <p className="font-semibold">{employee?.name}</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="font-semibold">{hours}h {minutes}m</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Started At</p>
              <p className="font-semibold">{formatTime(shift.start_time || new Date().toISOString())}</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Starting Cash</p>
              <p className="font-semibold">{formatCurrency(shift.starting_cash)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cash Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Cash Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Starting Cash</span>
              <span className="font-semibold">{formatCurrency(shift.starting_cash)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Cash Sales</span>
              <span className="font-semibold text-success">
                +{formatCurrency(parseFloat(shift.expected_cash || '0') - parseFloat(shift.starting_cash))}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 text-lg">
              <span className="font-semibold">Expected Cash</span>
              <span className="font-bold">{formatCurrency(shift.expected_cash || shift.starting_cash)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Sales Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
            <div className="bg-secondary/50 rounded-lg p-4">
              <p className="text-2xl font-bold">{shiftStats?.orders_count ?? '--'}</p>
              <p className="text-sm text-muted-foreground">Orders (Receipts)</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-4">
              <p className="text-2xl font-bold">{shiftStats?.items_count ?? '--'}</p>
              <p className="text-sm text-muted-foreground">Items Sold</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-4">
              <p className="text-2xl font-bold">{shiftStats?.modifiers_count ?? '--'}</p>
              <p className="text-sm text-muted-foreground">Modifiers</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-4">
              <p className="text-2xl font-bold">
                {shiftStats ? formatCurrency(parseFloat(shiftStats.total_sales)) : '--'}
              </p>
              <p className="text-sm text-muted-foreground">Total Sales</p>
            </div>
          </div>

          {/* Detailed Stats */}
          {shiftStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Financials</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Tax Collected</span>
                    <span className="font-medium">{formatCurrency(parseFloat(shiftStats.total_tax))}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Discounts Given</span>
                    <span className="font-medium text-destructive">-{formatCurrency(parseFloat(shiftStats.total_discount))}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Payment Methods</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Cash</span>
                    <span className="font-medium">{formatCurrency(parseFloat(shiftStats.payments.cash))}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Card</span>
                    <span className="font-medium">{formatCurrency(parseFloat(shiftStats.payments.card))}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Other (QR/Mobile)</span>
                    <span className="font-medium">{formatCurrency(parseFloat(shiftStats.payments.other))}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Close Shift Button */}
      <Button
        variant="destructive"
        size="lg"
        className="w-full"
        onClick={() => setShowCloseModal(true)}
      >
        Close Shift
      </Button>

      {/* Close Shift Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-bold">Close Shift</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowCloseModal(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-4 space-y-4">
              <div className="bg-secondary/50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">Expected Cash</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(shift.expected_cash || shift.starting_cash)}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Count your cash drawer</label>
                <div className="bg-secondary/50 rounded-lg p-4 text-center mt-2">
                  <p className="text-3xl font-bold">
                    {cashCount ? formatCurrency(parseFloat(cashCount)) : formatCurrency(0)}
                  </p>
                </div>
              </div>

              <NumPad
                onInput={handleNumInput}
                onClear={handleClear}
                onBackspace={handleBackspace}
              />

              {error && (
                <div className="text-destructive text-sm text-center bg-destructive/10 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <Button
                size="lg"
                className="w-full"
                onClick={handleCloseShift}
                disabled={isLoading || !cashCount}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Closing...
                  </>
                ) : (
                  'Confirm & Close Shift'
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
