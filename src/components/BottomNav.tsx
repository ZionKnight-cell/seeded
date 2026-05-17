import { NavLink } from 'react-router-dom'
import { Home, BookOpen, Plus, Heart, TrendingUp } from 'lucide-react'

const tabs = [
  { to: '/', icon: Home, label: 'Home', end: true },
  { to: '/notes', icon: BookOpen, label: 'Notes', end: false },
  { to: '/add', icon: Plus, label: 'New', end: false, isAdd: true },
  { to: '/prayer', icon: Heart, label: 'Prayer', end: false },
  { to: '/review', icon: TrendingUp, label: 'Growth', end: false },
]

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-forest-dark border-t border-forest-light"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
        {tabs.map(({ to, icon: Icon, label, end, isAdd }) =>
          isAdd ? (
            <NavLink
              key={to}
              to={to}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-gold text-forest shadow-lg -mt-5 ring-4 ring-forest-dark"
              aria-label="Add new sermon note"
            >
              <Icon size={22} strokeWidth={2.5} />
            </NavLink>
          ) : (
            <NavLink
              key={to}
              to={to}
              end={end}
              aria-label={label}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 min-w-14 py-1.5 rounded-xl transition-colors ${
                  isActive ? 'text-gold' : 'text-ivory-dim'
                }`
              }
            >
              <Icon size={22} strokeWidth={1.5} />
              <span className="text-[10px] font-medium">{label}</span>
            </NavLink>
          )
        )}
      </div>
    </nav>
  )
}
