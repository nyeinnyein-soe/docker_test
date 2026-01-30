import { NavLink } from 'react-router-dom'
import { ShoppingBag, Receipt, Grid3X3, Clock, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { path: '/app/sell', label: 'Sell', icon: ShoppingBag },
  { path: '/app/orders', label: 'Orders', icon: Receipt },
  { path: '/app/items', label: 'Items', icon: Grid3X3 },
  { path: '/app/shift', label: 'Shift', icon: Clock },
  { path: '/app/settings', label: 'Settings', icon: Settings },
]

export default function BottomNav() {
  return (
    <nav className="bg-white border-t">
      <div className="flex">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors',
                isActive
                  ? 'text-primary bg-primary/5'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              )
            }
          >
            <item.icon className="w-6 h-6" />
            <span className="text-xs font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
