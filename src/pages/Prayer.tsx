import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, ChevronDown, Plus, BookOpen, Sun, Play, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { getAllPrayerPoints, updatePrayerStatus, addPrayerUpdate } from '../db/database'
import { useToast } from '../components/Toast'
import { formatDate } from '../lib/dates'
import { PRAYER_STATUS_LABELS } from '../types'
import type { PrayerPoint, PrayerStatus } from '../types'

const FILTERS: { key: PrayerStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'answered', label: 'Answered' },
  { key: 'archived', label: 'Archived' },
]

const STATUS_BADGE: Record<PrayerStatus, string> = {
  active: 'text-gold border-gold/40 bg-gold/10',
  answered: 'text-emerald-400 border-emerald-600/40 bg-emerald-400/10',
  archived: 'text-ivory-dim border-forest-light',
}

const FILTER_EMPTY: Record<PrayerStatus | 'all', string> = {
  all: 'No prayer points yet.',
  active: 'No active prayer points right now.',
  answered: 'Mark a prayer as Answered when God responds to it.',
  archived: 'Archive prayers here to keep your active list focused.',
}

export default function Prayer() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [prayers, setPrayers] = useState<PrayerPoint[]>([])
  const [filter, setFilter] = useState<PrayerStatus | 'all'>('active')
  const [refreshKey, setRefreshKey] = useState(0)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [updateText, setUpdateText] = useState<Record<string, string>>({})
  const [addingTo, setAddingTo] = useState<string | null>(null)

  // Focus mode
  const [focusMode, setFocusMode] = useState(false)
  const [focusItems, setFocusItems] = useState<PrayerPoint[]>([])
  const [focusIndex, setFocusIndex] = useState(0)

  useEffect(() => {
    getAllPrayerPoints().then(setPrayers)
  }, [refreshKey])

  const filtered = filter === 'all' ? prayers : prayers.filter(p => p.status === filter)
  const activePrayers = prayers.filter(p => p.status === 'active')

  async function handleStatus(id: string, status: PrayerStatus) {
    await updatePrayerStatus(id, status)
    setRefreshKey(k => k + 1)
    showToast('Prayer updated')
  }

  async function handleAddUpdate(id: string) {
    const text = (updateText[id] ?? '').trim()
    if (!text) return
    await addPrayerUpdate(id, text)
    setUpdateText(t => ({ ...t, [id]: '' }))
    setAddingTo(null)
    setRefreshKey(k => k + 1)
    showToast('Update saved')
  }

  function startFocus() {
    if (activePrayers.length === 0) {
      showToast('No active prayer points to focus on')
      return
    }
    setFocusItems([...activePrayers])
    setFocusIndex(0)
    setFocusMode(true)
  }

  async function focusUpdateStatus(status: PrayerStatus) {
    const prayer = focusItems[focusIndex]
    if (!prayer) return
    await updatePrayerStatus(prayer.id, status)
    const newItems = focusItems.filter(p => p.id !== prayer.id)
    setRefreshKey(k => k + 1)
    if (newItems.length === 0) {
      setFocusMode(false)
      showToast(status === 'answered' ? 'Praise God! All active prayers reviewed.' : 'All active prayers reviewed.')
      return
    }
    setFocusItems(newItems)
    setFocusIndex(i => Math.min(i, newItems.length - 1))
  }

  function focusNext() {
    setFocusIndex(i => (i + 1) % focusItems.length)
  }

  function focusPrev() {
    setFocusIndex(i => (i - 1 + focusItems.length) % focusItems.length)
  }

  const focusPrayer = focusItems[focusIndex]

  return (
    <div className="px-5 pt-8 pb-4">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-semibold text-ivory tracking-tight">Prayer</h1>
        {activePrayers.length > 0 && (
          <button
            onClick={startFocus}
            className="flex items-center gap-1.5 text-xs font-semibold text-forest bg-gold px-3 py-2 rounded-xl"
          >
            <Play size={12} strokeWidth={2.5} />
            Focus
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-5">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
            className={`text-xs px-4 py-1.5 rounded-full border transition-colors ${
              filter === f.key
                ? 'bg-gold text-forest border-gold font-semibold'
                : 'border-forest-light text-ivory-dim'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {prayers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-forest-mid border border-forest-light flex items-center justify-center mb-4">
            <Heart size={26} className="text-gold" strokeWidth={1.5} />
          </div>
          <p className="text-ivory text-sm font-medium mb-1">No prayer points yet</p>
          <p className="text-ivory-dim text-xs leading-relaxed max-w-[240px] mb-6">
            Prayer points from your notes will appear here after you add them or use the Reflection Helper.
          </p>
          <Link
            to="/add"
            className="bg-gold text-forest text-sm font-semibold px-6 py-2.5 rounded-xl"
          >
            Create a note
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-ivory-muted text-sm">{FILTER_EMPTY[filter]}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(prayer => {
            const isQT = prayer.noteType === 'quiet_time'
            return (
              <div key={prayer.id} className="bg-forest-mid rounded-2xl border border-forest-light overflow-hidden">
                <div className="p-5">
                  {/* Source */}
                  <div className="flex items-center gap-1.5 mb-3">
                    {isQT
                      ? <Sun size={12} strokeWidth={2} className="text-gold shrink-0" />
                      : <BookOpen size={12} strokeWidth={2} className="text-gold shrink-0" />
                    }
                    <Link
                      to={`/notes/${prayer.sermonNoteId}`}
                      className="text-xs text-gold font-medium truncate"
                      onClick={e => e.stopPropagation()}
                    >
                      {prayer.sermonTitle}
                    </Link>
                    {isQT && (
                      <span className="text-[9px] font-semibold text-gold/60 border border-gold/20 px-1.5 py-0.5 rounded-full uppercase tracking-widest shrink-0">
                        Quiet Time
                      </span>
                    )}
                  </div>

                  {/* Prayer text + status badge */}
                  <div className="flex items-start gap-3 mb-3">
                    <p className="text-ivory text-sm leading-relaxed flex-1">{prayer.text}</p>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-widest px-2.5 py-0.5 rounded-full border shrink-0 ${STATUS_BADGE[prayer.status]}`}
                    >
                      {PRAYER_STATUS_LABELS[prayer.status]}
                    </span>
                  </div>

                  {/* Date + expand */}
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-ivory-dim">{formatDate(prayer.createdAt)}</p>
                    <button
                      onClick={() => setExpandedId(expandedId === prayer.id ? null : prayer.id)}
                      className="text-ivory-dim p-1 -mr-1"
                      aria-label={expandedId === prayer.id ? 'Collapse prayer' : 'Expand prayer'}
                    >
                      <ChevronDown
                        size={16}
                        strokeWidth={1.5}
                        className={`transition-transform ${expandedId === prayer.id ? 'rotate-180' : ''}`}
                      />
                    </button>
                  </div>
                </div>

                {expandedId === prayer.id && (
                  <div className="border-t border-forest-light px-5 py-4 space-y-4">
                    {/* Status Buttons */}
                    <div>
                      <p className="text-[10px] font-semibold text-ivory-dim uppercase tracking-widest mb-2">
                        Update Status
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(['active', 'answered', 'archived'] as PrayerStatus[]).map(s => (
                          <button
                            key={s}
                            onClick={() => handleStatus(prayer.id, s)}
                            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                              prayer.status === s
                                ? 'bg-gold text-forest border-gold font-semibold'
                                : 'border-forest-light text-ivory-dim'
                            }`}
                          >
                            {PRAYER_STATUS_LABELS[s]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Open note link */}
                    <Link
                      to={`/notes/${prayer.sermonNoteId}`}
                      className="flex items-center gap-1.5 text-xs text-gold font-medium"
                    >
                      {isQT
                        ? <Sun size={12} strokeWidth={2} />
                        : <BookOpen size={12} strokeWidth={2} />
                      }
                      Open note
                    </Link>

                    {/* Updates */}
                    {prayer.updates.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-ivory-dim uppercase tracking-widest mb-2">
                          Journal
                        </p>
                        <div className="space-y-2">
                          {prayer.updates.map(u => (
                            <p key={u.id} className="text-xs text-ivory-muted leading-relaxed">
                              <span className="text-ivory-dim mr-1.5">{formatDate(u.createdAt)}</span>
                              {u.text}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Add Update */}
                    {addingTo === prayer.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={updateText[prayer.id] ?? ''}
                          onChange={e => setUpdateText(t => ({ ...t, [prayer.id]: e.target.value }))}
                          rows={2}
                          placeholder="Share what God has been doing..."
                          className="w-full bg-forest border border-forest-light text-ivory rounded-xl px-3 py-2 text-sm placeholder:text-ivory-dim focus:outline-none focus:border-gold resize-none"
                          autoFocus
                        />
                        <div className="flex gap-2 items-center">
                          <button
                            onClick={() => setAddingTo(null)}
                            className="text-xs text-ivory-dim px-3 py-1.5"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleAddUpdate(prayer.id)}
                            className="text-xs bg-gold text-forest font-semibold px-4 py-1.5 rounded-lg"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAddingTo(prayer.id)}
                        className="flex items-center gap-1.5 text-xs text-gold font-medium"
                      >
                        <Plus size={13} strokeWidth={2.5} />
                        Add journal entry
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Prayer Focus Mode Overlay */}
      {focusMode && focusPrayer && (
        <div
          className="fixed inset-0 z-50 flex flex-col"
          style={{
            background: 'var(--app-bg)',
            paddingTop: 'max(1.5rem, env(safe-area-inset-top))',
            paddingBottom: 'max(6rem, env(safe-area-inset-bottom))',
          }}
        >
          {/* Focus header */}
          <div className="flex items-center justify-between px-6 py-4 shrink-0">
            <div className="flex items-center gap-2">
              <Heart size={16} className="text-gold" strokeWidth={1.5} />
              <span className="text-xs font-semibold text-gold uppercase tracking-widest">Prayer Focus</span>
            </div>
            <button
              onClick={() => setFocusMode(false)}
              className="text-ivory-dim p-1 -mr-1"
              aria-label="Exit focus mode"
            >
              <X size={22} strokeWidth={1.5} />
            </button>
          </div>

          {/* Progress */}
          <div className="px-6 mb-6 shrink-0">
            <p className="text-xs text-ivory-dim">{focusIndex + 1} of {focusItems.length}</p>
            <div className="flex gap-1 mt-2">
              {focusItems.map((_, i) => (
                <div
                  key={i}
                  className={`h-0.5 flex-1 rounded-full transition-colors ${i === focusIndex ? 'bg-gold' : 'bg-forest-light'}`}
                />
              ))}
            </div>
          </div>

          {/* Prayer card */}
          <div className="flex-1 overflow-y-auto px-6">
            <div className="bg-forest-mid rounded-2xl p-6 border border-forest-light mb-4">
              <div className="flex items-center gap-1.5 mb-4">
                {focusPrayer.noteType === 'quiet_time'
                  ? <Sun size={12} className="text-gold shrink-0" strokeWidth={2} />
                  : <BookOpen size={12} className="text-gold shrink-0" strokeWidth={2} />
                }
                <span className="text-xs text-gold font-medium truncate">{focusPrayer.sermonTitle}</span>
                {focusPrayer.noteType === 'quiet_time' && (
                  <span className="text-[9px] font-semibold text-gold/60 border border-gold/20 px-1.5 py-0.5 rounded-full uppercase tracking-widest shrink-0">
                    Quiet Time
                  </span>
                )}
              </div>
              <p className="text-ivory text-[17px] leading-relaxed font-medium mb-4">
                {focusPrayer.text}
              </p>
              {focusPrayer.updates.length > 0 && (
                <div className="border-t border-forest-light pt-4 mt-2">
                  <p className="text-[10px] font-semibold text-ivory-dim uppercase tracking-widest mb-2">Latest Journal</p>
                  <p className="text-ivory-muted text-sm leading-relaxed">
                    {focusPrayer.updates[focusPrayer.updates.length - 1].text}
                  </p>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex gap-3 mb-4">
              <button
                onClick={focusPrev}
                disabled={focusItems.length <= 1}
                className="flex-1 flex items-center justify-center gap-2 border border-forest-light text-ivory py-3 rounded-xl text-sm font-medium disabled:opacity-40"
              >
                <ChevronLeft size={16} strokeWidth={1.5} />
                Previous
              </button>
              <button
                onClick={focusNext}
                disabled={focusItems.length <= 1}
                className="flex-1 flex items-center justify-center gap-2 border border-forest-light text-ivory py-3 rounded-xl text-sm font-medium disabled:opacity-40"
              >
                Next
                <ChevronRight size={16} strokeWidth={1.5} />
              </button>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={() => focusUpdateStatus('answered')}
                className="w-full bg-gold text-forest font-semibold py-3 rounded-xl text-sm"
              >
                Mark Answered
              </button>
              <button
                onClick={() => focusUpdateStatus('archived')}
                className="w-full border border-forest-light text-ivory-dim py-3 rounded-xl text-sm"
              >
                Archive
              </button>
              <button
                onClick={() => {
                  setFocusMode(false)
                  navigate(`/notes/${focusPrayer.sermonNoteId}`)
                }}
                className="w-full text-gold text-sm font-medium py-2"
              >
                Open note →
              </button>
            </div>
          </div>
        </div>
      )}

      {focusMode && focusItems.length === 0 && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6 text-center"
          style={{ background: 'var(--app-bg)' }}
        >
          <Heart size={32} className="text-gold mb-4" strokeWidth={1.5} />
          <p className="text-ivory font-semibold mb-2">All prayers reviewed</p>
          <p className="text-ivory-dim text-sm mb-6">Every faithful prayer matters.</p>
          <button
            onClick={() => setFocusMode(false)}
            className="bg-gold text-forest font-semibold px-6 py-3 rounded-xl text-sm"
          >
            Done
          </button>
        </div>
      )}
    </div>
  )
}
