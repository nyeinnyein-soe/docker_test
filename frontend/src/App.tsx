import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { useConfigStore } from '@/stores/config'

// Pages
import Splash from '@/pages/Splash'
import Login from '@/pages/Login'
import SetupWizard from '@/pages/SetupWizard'
import OpenShift from '@/pages/OpenShift'
import Orders from '@/pages/Orders'
import Items from '@/pages/Items'
import Categories from '@/pages/Categories'
import Tables from '@/pages/Tables'
import Modifiers from '@/pages/Modifiers'
import Taxes from '@/pages/Taxes'
import Shift from '@/pages/Shift'
import Settings from '@/pages/Settings'
import StoreSettings from '@/pages/StoreSettings'

// Sell pages
import SellPage from '@/pages/sell/SellPage'

// Layout
import AppShell from '@/components/layout/AppShell'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function SetupGuard({ children }: { children: React.ReactNode }) {
  const { setupComplete } = useConfigStore()

  if (!setupComplete) {
    return <Navigate to="/setup" replace />
  }

  return <>{children}</>
}

function App() {
  const { isAuthenticated } = useAuthStore()
  const { setupComplete } = useConfigStore()

  return (
    <BrowserRouter>
      <Routes>
        {/* Splash - Entry point */}
        <Route path="/" element={<Splash />} />

        {/* Auth */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/app/sell" replace /> : <Login />}
        />

        {/* Setup Wizard */}
        <Route
          path="/setup"
          element={
            <PrivateRoute>
              {setupComplete ? <Navigate to="/app/sell" replace /> : <SetupWizard />}
            </PrivateRoute>
          }
        />

        {/* Open Shift */}
        <Route
          path="/open-shift"
          element={
            <PrivateRoute>
              <SetupGuard>
                <OpenShift />
              </SetupGuard>
            </PrivateRoute>
          }
        />

        {/* Main App with Bottom Navigation */}
        <Route
          path="/app"
          element={
            <PrivateRoute>
              <AppShell />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/app/sell" replace />} />
          <Route path="sell" element={<SellPage />} />
          <Route path="orders" element={<Orders />} />
          <Route path="items" element={<Items />} />
          <Route path="categories" element={<Categories />} />
          <Route path="tables" element={<Tables />} />
          <Route path="modifiers" element={<Modifiers />} />
          <Route path="taxes" element={<Taxes />} />
          <Route path="shift" element={<Shift />} />
          <Route path="settings" element={<Settings />} />
          <Route path="settings/store" element={<StoreSettings />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
