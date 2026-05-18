import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import HowSeededWorks from '../components/HowSeededWorks'

export const ONBOARDING_KEY = 'seeded_onboarding_done'

export function markOnboardingDone(): void {
  localStorage.setItem(ONBOARDING_KEY, '1')
}

export function isOnboardingDone(): boolean {
  return !!localStorage.getItem(ONBOARDING_KEY)
}

export default function Onboarding() {
  const navigate = useNavigate()

  function handleStart() {
    markOnboardingDone()
    navigate('/add/sermon', { replace: true })
  }

  function handleExplore() {
    markOnboardingDone()
    navigate('/', { replace: true })
  }

  return (
    <div
      className="min-h-screen px-5 pt-12 flex flex-col"
      style={{ background: 'var(--app-bg)', paddingBottom: 'max(2.5rem, env(safe-area-inset-bottom))' }}
    >
      <img src="/seeded-logo.png" alt="Seeded" className="h-8 w-auto object-contain mb-8" />

      <div className="mb-8">
        <h1 className="text-[28px] font-semibold text-ivory leading-tight tracking-tight mb-2">
          Welcome to Seeded.
        </h1>
        <p className="text-ivory-dim text-sm leading-relaxed">
          Capture the message. Reflect on it. Pray through it. Practice one step.
        </p>
      </div>

      <div className="bg-forest-mid rounded-2xl p-5 border border-forest-light mb-8">
        <p className="text-[10px] font-semibold text-gold uppercase tracking-widest mb-5">
          How Seeded works
        </p>
        <HowSeededWorks />
      </div>

      <div className="mt-auto space-y-3">
        <button
          onClick={handleStart}
          className="flex items-center justify-center gap-2 w-full bg-gold text-forest font-semibold py-4 rounded-2xl shadow-lg text-[15px]"
        >
          <Plus size={18} strokeWidth={2.5} />
          Start my first sermon note
        </button>
        <button
          onClick={handleExplore}
          className="w-full text-ivory-dim text-sm py-3 rounded-2xl border border-forest-light"
        >
          Explore the app first
        </button>
      </div>
    </div>
  )
}
