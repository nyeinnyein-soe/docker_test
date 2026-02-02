import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useConfigStore, type PosMode } from '@/stores/config'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ShoppingBag, Coffee, UtensilsCrossed, ArrowRight, ArrowLeft, Check, Loader2 } from 'lucide-react'

const modes: { id: PosMode; name: string; description: string; icon: React.ReactNode }[] = [
  {
    id: 'RETAIL',
    name: 'Retail',
    description: 'Simple product grid with quick checkout. Best for shops and stores.',
    icon: <ShoppingBag className="w-8 h-8" />,
  },
  {
    id: 'CAFE',
    name: 'Cafe / QSR',
    description: 'Products with modifiers and customizations. Best for coffee shops and fast food.',
    icon: <Coffee className="w-8 h-8" />,
  },
  {
    id: 'RESTAURANT',
    name: 'Restaurant',
    description: 'Floor plan with table management and kitchen display. Best for full-service dining.',
    icon: <UtensilsCrossed className="w-8 h-8" />,
  },
]

export default function SetupWizard() {
  const navigate = useNavigate()
  const { posMode, businessName, setMode, setBusinessName, completeSetup, saveConfig, isLoading } = useConfigStore()

  const [step, setStep] = useState(1)
  const [localBusinessName, setLocalBusinessName] = useState(businessName || '')

  const handleModeSelect = (mode: PosMode) => {
    setMode(mode)
  }

  const handleNext = () => {
    if (step === 1 && posMode) {
      setStep(2)
    } else if (step === 2 && localBusinessName.trim()) {
      setBusinessName(localBusinessName.trim())
      setStep(3)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleComplete = async () => {
    completeSetup()
    try {
      await saveConfig()
    } catch {
      // Config will be saved locally anyway
    }
    navigate('/open-shift', { replace: true })
  }

  return (
    <div className="h-[100dvh] flex flex-col items-center justify-center bg-secondary/10 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to POS</CardTitle>
          <CardDescription>
            {step === 1 && "Let's set up your point of sale system"}
            {step === 2 && 'Tell us about your business'}
            {step === 3 && "You're all set!"}
          </CardDescription>
          {/* Progress indicator */}
          <div className="flex justify-center gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-3 h-3 rounded-full transition-colors ${s === step ? 'bg-primary' : s < step ? 'bg-primary/50' : 'bg-secondary'
                  }`}
              />
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Mode Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-center mb-4">Select your business type</h3>
              <div className="grid gap-4">
                {modes.map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => handleModeSelect(mode.id)}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${posMode === mode.id
                        ? 'border-primary bg-primary/5'
                        : 'border-input hover:border-primary/50'
                      }`}
                  >
                    <div className={`p-3 rounded-lg ${posMode === mode.id ? 'bg-primary text-white' : 'bg-secondary'}`}>
                      {mode.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{mode.name}</h4>
                      <p className="text-sm text-muted-foreground">{mode.description}</p>
                    </div>
                    {posMode === mode.id && (
                      <Check className="w-6 h-6 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Business Name */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-center mb-4">What's your business name?</h3>
              <Input
                type="text"
                placeholder="My Business"
                value={localBusinessName}
                onChange={(e) => setLocalBusinessName(e.target.value)}
                className="text-center text-xl h-14"
                autoFocus
              />
              <p className="text-sm text-muted-foreground text-center">
                This will appear on receipts and reports
              </p>
            </div>
          )}

          {/* Step 3: Complete */}
          {step === 3 && (
            <div className="text-center space-y-4 py-8">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-xl font-semibold">Setup Complete!</h3>
              <p className="text-muted-foreground">
                Your POS is configured as <strong>{modes.find(m => m.id === posMode)?.name}</strong> for <strong>{localBusinessName}</strong>
              </p>
              <p className="text-sm text-muted-foreground">
                You can change these settings anytime from the Settings menu.
              </p>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3 pt-4">
            {step > 1 && (
              <Button variant="outline" onClick={handleBack} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            {step < 3 ? (
              <Button
                onClick={handleNext}
                className="flex-1"
                disabled={
                  (step === 1 && !posMode) ||
                  (step === 2 && !localBusinessName.trim())
                }
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleComplete} className="flex-1" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
