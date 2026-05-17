import { Outlet } from 'react-router-dom'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { Capacitor } from '@capacitor/core'
import BottomNav from './BottomNav'

export default function AppShell() {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW()
  const isNative = Capacitor.isNativePlatform()

  return (
    <div className="min-h-[100svh] bg-forest text-ivory flex flex-col">
      {needRefresh && !isNative && (
        <div className="bg-forest-dark border-b border-gold/30 px-5 py-3 flex items-center justify-between gap-4 shrink-0">
          <p className="text-ivory text-xs leading-relaxed">
            A new version of Seeded is available.
          </p>
          <button
            onClick={() => updateServiceWorker(true)}
            className="text-xs font-semibold text-forest bg-gold px-3 py-1.5 rounded-lg shrink-0"
          >
            Refresh
          </button>
        </div>
      )}
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
