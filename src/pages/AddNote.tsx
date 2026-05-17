import { Link } from 'react-router-dom'
import { BookOpen, Sun } from 'lucide-react'

export default function AddNote() {
  return (
    <div className="px-5 pt-8 pb-4">
      <h1 className="text-2xl font-semibold text-ivory tracking-tight mb-2">New Note</h1>
      <p className="text-ivory-dim text-sm leading-relaxed mb-8">
        What kind of note would you like to create?
      </p>

      <div className="space-y-3">
        <Link
          to="/add/sermon"
          className="block bg-forest-mid rounded-2xl p-5 border border-forest-light active:opacity-80 transition-opacity"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-forest-light flex items-center justify-center shrink-0">
              <BookOpen size={17} className="text-gold" strokeWidth={1.5} />
            </div>
            <p className="text-ivory font-semibold text-[15px]">Sermon Note</p>
          </div>
          <p className="text-ivory-dim text-sm leading-relaxed">
            Capture a church message with notes, reflection, prayer point, and one growth step.
          </p>
        </Link>

        <Link
          to="/add/quiet-time"
          className="block bg-forest-mid rounded-2xl p-5 border border-forest-light active:opacity-80 transition-opacity"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-forest-light flex items-center justify-center shrink-0">
              <Sun size={17} className="text-gold" strokeWidth={1.5} />
            </div>
            <p className="text-ivory font-semibold text-[15px]">Quiet Time</p>
          </div>
          <p className="text-ivory-dim text-sm leading-relaxed">
            Record a personal devotional, Bible reading, or journaling session.
          </p>
        </Link>
      </div>
    </div>
  )
}
