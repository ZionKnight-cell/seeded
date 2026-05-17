import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'

export default function AppShell() {
  return (
    <div className="min-h-[100svh] bg-forest text-ivory flex flex-col">
      <main
        className="flex-1 overflow-y-auto"
        style={{ paddingBottom: 'calc(7rem + env(safe-area-inset-bottom))' }}
      >
        <div className="max-w-lg mx-auto w-full">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
