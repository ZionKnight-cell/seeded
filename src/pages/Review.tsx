import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, ChevronDown, BookOpen } from 'lucide-react'
import { getAllActionSteps, updateActionStatus, updateActionReflection } from '../db/database'
import { useToast } from '../components/Toast'
import { formatDate } from '../lib/dates'
import { FOLLOW_UP_LABELS } from '../types'
import type { ActionStep, FollowUpStatus } from '../types'

const FILTERS: { key: FollowUpStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'not_started', label: 'Not Started' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'still_working', label: 'Still Working' },
  { key: 'done', label: 'Done' },
  { key: 'forgot', label: 'I Forgot' },
]

const STATUS_BADGE: Record<FollowUpStatus, string> = {
  not_started: 'text-ivory-dim border-forest-light',
  in_progress: 'text-gold border-gold/40 bg-gold/10',
  done: 'text-emerald-400 border-emerald-600/40 bg-emerald-400/10',
  still_working: 'text-gold border-gold/40 bg-gold/10',
  forgot: 'text-ivory-dim border-forest-light',
}

const FILTER_EMPTY: Record<FollowUpStatus | 'all', string> = {
  all: 'No growth steps yet.',
  not_started: 'No new growth steps waiting.',
  in_progress: 'No steps currently in progress.',
  still_working: 'No steps still being worked on.',
  done: 'No completed steps yet — keep going.',
  forgot: 'Nothing marked as forgotten.',
}

export default function Review() {
  const { showToast } = useToast()
  const [steps, setSteps] = useState<ActionStep[]>([])
  const [filter, setFilter] = useState<FollowUpStatus | 'all'>('all')
  const [refreshKey, setRefreshKey] = useState(0)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [reflectionText, setReflectionText] = useState<Record<string, string>>({})
  const [editingReflection, setEditingReflection] = useState<string | null>(null)

  useEffect(() => {
    getAllActionSteps().then(s => {
      setSteps(s)
      const init: Record<string, string> = {}
      s.forEach(step => { init[step.id] = step.reflection ?? '' })
      setReflectionText(init)
    })
  }, [refreshKey])

  const filtered = filter === 'all' ? steps : steps.filter(s => s.status === filter)

  async function handleStatus(id: string, status: FollowUpStatus) {
    await updateActionStatus(id, status)
    setRefreshKey(k => k + 1)
    showToast('Status updated')
  }

  async function handleSaveReflection(id: string) {
    await updateActionReflection(id, reflectionText[id] ?? '')
    setEditingReflection(null)
    setRefreshKey(k => k + 1)
    showToast('Reflection saved')
  }

  return (
    <div className="px-5 pt-8 pb-4">
      <h1 className="text-2xl font-semibold text-ivory tracking-tight mb-1">Weekly Review</h1>
      <p className="text-ivory-dim text-sm mb-5 leading-relaxed">
        Hearing is the beginning. Growth happens when the Word is practiced.
      </p>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-5 scrollbar-none -mx-5 px-5">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
            className={`shrink-0 text-xs px-4 py-1.5 rounded-full border transition-colors ${
              filter === f.key
                ? 'bg-gold text-forest border-gold font-semibold'
                : 'border-forest-light text-ivory-dim'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {steps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-forest-mid border border-forest-light flex items-center justify-center mb-4">
            <TrendingUp size={26} className="text-gold" strokeWidth={1.5} />
          </div>
          <p className="text-ivory text-sm font-medium mb-1">Nothing to review yet</p>
          <p className="text-ivory-dim text-xs leading-relaxed max-w-[220px]">
            Growth steps help you practice what you heard. Add a weekly action step when writing a sermon note.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-ivory-muted text-sm">{FILTER_EMPTY[filter]}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(step => (
            <div key={step.id} className="bg-forest-mid rounded-2xl border border-forest-light overflow-hidden">
              <div className="p-5">
                {/* Sermon source */}
                <div className="flex items-center gap-1.5 mb-2.5">
                  <BookOpen size={12} strokeWidth={2} className="text-gold shrink-0" />
                  <Link
                    to={`/notes/${step.sermonNoteId}`}
                    className="text-xs text-gold font-medium truncate"
                    onClick={e => e.stopPropagation()}
                  >
                    {step.sermonTitle}
                  </Link>
                </div>

                {/* Step text */}
                <p className="text-ivory text-sm leading-relaxed mb-3">{step.text}</p>

                {/* Date + status + expand */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${STATUS_BADGE[step.status]}`}
                    >
                      {FOLLOW_UP_LABELS[step.status]}
                    </span>
                    {step.weekStartDate && (
                      <span className="text-xs text-ivory-dim">{formatDate(step.weekStartDate)}</span>
                    )}
                  </div>
                  <button
                    onClick={() => setExpandedId(expandedId === step.id ? null : step.id)}
                    className="text-ivory-dim p-1 -mr-1"
                    aria-label={expandedId === step.id ? 'Collapse' : 'Expand step'}
                  >
                    <ChevronDown
                      size={16}
                      strokeWidth={1.5}
                      className={`transition-transform ${expandedId === step.id ? 'rotate-180' : ''}`}
                    />
                  </button>
                </div>
              </div>

              {expandedId === step.id && (
                <div className="border-t border-forest-light px-5 py-4 space-y-4">
                  {/* Status */}
                  <div>
                    <p className="text-[10px] font-semibold text-ivory-dim uppercase tracking-widest mb-2">
                      How did it go?
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(Object.entries(FOLLOW_UP_LABELS) as [FollowUpStatus, string][]).map(([k, v]) => (
                        <button
                          key={k}
                          onClick={() => handleStatus(step.id, k)}
                          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                            step.status === k
                              ? 'bg-gold text-forest border-gold font-semibold'
                              : 'border-forest-light text-ivory-dim'
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                    {step.status === 'forgot' && (
                      <p className="text-xs text-ivory-dim mt-2.5 italic">
                        It's okay — grace is new every morning. What matters is getting back up.
                      </p>
                    )}
                  </div>

                  {/* Open sermon link */}
                  <Link
                    to={`/notes/${step.sermonNoteId}`}
                    className="flex items-center gap-1.5 text-xs text-gold font-medium"
                  >
                    <BookOpen size={12} strokeWidth={2} />
                    Open sermon
                  </Link>

                  {/* Reflection */}
                  <div>
                    <p className="text-[10px] font-semibold text-ivory-dim uppercase tracking-widest mb-2">
                      Reflection
                    </p>
                    {editingReflection === step.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={reflectionText[step.id] ?? ''}
                          onChange={e => setReflectionText(t => ({ ...t, [step.id]: e.target.value }))}
                          rows={3}
                          placeholder="What did you notice? What changed?"
                          className="w-full bg-forest border border-forest-light text-ivory rounded-xl px-3 py-2 text-sm placeholder:text-ivory-dim focus:outline-none focus:border-gold resize-none"
                          autoFocus
                        />
                        <div className="flex gap-2 items-center">
                          <button
                            onClick={() => setEditingReflection(null)}
                            className="text-xs text-ivory-dim px-3 py-1.5"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveReflection(step.id)}
                            className="text-xs bg-gold text-forest font-semibold px-4 py-1.5 rounded-lg"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingReflection(step.id)}
                        className="w-full text-left"
                      >
                        {step.reflection ? (
                          <p className="text-ivory-muted text-sm leading-relaxed">{step.reflection}</p>
                        ) : (
                          <p className="text-ivory-dim text-sm italic">Tap to add a reflection…</p>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
