import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'

interface ToastItem {
  id: string
  message: string
  type: 'success' | 'error'
}

interface ToastContextValue {
  showToast: (message: string, type?: 'success' | 'error') => void
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} })

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = crypto.randomUUID()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 2500)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.length > 0 && (
        <div
          className="fixed inset-x-0 bottom-24 flex flex-col items-center gap-2 z-50 pointer-events-none px-6"
          aria-live="polite"
          aria-atomic="true"
        >
          {toasts.map(t => (
            <div
              key={t.id}
              role="status"
              className={`px-5 py-3 rounded-2xl text-sm font-medium shadow-xl pointer-events-auto max-w-xs w-full text-center ${
                t.type === 'error'
                  ? 'bg-red-950 text-red-200 border border-red-800'
                  : 'bg-[#1E4A35] text-ivory border border-[#2A5E45]'
              }`}
            >
              {t.message}
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  return useContext(ToastContext)
}
