import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const { login, isLoading, error, clearError } = useAuthStore()

  const [email, setEmail] = useState('manager@example.com')
  const [pin, setPin] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

    const success = await login(email, pin)
    if (success) {
      navigate('/')
    }
  }

  const handlePinInput = (digit: string) => {
    if (pin.length < 4) {
      setPin(pin + digit)
    }
  }

  const handlePinClear = () => {
    setPin('')
  }

  const handlePinBackspace = () => {
    setPin(pin.slice(0, -1))
  }

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">POS Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="employee@store.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">PIN</label>
              <div className="flex justify-center gap-3 mb-4">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`w-12 h-14 border-2 rounded-lg flex items-center justify-center text-2xl font-bold ${pin[i] ? 'border-primary bg-primary/5' : 'border-input'
                      }`}
                  >
                    {pin[i] ? '•' : ''}
                  </div>
                ))}
              </div>

              {/* Number pad */}
              <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map(
                  (key) => (
                    <Button
                      key={key}
                      type="button"
                      variant={key === 'C' ? 'destructive' : 'secondary'}
                      size="lg"
                      className="h-14 text-xl font-semibold"
                      onClick={() => {
                        if (key === 'C') handlePinClear()
                        else if (key === '⌫') handlePinBackspace()
                        else handlePinInput(key)
                      }}
                    >
                      {key}
                    </Button>
                  )
                )}
              </div>
            </div>

            {error && (
              <div className="text-destructive text-sm text-center bg-destructive/10 p-3 rounded-lg">
                {error}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isLoading || !email || pin.length < 4}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
