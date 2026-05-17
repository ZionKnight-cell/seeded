import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Heart, ChevronDown, Plus } from 'lucide-react'
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

export default function Prayer() {
  const { showToast } = useToast()
  const [prayers, setPrayers] = useState<PrayerPoint[]>([])
  const [filter, setFilter] = useState<PrayerStatus | 'all'>('active')
  const [refreshKey, setRefreshKey] = useState(0)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [updateText, setUpdateText] = useState<Record<string, string>>({})
  const [addingTo, setAddingTo] = useState<string | null>(null)

  useEffect(() => {
    getAllPrayerPoints().then(setPrayers)
  }, [refreshKey])

  const filtered = filter === 'all' ? prayers : prayers.filter(p => p.status === filter)

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

  return (
    <div className="px-5 pt-8 pb-4">
      <h1 className="text-2xl font-semibold text-ivory tracking-tight mb-5">Prayer</h1>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-5">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
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
          <p className="text-ivory-muted text-sm font-medium mb-1">No prayer items yet</p>
          <p className="text-ivory-dim text-xs leading-relaxed max-w-[220px]">
            Prayer points from your sermon notes will appear here.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-ivory-muted text-sm">No {filter} prayer items.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(prayer => (
            <div key={prayer.id} className="bg-forest-mid rounded-2xl border border-forest-light overflow-hidden">
              <div className="p-5">
                <div className="flex items-start gap-3 mb-3">
                  <p className="text-ivory text-sm leading-relaxed flex-1">{prayer.text}</p>
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-widest px-2.5 py-0.5 rounded-full border shrink-0 ${STATUS_BADGE[prayer.status]}`}
                  >
                    {PRAYER_STATUS_LABELS[prayer.status]}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-ivory-dim">
                    <Link
                      to={`/notes/${prayer.sermonNoteId}`}
                      className="text-gold font-medium"
                      onClick={e => e.stopPropagation()}
                    >
                      {prayer.sermonTitle}
                    </Link>
                    <span className="ml-2">{formatDate(prayer.createdAt)}</span>
                  </p>
                  <button
                    onClick={() => setExpandedId(expandedId === prayer.id ? null : prayer.id)}
                    className="text-ivory-dim p-1 -mr-1"
                    aria-label="Expand"
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

                  {/* Updates */}
                  {prayer.updates.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-ivory-dim uppercase tracking-widest mb-2">
                        Updates
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
                      Add update
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
