import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  BookMarked, Search, BookOpen, Sun,
  Eye, EyeOff, ExternalLink, Copy, X, Pencil,
} from 'lucide-react'
import { getAllSermonNotes, updateSermonNote } from '../db/database'
import { useToast } from '../components/Toast'
import { buildBibleSearchUrl } from '../lib/bibleLinks'
import { getNoteType, MEMORY_STATUS_LABELS } from '../types'
import type { SermonNote, MemoryStatus } from '../types'

const MEDITATION_PROMPTS = [
  'What word or phrase stands out to you?',
  'What does this passage reveal about God?',
  'What is this passage saying to you personally?',
  'What should you slow down and sit with today?',
  'What truth do you want to carry with you?',
]

const MEM_FILTERS: { key: 'all' | MemoryStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'not_started', label: 'Not started' },
  { key: 'memorizing', label: 'Memorizing' },
  { key: 'memorized', label: 'Memorized' },
]

function firstLetters(text: string): string {
  return text.split(/\s+/).filter(Boolean).map(w => w[0]).join(' ')
}

export default function Scripture() {
  const { showToast } = useToast()
  const [allNotes, setAllNotes] = useState<SermonNote[]>([])
  const [search, setSearch] = useState('')
  const [memFilter, setMemFilter] = useState<'all' | MemoryStatus>('all')
  const [refreshKey, setRefreshKey] = useState(0)

  // Meditation mode
  const [meditationNote, setMeditationNote] = useState<SermonNote | null>(null)
  const [editingMeditation, setEditingMeditation] = useState(false)
  const [meditationText, setMeditationText] = useState('')

  // Practice mode
  const [practiceNote, setPracticeNote] = useState<SermonNote | null>(null)
  const [showVerse, setShowVerse] = useState(true)
  const [showFirstLetters, setShowFirstLetters] = useState(false)

  useEffect(() => {
    getAllSermonNotes().then(setAllNotes)
  }, [refreshKey])

  const scriptureNotes = useMemo(() => {
    let notes = allNotes.filter(n =>
      n.mainBiblePassage || n.scriptureText || n.memoryVerse
    )

    if (memFilter !== 'all') {
      notes = notes.filter(n => (n.memoryStatus ?? 'not_started') === memFilter)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      notes = notes.filter(n =>
        n.title.toLowerCase().includes(q) ||
        (n.mainBiblePassage?.toLowerCase().includes(q) ?? false) ||
        (n.scriptureText?.toLowerCase().includes(q) ?? false) ||
        (n.memoryVerse?.toLowerCase().includes(q) ?? false)
      )
    }

    return notes
  }, [allNotes, search, memFilter])

  const hasAnyScripture = allNotes.some(n => n.mainBiblePassage || n.scriptureText || n.memoryVerse)

  function openMeditation(note: SermonNote) {
    setMeditationNote(note)
    setMeditationText(note.meditationNotes ?? '')
    setEditingMeditation(false)
  }

  async function saveMeditation() {
    if (!meditationNote) return
    await updateSermonNote(meditationNote.id, { meditationNotes: meditationText.trim() || undefined })
    setMeditationNote(prev => prev ? { ...prev, meditationNotes: meditationText.trim() || undefined } : null)
    setEditingMeditation(false)
    setRefreshKey(k => k + 1)
    showToast('Meditation notes saved')
  }

  function openPractice(note: SermonNote) {
    setPracticeNote(note)
    setShowVerse(true)
    setShowFirstLetters(false)
  }

  async function updateMemStatus(status: MemoryStatus) {
    if (!practiceNote) return
    await updateSermonNote(practiceNote.id, { memoryStatus: status })
    setPracticeNote(prev => prev ? { ...prev, memoryStatus: status } : null)
    setRefreshKey(k => k + 1)
    showToast('Memory status updated')
  }

  async function copyText(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text)
      showToast(`${label} copied`)
    } catch {
      showToast('Could not copy', 'error')
    }
  }

  const practiceText = practiceNote?.scriptureText || practiceNote?.memoryVerse || ''

  return (
    <div className="px-5 pt-8 pb-4">
      <h1 className="text-2xl font-semibold text-ivory tracking-tight mb-1">Scripture</h1>
      <p className="text-ivory-dim text-sm mb-5 leading-relaxed">
        Meditate and memorise Scripture from your notes.
      </p>

      {/* Search */}
      <div className="relative mb-4">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-ivory-dim pointer-events-none"
          strokeWidth={2}
        />
        <input
          type="search"
          placeholder="Search by passage, title, or text…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-forest-mid border border-forest-light text-ivory rounded-xl pl-10 pr-4 py-3 text-sm placeholder:text-ivory-dim focus:outline-none focus:border-gold transition-colors"
        />
      </div>

      {/* Memory status filter */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-5 scrollbar-none -mx-5 px-5">
        {MEM_FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setMemFilter(f.key)}
            aria-pressed={memFilter === f.key}
            className={`shrink-0 text-xs px-4 py-1.5 rounded-full border transition-colors ${
              memFilter === f.key
                ? 'bg-gold text-forest border-gold font-semibold'
                : 'border-forest-light text-ivory-dim'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {!hasAnyScripture ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-forest-mid border border-forest-light flex items-center justify-center mb-4">
            <BookMarked size={26} className="text-gold" strokeWidth={1.5} />
          </div>
          <p className="text-ivory text-sm font-medium mb-1">No Scripture entries yet</p>
          <p className="text-ivory-dim text-xs leading-relaxed max-w-[240px] mb-6">
            Add a Bible passage to a note, or type the full Scripture text in a Quiet Time for meditation and memory practice.
          </p>
          <Link
            to="/add/quiet-time"
            className="bg-gold text-forest text-sm font-semibold px-6 py-2.5 rounded-xl"
          >
            Start a Quiet Time
          </Link>
        </div>
      ) : scriptureNotes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-ivory-muted text-sm">No entries match your search or filter.</p>
          <button
            onClick={() => { setSearch(''); setMemFilter('all') }}
            className="mt-3 text-gold text-xs font-medium"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {scriptureNotes.map(note => {
            const isQT = getNoteType(note) === 'quiet_time'
            const memStatus = note.memoryStatus ?? 'not_started'
            const hasPracticeText = !!(note.scriptureText || note.memoryVerse)
            return (
              <div key={note.id} className="bg-forest-mid rounded-2xl border border-forest-light overflow-hidden">
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      {note.mainBiblePassage && (
                        <div className="flex items-center gap-1.5 mb-1">
                          <BookMarked size={12} strokeWidth={2} className="text-gold shrink-0" />
                          <span className="text-sm font-semibold text-gold truncate">{note.mainBiblePassage}</span>
                        </div>
                      )}
                      <Link
                        to={`/notes/${note.id}`}
                        className="text-xs text-ivory-dim hover:text-ivory transition-colors truncate block"
                      >
                        {note.title}
                      </Link>
                    </div>
                    {isQT && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-gold border border-gold/20 px-1.5 py-0.5 rounded-full uppercase tracking-widest shrink-0">
                        <Sun size={8} strokeWidth={2} />
                        QT
                      </span>
                    )}
                  </div>

                  {/* Scripture text preview */}
                  {note.scriptureText && (
                    <p className="text-ivory-muted text-sm leading-relaxed line-clamp-2 italic mb-2.5">
                      "{note.scriptureText}"
                    </p>
                  )}

                  {/* Memory status badge */}
                  {memStatus !== 'not_started' && (
                    <span className={`inline-block text-[10px] font-semibold px-2.5 py-0.5 rounded-full border mb-3 ${
                      memStatus === 'memorized'
                        ? 'text-emerald-400 border-emerald-600/40 bg-emerald-400/10'
                        : 'text-gold border-gold/40 bg-gold/10'
                    }`}>
                      {MEMORY_STATUS_LABELS[memStatus]}
                    </span>
                  )}

                  {/* Meditation preview */}
                  {note.meditationNotes && (
                    <p className="text-xs text-ivory-dim leading-relaxed line-clamp-1 mb-3">
                      {note.meditationNotes}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap mt-1">
                    <button
                      onClick={() => openMeditation(note)}
                      className="text-xs font-semibold text-forest bg-gold px-3 py-1.5 rounded-lg"
                    >
                      Meditate
                    </button>
                    {hasPracticeText && (
                      <button
                        onClick={() => openPractice(note)}
                        className="text-xs font-medium text-ivory border border-forest-light px-3 py-1.5 rounded-lg"
                      >
                        Practice Memory
                      </button>
                    )}
                    {note.mainBiblePassage && (
                      <a
                        href={buildBibleSearchUrl(note.mainBiblePassage)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-ivory-dim border border-forest-light px-3 py-1.5 rounded-lg"
                      >
                        <ExternalLink size={11} strokeWidth={2} />
                        Open
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Meditation Mode Overlay ── */}
      {meditationNote && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'var(--app-bg)' }}>
          <div className="flex-1 overflow-y-auto">
            <div className="px-5 pt-6 pb-10">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1 min-w-0 pr-3">
                  <p className="text-[10px] font-semibold text-gold uppercase tracking-widest mb-1">Meditation</p>
                  {meditationNote.mainBiblePassage && (
                    <h2 className="text-xl font-semibold text-ivory leading-tight">{meditationNote.mainBiblePassage}</h2>
                  )}
                  <p className="text-xs text-ivory-dim mt-0.5">{meditationNote.title}</p>
                </div>
                <button
                  onClick={() => setMeditationNote(null)}
                  className="text-ivory-dim p-1 -mr-1 shrink-0"
                  aria-label="Close meditation"
                >
                  <X size={22} strokeWidth={1.5} />
                </button>
              </div>

              {/* Scripture text */}
              {meditationNote.scriptureText && (
                <div className="bg-forest-mid rounded-2xl p-5 border border-forest-light mb-5">
                  <p className="text-[10px] font-semibold text-ivory-dim uppercase tracking-widest mb-3">Scripture</p>
                  <p className="text-ivory text-sm leading-relaxed whitespace-pre-wrap italic">
                    "{meditationNote.scriptureText}"
                  </p>
                  <button
                    onClick={() => copyText(meditationNote.scriptureText!, 'Scripture text')}
                    className="flex items-center gap-1 mt-3 text-xs text-gold/60 hover:text-gold transition-colors"
                  >
                    <Copy size={10} strokeWidth={2} />
                    Copy text
                  </button>
                </div>
              )}

              {/* Passage link (if no scripture text but has passage) */}
              {!meditationNote.scriptureText && meditationNote.mainBiblePassage && (
                <div className="bg-forest-mid rounded-2xl p-4 border border-forest-light mb-5 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gold">{meditationNote.mainBiblePassage}</span>
                  <a
                    href={buildBibleSearchUrl(meditationNote.mainBiblePassage)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-gold/60 hover:text-gold"
                  >
                    <ExternalLink size={12} strokeWidth={2} />
                    Open
                  </a>
                </div>
              )}

              {/* Meditation prompts */}
              <div className="bg-forest-mid rounded-2xl p-5 border border-gold/20 mb-5">
                <p className="text-[10px] font-semibold text-gold uppercase tracking-widest mb-3">
                  Meditation Prompts
                </p>
                <div className="space-y-2">
                  {MEDITATION_PROMPTS.map((prompt, i) => (
                    <p key={i} className="text-ivory-dim text-sm leading-relaxed">
                      {i + 1}. {prompt}
                    </p>
                  ))}
                </div>
              </div>

              {/* Meditation notes */}
              <div className="bg-forest-mid rounded-2xl p-5 border border-forest-light mb-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-semibold text-ivory-dim uppercase tracking-widest">
                    Your Meditation Notes
                  </p>
                  {!editingMeditation && (
                    <button
                      onClick={() => setEditingMeditation(true)}
                      className="flex items-center gap-1 text-xs text-gold"
                    >
                      <Pencil size={11} strokeWidth={2} />
                      Edit
                    </button>
                  )}
                </div>
                {editingMeditation ? (
                  <div className="space-y-3">
                    <textarea
                      value={meditationText}
                      onChange={e => setMeditationText(e.target.value)}
                      rows={5}
                      placeholder="What stood out? What is God saying? What truth will you carry?"
                      className="w-full bg-forest border border-forest-light text-ivory rounded-xl px-3 py-2.5 text-sm placeholder:text-ivory-dim focus:outline-none focus:border-gold resize-none"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingMeditation(false)}
                        className="text-xs text-ivory-dim px-3 py-1.5 border border-forest-light rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveMeditation}
                        className="text-xs bg-gold text-forest font-semibold px-4 py-1.5 rounded-lg"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setEditingMeditation(true)} className="w-full text-left">
                    {meditationNote.meditationNotes ? (
                      <p className="text-ivory text-sm leading-relaxed whitespace-pre-wrap">
                        {meditationNote.meditationNotes}
                      </p>
                    ) : (
                      <p className="text-ivory-dim text-sm italic">Tap to write your meditation notes…</p>
                    )}
                  </button>
                )}
              </div>

              {/* Link to full note */}
              <Link
                to={`/notes/${meditationNote.id}`}
                onClick={() => setMeditationNote(null)}
                className="flex items-center gap-1.5 text-xs text-gold font-medium"
              >
                <BookOpen size={12} strokeWidth={2} />
                Open full note
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Practice Mode Overlay ── */}
      {practiceNote && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'var(--app-bg)' }}>
          <div className="flex-1 overflow-y-auto">
            <div className="px-5 pt-6 pb-10">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1 min-w-0 pr-3">
                  <p className="text-[10px] font-semibold text-gold uppercase tracking-widest mb-1">Memory Practice</p>
                  {practiceNote.mainBiblePassage && (
                    <h2 className="text-xl font-semibold text-ivory leading-tight">{practiceNote.mainBiblePassage}</h2>
                  )}
                  <p className="text-xs text-ivory-dim mt-0.5">{practiceNote.title}</p>
                </div>
                <button
                  onClick={() => setPracticeNote(null)}
                  className="text-ivory-dim p-1 -mr-1 shrink-0"
                  aria-label="Close practice"
                >
                  <X size={22} strokeWidth={1.5} />
                </button>
              </div>

              {/* Toggle controls */}
              <div className="flex gap-2 mb-5 flex-wrap">
                <button
                  onClick={() => { setShowVerse(v => !v); setShowFirstLetters(false) }}
                  className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border transition-colors ${
                    showVerse
                      ? 'bg-forest-mid border-forest-light text-ivory'
                      : 'border-gold text-gold'
                  }`}
                >
                  {showVerse
                    ? <EyeOff size={13} strokeWidth={2} />
                    : <Eye size={13} strokeWidth={2} />
                  }
                  {showVerse ? 'Hide verse' : 'Show verse'}
                </button>
                {!showVerse && practiceText && (
                  <button
                    onClick={() => setShowFirstLetters(f => !f)}
                    className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border transition-colors ${
                      showFirstLetters
                        ? 'bg-gold/10 border-gold text-gold'
                        : 'border-forest-light text-ivory-dim'
                    }`}
                  >
                    {showFirstLetters ? 'Show full letters' : 'First letters only'}
                  </button>
                )}
              </div>

              {/* Verse display */}
              <div className="bg-forest-mid rounded-2xl p-5 border border-forest-light mb-5 min-h-[100px]">
                {practiceText ? (
                  showVerse ? (
                    <p className="text-ivory text-sm leading-relaxed whitespace-pre-wrap italic">
                      "{practiceText}"
                    </p>
                  ) : showFirstLetters ? (
                    <>
                      <p className="text-[10px] font-semibold text-ivory-dim uppercase tracking-widest mb-2">First letters</p>
                      <p className="text-ivory text-base leading-loose font-mono tracking-widest">
                        {firstLetters(practiceText)}
                      </p>
                    </>
                  ) : (
                    <p className="text-ivory-dim text-sm italic">Verse hidden — recite it from memory.</p>
                  )
                ) : (
                  <p className="text-ivory-dim text-sm italic">
                    Add Scripture Text or Memory Verse to this note to practice here.
                  </p>
                )}
              </div>

              {/* Copy text */}
              {practiceText && showVerse && (
                <button
                  onClick={() => copyText(practiceText, 'Verse')}
                  className="flex items-center gap-1.5 text-xs text-gold/60 hover:text-gold transition-colors mb-5"
                >
                  <Copy size={11} strokeWidth={2} />
                  Copy verse
                </button>
              )}

              {/* Memory status */}
              <div className="bg-forest-mid rounded-2xl p-5 border border-forest-light mb-5">
                <p className="text-[10px] font-semibold text-ivory-dim uppercase tracking-widest mb-3">
                  How is memorisation going?
                </p>
                <div className="flex flex-wrap gap-2">
                  {(['not_started', 'memorizing', 'memorized'] as MemoryStatus[]).map(s => (
                    <button
                      key={s}
                      onClick={() => updateMemStatus(s)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        (practiceNote.memoryStatus ?? 'not_started') === s
                          ? 'bg-gold text-forest border-gold font-semibold'
                          : 'border-forest-light text-ivory-dim'
                      }`}
                    >
                      {MEMORY_STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Memory notes (read-only) */}
              {practiceNote.memoryNotes && (
                <div className="bg-forest-mid rounded-2xl p-4 border border-forest-light mb-5">
                  <p className="text-[10px] font-semibold text-ivory-dim uppercase tracking-widest mb-2">Memory Notes</p>
                  <p className="text-ivory-muted text-sm leading-relaxed">{practiceNote.memoryNotes}</p>
                </div>
              )}

              {/* Link to full note */}
              <Link
                to={`/notes/${practiceNote.id}`}
                onClick={() => setPracticeNote(null)}
                className="flex items-center gap-1.5 text-xs text-gold font-medium"
              >
                <BookOpen size={12} strokeWidth={2} />
                Open full note
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
