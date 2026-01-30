import { useEffect, useState } from 'react'
import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { useConfigStore } from '@/stores/config'
import Header from './Header'
import BottomNav from './BottomNav'

export default function AppShell() {
  const { isAuthenticated, employee, shift, isLoading, fetchCurrentShift } = useAuthStore()
  const { setupComplete } = useConfigStore()
  const [isCheckingShift, setIsCheckingShift] = useState(true)
  const location = useLocation()

  const isSellRoute = location.pathname.startsWith('/app/sell')
  const isManagementRoute = ['/app/items', '/app/categories', '/app/modifiers', '/app/taxes', '/app/settings', '/app/tables', '/app/orders'].some(route => location.pathname.startsWith(route))
  const isManager = employee?.role === 'MANAGER' || employee?.role === 'OWNER'

  useEffect(() => {
    // Fetch shift if authenticated but shift is missing
    // Skip shift check for management routes if user is a manager
    if (isAuthenticated && !shift && !isLoading) {
      const path = location.pathname
      const isMgmtRoute = ['/app/items', '/app/categories', '/app/modifiers', '/app/taxes', '/app/settings', '/app/tables', '/app/orders'].some(route => path.startsWith(route))
      const isMgr = employee?.role === 'MANAGER' || employee?.role === 'OWNER'
      
      if (isMgmtRoute && isMgr) {
        // Managers accessing management routes don't need shift check
        setIsCheckingShift(false)
      } else {
        fetchCurrentShift().finally(() => setIsCheckingShift(false))
      }
    } else {
      setIsCheckingShift(false)
    }
  }, [isAuthenticated, shift, isLoading, fetchCurrentShift, location.pathname, employee?.role])

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Redirect if setup not complete
  if (!setupComplete) {
    return <Navigate to="/setup" replace />
  }

  // Show loading while checking shift (skip for management routes)
  // Management routes don't require shift, so don't block them
  if (isLoading || (isCheckingShift && isSellRoute)) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect if no shift after checking
  // - Sell routes always require a shift
  // - Management routes are always accessible (backend will handle authorization)
  if (!shift && isSellRoute) {
    // Only redirect sell routes if no shift
    return <Navigate to="/open-shift" replace />
  }
  
  // Management routes are always accessible - backend API will handle role-based authorization

  return (
    <div className="h-screen flex flex-col bg-secondary/30">
      <Header />
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
