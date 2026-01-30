import { useAuthStore } from '@/stores/auth'
import { useConfigStore } from '@/stores/config'
import { User, WifiOff } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function Header() {
  const { employee, shift } = useAuthStore()
  const { businessName } = useConfigStore()
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-primary">{businessName || 'POS'}</h1>
        {!isOnline && (
          <div className="flex items-center gap-1 text-warning text-sm">
            <WifiOff className="w-4 h-4" />
            <span>Offline</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {shift && (
          <div className="text-sm text-muted-foreground">
            Shift #{shift.id}
          </div>
        )}
        <div className="flex items-center gap-2 text-sm">
          <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
          <span className="font-medium">{employee?.name}</span>
        </div>
      </div>
    </header>
  )
}
