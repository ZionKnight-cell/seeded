import { useState } from 'react'
import { ChevronDown, Lightbulb } from 'lucide-react'

const PROMPTS = [
  {
    id: 'takeaway' as const,
    question: 'What stood out most from this message?',
    hint: 'Something that surprised, challenged, encouraged, or stayed with you.',
    action: 'Use as main takeaway',
  },
  {
    id: 'conviction' as const,
    question: 'Where does this message meet your life right now?',
    hint: 'A habit, attitude, relationship, or decision it speaks into.',
    action: 'Use as personal conviction',
  },
  {
    id: 'prayer' as const,
    question: 'What would you like to bring to God from this message?',
    hint: 'A need, gratitude, a request, or an area to surrender.',
    action: 'Use as prayer point',
  },
  {
    id: 'actionStep' as const,
    question: 'What is one faithful step you could take this week?',
    hint: 'Keep it small and concrete — not a resolution, just one step.',
    action: 'Use as growth step',
  },
]

type PromptId = (typeof PROMPTS)[number]['id']

interface Props {
  onUseTakeaway: (text: string) => void
  onUseConviction: (text: string) => void
  onUsePrayer: (text: string) => void
  onUseActionStep: (text: string) => void
}

export default function ReflectionHelper({
  onUseTakeaway,
  onUseConviction,
  onUsePrayer,
  onUseActionStep,
}: Props) {
  const [open, setOpen] = useState(false)
  const [answers, setAnswers] = useState<Record<PromptId, string>>({
    takeaway: '',
    conviction: '',
    prayer: '',
    actionStep: '',
  })
  const [confirmed, setConfirmed] = useState<PromptId | null>(null)

  const handlers: Record<PromptId, (text: string) => void> = {
    takeaway: onUseTakeaway,
    conviction: onUseConviction,
    prayer: onUsePrayer,
    actionStep: onUseActionStep,
  }

  function useAnswer(id: PromptId) {
    const text = answers[id].trim()
    if (!text) return
    handlers[id](text)
    setConfirmed(id)
    setTimeout(() => setConfirmed(null), 1500)
  }

  return (
    <div className="bg-forest-mid rounded-2xl border border-forest-light overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-5 text-left"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-forest-light flex items-center justify-center shrink-0">
            <Lightbulb size={15} className="text-gold" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm font-medium text-ivory">Reflection Helper</p>
            <p className="text-xs text-ivory-dim mt-0.5">
              Guided questions to shape your notes into prayer and action
            </p>
          </div>
        </div>
        <ChevronDown
          size={16}
          strokeWidth={1.5}
          className={`text-ivory-dim transition-transform shrink-0 ml-2 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="border-t border-forest-light px-5 pb-5 pt-4 space-y-5">
          <p className="text-xs text-ivory-dim leading-relaxed">
            Work through these questions at your own pace. Write your thoughts below, then tap the button to move
            an answer into the form. You can always edit the fields directly too.
          </p>

          {PROMPTS.map(prompt => {
            const value = answers[prompt.id]
            const isConfirmed = confirmed === prompt.id
            return (
              <div key={prompt.id}>
                <p className="text-[13px] font-medium text-ivory mb-1">{prompt.question}</p>
                <p className="text-xs text-ivory-dim mb-2 leading-relaxed">{prompt.hint}</p>
                <textarea
                  value={value}
                  onChange={e =>
                    setAnswers(a => ({ ...a, [prompt.id]: e.target.value }))
                  }
                  rows={2}
                  placeholder="Your thoughts…"
                  className="w-full bg-forest border border-forest-light text-ivory rounded-xl px-3 py-2.5 text-sm placeholder:text-ivory-dim focus:outline-none focus:border-gold resize-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => useAnswer(prompt.id)}
                  disabled={!value.trim() || isConfirmed}
                  className={`mt-2 text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                    isConfirmed
                      ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-400'
                      : 'border-gold/40 text-gold disabled:opacity-40'
                  }`}
                >
                  {isConfirmed ? '✓ Added to form' : prompt.action}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
