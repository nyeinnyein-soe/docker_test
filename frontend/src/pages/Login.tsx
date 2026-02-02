import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, KeyRound, ArrowRight, Delete, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Login() {
  const navigate = useNavigate()
  const { login, isLoading, error, clearError } = useAuthStore()

  const [email, setEmail] = useState('manager@example.com')
  const [pin, setPin] = useState('')

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (isLoading || !email || pin.length < 4) return

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

  // Trigger login automatically when 4 digits are entered
  if (pin.length === 4 && !isLoading && !error) {
    setTimeout(() => handleSubmit(), 300)
  }

  return (
    <div className="relative min-h-[100dvh] w-full flex items-center justify-center bg-slate-50 overflow-hidden font-sans no-select selection:bg-primary/20">
      {/* Dynamic Background Elements - Soft Light Theme */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            x: [0, 50, 0],
            y: [0, -30, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-100/40 blur-[100px]"
        />
        <motion.div
          animate={{
            scale: [1.1, 1, 1.1],
            x: [0, -40, 0],
            y: [0, 40, 0]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-emerald-50/50 blur-[100px]"
        />
        {/* Subtle texture */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[480px] px-6"
      >
        <Card className="border-slate-200/60 bg-white/90 backdrop-blur-xl shadow-[0_40px_100px_-20px_rgba(0,0,0,0.08)] rounded-[2.5rem] overflow-hidden border">
          <CardHeader className="pt-12 pb-8 text-center space-y-4">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
              className="mx-auto flex items-center justify-center gap-3 mb-2"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/20">
                <KeyRound className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-black tracking-tighter text-slate-900 uppercase">KRAKEN</span>
            </motion.div>

            <div className="space-y-1">
              <CardTitle className="text-4xl font-black tracking-tight text-slate-900">
                Secure Login
              </CardTitle>
              <p className="text-slate-500 text-sm font-semibold tracking-tight">Access your terminal securely</p>
            </div>
          </CardHeader>

          <CardContent className="pb-12 px-10 space-y-10">
            <form onSubmit={handleSubmit} className="space-y-10">
              {/* Email Input - Styled clean and modern */}
              <div className="space-y-4">
                <div className="relative group">
                  <Input
                    type="email"
                    placeholder="Enter Employee ID or Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-16 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-2xl px-6 transition-all group-hover:border-slate-300 focus:border-primary focus:ring-4 focus:ring-primary/10 text-lg font-medium shadow-none"
                  />
                </div>
              </div>

              {/* PIN Visualization */}
              <div className="space-y-10">
                <div className="flex justify-center gap-6">
                  {[0, 1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      initial={false}
                      animate={{
                        scale: pin[i] ? 1.05 : 1,
                        backgroundColor: pin[i] ? "var(--color-primary)" : "white",
                        borderColor: pin[i] ? "var(--color-primary)" : "var(--color-border)"
                      }}
                      className={cn(
                        "w-14 h-14 border-2 rounded-2xl flex items-center justify-center transition-all shadow-sm",
                      )}
                    >
                      <AnimatePresence mode="wait">
                        {pin[i] ? (
                          <motion.div
                            key="filled"
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            className="w-3.5 h-3.5 rounded-full bg-white shadow-sm"
                          />
                        ) : (
                          <motion.div
                            key="empty"
                            className="w-1 h-1 rounded-full bg-slate-200"
                          />
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>

                {/* Professional Numeric Pad */}
                <div className="grid grid-cols-3 gap-4">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map(
                    (key) => (
                      <Button
                        key={key}
                        type="button"
                        variant="ghost"
                        className={cn(
                          "h-16 text-2xl font-black rounded-2xl transition-all duration-200 shadow-none",
                          "bg-slate-50/50 border border-slate-100/50 text-slate-700",
                          "hover:bg-primary hover:text-white hover:border-primary hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 active:scale-95 active:translate-y-0",
                          key === 'C' && "text-rose-500 hover:bg-rose-500 hover:text-white hover:border-rose-500 hover:shadow-rose-500/20",
                          key === '⌫' && "text-slate-400"
                        )}
                        onClick={() => {
                          if (key === 'C') handlePinClear()
                          else if (key === '⌫') handlePinBackspace()
                          else handlePinInput(key)
                        }}
                      >
                        {key === '⌫' ? <Delete className="w-7 h-7" /> : key}
                      </Button>
                    )
                  )}
                </div>
              </div>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="overflow-hidden"
                  >
                    <div className="text-rose-600 text-[13px] font-bold text-center bg-rose-50 border border-rose-100 p-5 rounded-2xl flex items-center justify-center gap-3">
                      <div className="w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center">
                        <X className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                      {error}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Button */}
              <Button
                type="submit"
                size="lg"
                className={cn(
                  "w-full h-18 rounded-2xl text-[13px] font-black uppercase tracking-[0.2em] transition-all duration-300 shadow-xl",
                  "bg-slate-900 border-none",
                  "hover:bg-primary hover:shadow-primary/30 hover:-translate-y-1 active:scale-95 active:translate-y-0",
                  "disabled:opacity-50 disabled:grayscale disabled:scale-100 disabled:pointer-events-none"
                )}
                disabled={isLoading || !email || pin.length < 4}
              >
                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Verifying Identity</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span>Sign In to Terminal</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Footer Branding - Extremely minimal */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-4 text-slate-300 text-[9px] font-black uppercase tracking-[0.4em]">
        <span>&copy; {new Date().getFullYear()} Kraken ERP</span>
        <div className="w-1 h-1 rounded-full bg-slate-200" />
        <span>V 4.1.18 Stable</span>
      </div>
    </div>
  )
}
