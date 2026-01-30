import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

export default function OpenShift() {
  const navigate = useNavigate()
  const { employee, openShift, isLoading, error, clearError } = useAuthStore()
  
  const [amount, setAmount] = useState('')

  const handleNumberInput = (digit: string) => {
    if (amount.length < 8) {
      setAmount(amount + digit)
    }
  }

  const handleClear = () => {
    setAmount('')
  }

  const handleBackspace = () => {
    setAmount(amount.slice(0, -1))
  }

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) < 0) {
      return
    }
    
    clearError()
    const startingCash = parseFloat(amount || '0')
    
    try {
      await openShift(startingCash)
      navigate('/app/sell', { replace: true })
    } catch (err) {
      // Error is handled by store
      console.error('Failed to open shift:', err)
    }
  }

  const displayAmount = amount ? parseFloat(amount) : 0

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Open Shift</CardTitle>
          <CardDescription>
            Welcome, {employee?.name}. Enter starting cash amount.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Amount display */}
          <div className="bg-secondary/50 rounded-xl p-6 text-center">
            <div className="text-sm text-muted-foreground mb-1">Starting Cash</div>
            <div className="text-4xl font-bold">
              {formatCurrency(displayAmount)}
            </div>
          </div>

          {/* Number pad */}
          <div className="grid grid-cols-3 gap-3">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map(
              (key) => (
                <Button
                  key={key}
                  type="button"
                  variant={key === 'C' ? 'destructive' : 'secondary'}
                  size="lg"
                  className="h-14 text-xl font-semibold"
                  onClick={() => {
                    if (key === 'C') handleClear()
                    else if (key === '⌫') handleBackspace()
                    else handleNumberInput(key)
                  }}
                >
                  {key}
                </Button>
              )
            )}
          </div>

          {/* Quick amounts */}
          <div className="grid grid-cols-4 gap-2">
            {[0, 50000, 100000, 200000].map((value) => (
              <Button
                key={value}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount(String(value))}
              >
                {value === 0 ? '0' : `${(value / 1000)}K`}
              </Button>
            ))}
          </div>

          {error && (
            <div className="text-destructive text-sm text-center bg-destructive/10 p-3 rounded-lg">
              {error}
            </div>
          )}

          <Button
            onClick={handleSubmit}
            size="lg"
            className="w-full"
            disabled={isLoading || !amount || parseFloat(amount || '0') < 0}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" />
                Opening Shift...
              </>
            ) : (
              'Open Shift'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
