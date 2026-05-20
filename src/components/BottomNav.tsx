import { NavLink } from 'react-router-dom'
import { Home, BookOpen, Plus, Heart, TrendingUp, BookMarked } from 'lucide-react'

const tabs = [
  { to: '/', icon: Home, label: 'Home', end: true },
  { to: '/notes', icon: BookOpen, label: 'Notes', end: false },
  { to: '/add', icon: Plus, label: 'New', end: false, isAdd: true },
  { to: '/scripture', icon: BookMarked, label: 'Word', end: false },
  { to: '/prayer', icon: Heart, label: 'Prayer', end: false },
  { to: '/review', icon: TrendingUp, label: 'Growth', end: false },
]

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-forest-dark border-t border-forest-light print:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around h-16 px-1 max-w-lg mx-auto">
        {tabs.map(({ to, icon: Icon, label, end, isAdd }) =>
          isAdd ? (
            <NavLink
              key={to}
              to={to}
              className="flex items-center justify-center w-11 h-11 rounded-full bg-gold text-forest shadow-lg -mt-5 ring-4 ring-forest-dark shrink-0"
              aria-label="Add new note"
            >
              <Icon size={20} strokeWidth={2.5} />
            </NavLink>
          ) : (
            <NavLink
              key={to}
              to={to}
              end={end}
              aria-label={label}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-xl transition-colors min-w-0 ${
                  isActive ? 'text-gold' : 'text-ivory-dim'
                }`
              }
            >
              <Icon size={20} strokeWidth={1.5} />
              <span className="text-[9px] font-medium">{label}</span>
            </NavLink>
          )
        )}
      </div>
    </nav>
  )
}
