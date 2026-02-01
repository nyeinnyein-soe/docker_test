import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { useConfigStore, type PosMode } from '@/stores/config'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Store,
  ShoppingBag,
  Coffee,
  UtensilsCrossed,
  LogOut,
  Save,
  Loader2,
  ChevronRight,
  Info,
  FolderTree,
  MapPin,
  Grid3X3,
  Package,
  Sliders,
} from 'lucide-react'

const modes: { id: PosMode; name: string; icon: React.ReactNode }[] = [
  { id: 'RETAIL', name: 'Retail', icon: <ShoppingBag className="w-5 h-5" /> },
  { id: 'CAFE', name: 'Cafe / QSR', icon: <Coffee className="w-5 h-5" /> },
  { id: 'RESTAURANT', name: 'Restaurant', icon: <UtensilsCrossed className="w-5 h-5" /> },
]

export default function Settings() {
  const navigate = useNavigate()
  const { employee, logout } = useAuthStore()
  const { posMode, businessName, currency, setMode, setBusinessName, setCurrency, saveConfig, isLoading } = useConfigStore()

  const [localBusinessName, setLocalBusinessName] = useState(businessName)
  const [localCurrency, setLocalCurrency] = useState(currency)
  const [hasChanges, setHasChanges] = useState(false)

  const handleModeChange = (mode: PosMode) => {
    setMode(mode)
    setHasChanges(true)
  }

  const handleSave = async () => {
    setBusinessName(localBusinessName)
    setCurrency(localCurrency)
    try {
      await saveConfig()
      setHasChanges(false)
    } catch {
      // Error handled silently
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Business Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="w-5 h-5" />
            Business Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Business Name</label>
            <Input
              value={localBusinessName}
              onChange={(e) => {
                setLocalBusinessName(e.target.value)
                setHasChanges(true)
              }}
              placeholder="Your business name"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Currency</label>
            <select
              value={localCurrency}
              onChange={(e) => {
                setLocalCurrency(e.target.value)
                setHasChanges(true)
              }}
              className="w-full h-12 px-4 rounded-lg border border-input bg-background"
            >
              <option value="MMK">Myanmar Kyat (MMK)</option>
              <option value="USD">US Dollar (USD)</option>
              <option value="THB">Thai Baht (THB)</option>
              <option value="SGD">Singapore Dollar (SGD)</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* POS Mode */}
      <Card>
        <CardHeader>
          <CardTitle>POS Mode</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {modes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => handleModeChange(mode.id)}
                className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                  posMode === mode.id
                    ? 'border-primary bg-primary/5'
                    : 'border-input hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  {mode.icon}
                  <span className="font-medium">{mode.name}</span>
                </div>
                {posMode === mode.id && (
                  <div className="w-3 h-3 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Menu Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3X3 className="w-5 h-5" />
            Menu Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <Link
            to="/app/items"
            className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-secondary/50 transition-colors border-2 hover:border-primary/50"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <span className="font-medium">Items</span>
                <p className="text-xs text-muted-foreground">Manage products and variants</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>
          <Link
            to="/app/categories"
            className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-secondary/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <FolderTree className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <span className="font-medium">Categories</span>
                <p className="text-xs text-muted-foreground">Organize your menu</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>
          <Link
            to="/app/modifiers"
            className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-secondary/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Sliders className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <span className="font-medium">Modifiers</span>
                <p className="text-xs text-muted-foreground">Add-ons and extras</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>
          <Link
            to="/app/tables"
            className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-secondary/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <span className="font-medium">Tables & Floors</span>
                <p className="text-xs text-muted-foreground">Restaurant layout</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>
        </CardContent>
      </Card>

      {/* More Settings */}
      <Card>
        <CardHeader>
          <CardTitle>More</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <button className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-secondary/50 transition-colors">
            <span>Receipt Settings</span>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
          <Link
            to="/app/settings/store"
            className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-secondary/50 transition-colors"
          >
            <span>Tax Settings</span>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>
          <button className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-secondary/50 transition-colors">
            <span>User Management</span>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">POS System</p>
                <p className="text-sm text-muted-foreground">Version 1.0.0</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      {hasChanges && (
        <Button
          size="lg"
          className="w-full"
          onClick={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      )}

      {/* Logout */}
      <Card className="border-destructive/50">
        <CardContent className="p-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between text-destructive"
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-5 h-5" />
              <div className="text-left">
                <p className="font-medium">Logout</p>
                <p className="text-sm opacity-70">{employee?.email}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5" />
          </button>
        </CardContent>
      </Card>
    </div>
  )
}
