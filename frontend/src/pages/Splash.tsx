import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { useConfigStore } from '@/stores/config'
import { Loader2 } from 'lucide-react'

export default function Splash() {
  const navigate = useNavigate()
  const { isAuthenticated, fetchProfile, fetchCurrentShift } = useAuthStore()
  const { fetchConfig } = useConfigStore()

  useEffect(() => {
    const init = async () => {
      // Check auth and config state
      if (isAuthenticated) {
        // Fetch all data in parallel
        await Promise.all([fetchProfile(), fetchCurrentShift(), fetchConfig()])
      }

      // Small delay for splash effect
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Get fresh state after fetching
      const authState = useAuthStore.getState()
      const configState = useConfigStore.getState()

      // Route based on state
      if (!authState.isAuthenticated) {
        navigate('/login', { replace: true })
      } else if (!configState.setupComplete) {
        navigate('/setup', { replace: true })
      } else if (!authState.shift) {
        navigate('/open-shift', { replace: true })
      } else {
        navigate('/app/sell', { replace: true })
      }
    }

    init()
  }, [isAuthenticated, navigate, fetchProfile, fetchCurrentShift, fetchConfig])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-primary">
      <div className="text-center text-white">
        <h1 className="text-5xl font-bold mb-4">POS</h1>
        <p className="text-lg opacity-80 mb-8">Point of Sale System</p>
        <Loader2 className="w-8 h-8 animate-spin mx-auto" />
      </div>
    </div>
  )
}
