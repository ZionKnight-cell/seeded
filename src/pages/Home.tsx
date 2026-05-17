import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Settings, BookOpen, Sun, Target, Heart, Lightbulb } from 'lucide-react'
import { db } from '../db/database'
import { formatDate } from '../lib/dates'
import HowSeededWorks from '../components/HowSeededWorks'
import type { SermonNote, PrayerPoint, ActionStep } from '../types'

interface DashboardData {
  latestNote: SermonNote | undefined
  activeStep: ActionStep | undefined
  activePrayer: PrayerPoint | undefined
  totalNotes: number
  activePrayerCount: number
  completedStepCount: number
  reflectionNote: SermonNote | undefined
  reflectionCount: number
}

const EMPTY_DATA: DashboardData = {
  latestNote: undefined,
  activeStep: undefined,
  activePrayer: undefined,
  totalNotes: 0,
  activePrayerCount: 0,
  completedStepCount: 0,
  reflectionNote: undefined,
  reflectionCount: 0,
}

export default function Home() {
  const [data, setData] = useState<DashboardData>(EMPTY_DATA)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    async function load() {
      const [notes, allPrayers, allSteps, totalNotes, completedSteps, allNotes] = await Promise.all([
        db.sermonNotes.orderBy('sermonDate').reverse().limit(1).toArray(),
        db.prayerPoints.toArray(),
        db.actionSteps.toArray(),
        db.sermonNotes.count(),
        db.actionSteps.toArray().then(s => s.filter(a => a.status === 'done').length),
        db.sermonNotes.orderBy('sermonDate').reverse().toArray(),
      ])

      const prayers = allPrayers.filter(p => p.status === 'active')
      const steps = allSteps.filter(s => s.status !== 'done')

      const needingReflection = allNotes.filter(
        n => !!(n.fullNotes && (!n.prayerPoint || !n.weeklyActionStep))
      )

      setData({
        latestNote: notes[0],
        activeStep: steps[0],
        activePrayer: prayers[0],
        totalNotes,
        activePrayerCount: prayers.length,
        completedStepCount: completedSteps,
        reflectionNote: needingReflection[0],
        reflectionCount: needingReflection.length,
      })
      setReady(true)
    }
    load()
  }, [])

  const { latestNote, activeStep, activePrayer, totalNotes, activePrayerCount, completedStepCount } = data
  const isEmpty = ready && totalNotes === 0

  return (
    <div className="px-5 pt-6 pb-4">
      {/* Header */}
      <header className="flex items-center justify-between mb-10">
        <img src="/seeded-logo.png" alt="Seeded" className="h-8 w-auto object-contain" />
        <Link
          to="/settings"
          className="text-ivory-dim hover:text-ivory transition-colors p-1 -mr-1"
          aria-label="Settings"
        >
          <Settings size={22} strokeWidth={1.5} />
        </Link>
      </header>

      {/* Hero */}
      <div className="mb-8">
        <h1 className="text-[28px] font-semibold text-ivory leading-tight tracking-tight mb-2">
          Let the Word take root.
        </h1>
        <p className="text-ivory-dim text-sm leading-relaxed">
          Capture the message. Reflect on it. Pray through it. Practice one step.
        </p>
      </div>

      {/* CTAs */}
      <div className="flex gap-3 mb-6">
        <Link
          to="/add/sermon"
          className="flex-1 flex items-center justify-center gap-2 bg-gold text-forest font-semibold py-3.5 rounded-2xl text-[14px]"
        >
          <BookOpen size={16} strokeWidth={2.5} />
          Sermon Note
        </Link>
        <Link
          to="/add/quiet-time"
          className="flex-1 flex items-center justify-center gap-2 bg-forest-mid border border-forest-light text-ivory font-semibold py-3.5 rounded-2xl text-[14px]"
        >
          <Sun size={16} strokeWidth={2} />
          Quiet Time
        </Link>
      </div>

      {isEmpty ? (
        <>
          <div className="mb-6">
            <h2 className="text-[17px] font-semibold text-ivory mb-2">Start here</h2>
            <p className="text-ivory-dim text-sm leading-relaxed">
              Start with a sermon note from church or a quiet time from your personal devotion. Capture it, reflect on it, pray through it, and choose one growth step for the week.
            </p>
          </div>
          <div className="bg-forest-mid rounded-2xl p-5 border border-forest-light">
            <p className="text-[10px] font-semibold text-gold uppercase tracking-widest mb-5">
              How Seeded works
            </p>
            <HowSeededWorks />
          </div>
        </>
      ) : (
        <>
          {/* Ready to Reflect card */}
          {data.reflectionCount > 0 && (
            <div className="bg-forest-mid rounded-2xl p-5 border border-gold/25 mb-6">
              <div className="flex items-center gap-2 mb-2.5">
                <Lightbulb size={14} className="text-gold shrink-0" strokeWidth={1.5} />
                <span className="text-[10px] font-semibold text-gold uppercase tracking-widest">
                  Ready to Reflect
                </span>
              </div>
              <p className="text-ivory text-sm leading-relaxed mb-3">
                {data.reflectionCount === 1
                  ? 'One of your notes has content but is missing a prayer point or growth step.'
                  : `${data.reflectionCount} notes have content but are missing a prayer point or growth step.`}
              </p>
              {data.reflectionNote && (
                <Link
                  to={`/notes/${data.reflectionNote.id}/edit`}
                  className="text-xs font-semibold text-gold"
                >
                  Complete reflection →
                </Link>
              )}
            </div>
          )}

          {/* This Week */}
          <section className="mb-8">
            <h2 className="text-[11px] font-semibold text-ivory-dim uppercase tracking-widest mb-3">
              This Week
            </h2>
            <div className="space-y-3">
              {/* Growth Step */}
              <div className="bg-forest-mid rounded-2xl p-5 border border-forest-light">
                <div className="flex items-center gap-2 mb-2.5">
                  <Target size={14} className="text-gold" strokeWidth={2} />
                  <span className="text-[10px] font-semibold text-gold uppercase tracking-widest">
                    Growth Step
                  </span>
                </div>
                {activeStep ? (
                  <>
                    <p className="text-ivory text-sm leading-relaxed mb-3">{activeStep.text}</p>
                    <Link to="/review" className="text-gold text-xs font-medium">
                      Update status
                    </Link>
                  </>
                ) : (
                  <p className="text-ivory-muted text-sm">No active growth steps this week.</p>
                )}
              </div>

              {/* Recent Note */}
              <div className="bg-forest-mid rounded-2xl p-5 border border-forest-light">
                <div className="flex items-center gap-2 mb-2.5">
                  <BookOpen size={14} className="text-gold" strokeWidth={2} />
                  <span className="text-[10px] font-semibold text-gold uppercase tracking-widest">
                    Recent Note
                  </span>
                </div>
                {latestNote ? (
                  <Link to={`/notes/${latestNote.id}`} className="block">
                    <p className="text-ivory text-sm font-medium mb-1">{latestNote.title}</p>
                    <p className="text-ivory-dim text-xs">
                      {formatDate(latestNote.sermonDate)}
                      {latestNote.preacherName && ` · ${latestNote.preacherName}`}
                    </p>
                  </Link>
                ) : (
                  <p className="text-ivory-muted text-sm">Your most recent note will appear here.</p>
                )}
              </div>

              {/* Prayer Reminder */}
              <div className="bg-forest-mid rounded-2xl p-5 border border-forest-light">
                <div className="flex items-center gap-2 mb-2.5">
                  <Heart size={14} className="text-gold" strokeWidth={2} />
                  <span className="text-[10px] font-semibold text-gold uppercase tracking-widest">
                    Prayer Reminder
                  </span>
                </div>
                {activePrayer ? (
                  <>
                    <p className="text-ivory text-sm leading-relaxed mb-3 line-clamp-2">
                      {activePrayer.text}
                    </p>
                    <Link to="/prayer" className="text-gold text-xs font-medium">
                      View all prayers
                    </Link>
                  </>
                ) : (
                  <p className="text-ivory-muted text-sm">No active prayer items.</p>
                )}
              </div>
            </div>
          </section>

          {/* Stats */}
          <section>
            <h2 className="text-[11px] font-semibold text-ivory-dim uppercase tracking-widest mb-3">
              Your Journey
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-forest-mid rounded-2xl p-4 border border-forest-light text-center">
                <div className="text-2xl font-semibold text-ivory mb-1">{totalNotes}</div>
                <div className="text-[10px] text-ivory-dim font-medium">Notes</div>
              </div>
              <div className="bg-forest-mid rounded-2xl p-4 border border-forest-light text-center">
                <div className="text-2xl font-semibold text-ivory mb-1">{activePrayerCount}</div>
                <div className="text-[10px] text-ivory-dim font-medium">Prayers</div>
              </div>
              <div className="bg-forest-mid rounded-2xl p-4 border border-forest-light text-center">
                <div className="text-2xl font-semibold text-ivory mb-1">{completedStepCount}</div>
                <div className="text-[10px] text-ivory-dim font-medium">Done</div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
