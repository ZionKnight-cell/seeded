import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Search, Star, BookOpen, Sun } from 'lucide-react'
import { db } from '../db/database'
import { formatDate } from '../lib/dates'
import { ALL_CATEGORIES, CATEGORY_LABELS, getNoteType } from '../types'
import type { SermonNote } from '../types'

function noteNeedsReflection(note: SermonNote): boolean {
  return !!(note.fullNotes && (!note.prayerPoint || !note.weeklyActionStep))
}

const CHIPS = [
  { key: 'all', label: 'All' },
  { key: 'sermons', label: 'Sermons' },
  { key: 'quiet_time', label: 'Quiet Time' },
  { key: 'favorites', label: 'Favorites' },
  { key: 'needs_reflection', label: 'Needs Reflection' },
  ...ALL_CATEGORIES.map(c => ({ key: c, label: CATEGORY_LABELS[c] })),
]

export default function Notes() {
  const [allNotes, setAllNotes] = useState<SermonNote[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    db.sermonNotes.orderBy('sermonDate').reverse().toArray().then(setAllNotes)
  }, [])

  const filtered = useMemo(() => {
    let notes = allNotes

    if (filter === 'sermons') {
      notes = notes.filter(n => getNoteType(n) === 'sermon')
    } else if (filter === 'quiet_time') {
      notes = notes.filter(n => getNoteType(n) === 'quiet_time')
    } else if (filter === 'favorites') {
      notes = notes.filter(n => n.isFavorite)
    } else if (filter === 'needs_reflection') {
      notes = notes.filter(noteNeedsReflection)
    } else if (filter !== 'all') {
      notes = notes.filter(n => n.category === filter)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      notes = notes.filter(n =>
        n.title.toLowerCase().includes(q) ||
        (n.preacherName?.toLowerCase().includes(q) ?? false) ||
        (n.churchName?.toLowerCase().includes(q) ?? false) ||
        (n.mainBiblePassage?.toLowerCase().includes(q) ?? false) ||
        (n.otherScriptureReferences?.toLowerCase().includes(q) ?? false) ||
        (n.devotionalSource?.toLowerCase().includes(q) ?? false) ||
        (n.mainTakeaway?.toLowerCase().includes(q) ?? false) ||
        (n.fullNotes?.toLowerCase().includes(q) ?? false) ||
        (n.keyQuote?.toLowerCase().includes(q) ?? false) ||
        (n.personalConviction?.toLowerCase().includes(q) ?? false) ||
        (n.gratitude?.toLowerCase().includes(q) ?? false) ||
        (n.seasonMood?.toLowerCase().includes(q) ?? false) ||
        (n.answeredPrayer?.toLowerCase().includes(q) ?? false) ||
        (n.category ? CATEGORY_LABELS[n.category].toLowerCase().includes(q) : false) ||
        (n.tags?.some(t => t.toLowerCase().includes(q)) ?? false)
      )
    }

    return notes
  }, [allNotes, search, filter])

  return (
    <div className="px-5 pt-8 pb-4">
      <h1 className="text-2xl font-semibold text-ivory tracking-tight mb-5">Notes</h1>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ivory-dim pointer-events-none" strokeWidth={2} />
        <input
          type="search"
          placeholder="Search by title, passage, tags…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search notes"
          className="w-full bg-forest-mid border border-forest-light text-ivory rounded-xl pl-10 pr-4 py-3 text-sm placeholder:text-ivory-dim focus:outline-none focus:border-gold transition-colors"
        />
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-5 scrollbar-none -mx-5 px-5">
        {CHIPS.map(chip => (
          <button
            key={chip.key}
            onClick={() => setFilter(chip.key)}
            aria-pressed={filter === chip.key}
            className={`shrink-0 text-xs px-4 py-1.5 rounded-full border transition-colors ${
              filter === chip.key
                ? 'bg-gold text-forest border-gold font-semibold'
                : 'border-forest-light text-ivory-dim'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* States */}
      {allNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-forest-mid border border-forest-light flex items-center justify-center mb-4">
            <BookOpen size={26} className="text-gold" strokeWidth={1.5} />
          </div>
          <p className="text-ivory text-sm font-medium mb-1">No notes yet</p>
          <p className="text-ivory-dim text-xs leading-relaxed max-w-[240px] mb-6">
            Sermon notes and quiet time entries you create will appear here.
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
          <p className="text-ivory-muted text-sm">
            {filter === 'needs_reflection'
              ? 'Nothing waiting for reflection — all your notes with content have a prayer point and growth step.'
              : 'No notes match your search.'}
          </p>
          <button
            onClick={() => { setSearch(''); setFilter('all') }}
            className="mt-3 text-gold text-xs font-medium"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(note => {
            const reflectionNeeded = noteNeedsReflection(note)
            const isQT = getNoteType(note) === 'quiet_time'
            return (
              <Link
                key={note.id}
                to={`/notes/${note.id}`}
                className="block bg-forest-mid rounded-2xl p-5 border border-forest-light active:opacity-80 transition-opacity"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h2 className="text-ivory text-[15px] font-semibold leading-snug">{note.title}</h2>
                  {note.isFavorite && (
                    <Star size={14} className="text-gold shrink-0 mt-0.5" fill="currentColor" strokeWidth={0} aria-label="Favorite" />
                  )}
                </div>
                <div className="flex flex-wrap gap-x-2 text-xs text-ivory-dim mb-2">
                  <span>{formatDate(note.sermonDate)}</span>
                  {!isQT && note.preacherName && <span>· {note.preacherName}</span>}
                  {!isQT && note.churchName && <span>· {note.churchName}</span>}
                </div>
                {note.mainBiblePassage && (
                  <p className="text-[11px] text-gold mb-2">{note.mainBiblePassage}</p>
                )}
                {note.mainTakeaway && (
                  <p className="text-ivory-muted text-xs leading-relaxed line-clamp-2">
                    {note.mainTakeaway}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  {isQT && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gold bg-forest-light px-2.5 py-0.5 rounded-full uppercase tracking-widest">
                      <Sun size={8} strokeWidth={2} />
                      Quiet Time
                    </span>
                  )}
                  {!isQT && note.category && (
                    <span className="text-[10px] font-semibold text-gold bg-forest-light px-2.5 py-0.5 rounded-full uppercase tracking-widest">
                      {CATEGORY_LABELS[note.category]}
                    </span>
                  )}
                  {reflectionNeeded && (
                    <span className="text-[10px] font-medium text-gold/60 border border-gold/20 px-2.5 py-0.5 rounded-full">
                      Needs reflection
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
