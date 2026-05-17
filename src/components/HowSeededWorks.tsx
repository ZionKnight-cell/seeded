import { BookOpen, Lightbulb, Heart, Target } from 'lucide-react'

const STEPS = [
  {
    icon: BookOpen,
    title: 'Capture',
    body: 'Write a sermon note while listening, or a quiet time note from your personal devotion or Bible reading.',
  },
  {
    icon: Lightbulb,
    title: 'Reflect',
    body: 'Use the Reflection Helper to find your main takeaway and personal conviction.',
  },
  {
    icon: Heart,
    title: 'Pray',
    body: 'Turn the message into one prayer point — something to bring before God this week.',
  },
  {
    icon: Target,
    title: 'Practice',
    body: 'Choose one small growth step and review it later in the Growth tab.',
  },
]

export default function HowSeededWorks() {
  return (
    <div className="space-y-4">
      {STEPS.map((step, i) => {
        const Icon = step.icon
        return (
          <div key={step.title} className="flex items-start gap-4">
            <div className="flex flex-col items-center shrink-0">
              <div className="w-8 h-8 rounded-full bg-forest-light flex items-center justify-center">
                <Icon size={14} className="text-gold" strokeWidth={1.5} />
              </div>
              {i < STEPS.length - 1 && (
                <div className="w-px h-6 bg-forest-light mt-1" />
              )}
            </div>
            <div className={i < STEPS.length - 1 ? 'pb-2' : ''}>
              <p className="text-sm font-semibold text-ivory mb-0.5">{step.title}</p>
              <p className="text-xs text-ivory-dim leading-relaxed">{step.body}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
