import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ChevronLeft,
  Pencil,
  Trash2,
  Star,
  BookOpen,
  Sun,
  Heart,
  Target,
  Lightbulb,
  ExternalLink,
  Copy,
  Share2,
  Download,
  Printer,
  X,
  Image,
} from 'lucide-react'
import { getSermonNote, deleteSermonNote, updateSermonNote, getAttachments } from '../db/database'
import { useToast } from '../components/Toast'
import { formatDate } from '../lib/dates'
import { buildBibleSearchUrl, parseScriptureReferences } from '../lib/bibleLinks'
import { noteToText, downloadNoteAsText, shareNote } from '../lib/noteExport'
import { CATEGORY_LABELS, FOLLOW_UP_LABELS, getNoteType } from '../types'
import type { SermonNote, FollowUpStatus, NoteAttachment } from '../types'

function Card({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-forest-mid rounded-2xl p-5 border border-forest-light">
      <p className="text-[10px] font-semibold text-gold uppercase tracking-widest mb-3">{label}</p>
      {children}
    </div>
  )
}

function PassageActions({ reference }: { reference: string }) {
  const { showToast } = useToast()
  async function copyRef() {
    try {
      await navigator.clipboard.writeText(reference)
      showToast('Reference copied')
    } catch {
      showToast('Could not copy — please copy manually', 'error')
    }
  }
  return (
    <div className="flex items-center gap-4 mt-1.5 flex-wrap">
      <a
        href={buildBibleSearchUrl(reference)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-xs text-gold/60 hover:text-gold transition-colors"
      >
        <ExternalLink size={10} strokeWidth={2} />
        Open externally
      </a>
      <button
        onClick={copyRef}
        className="flex items-center gap-1 text-xs text-gold/60 hover:text-gold transition-colors"
      >
        <Copy size={10} strokeWidth={2} />
        Copy
      </button>
    </div>
  )
}

function needsReflection(note: SermonNote): boolean {
  return !!(note.fullNotes && (!note.prayerPoint || !note.weeklyActionStep))
}

export default function NoteDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [note, setNote] = useState<SermonNote | null>(null)
  const [attachments, setAttachments] = useState<NoteAttachment[]>([])
  const [notFound, setNotFound] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!id) return
    const n = await getSermonNote(id)
    if (!n) setNotFound(true)
    else {
      setNote(n)
      getAttachments(id).then(setAttachments)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  async function handleFavorite() {
    if (!note) return
    const next = !note.isFavorite
    await updateSermonNote(note.id, { isFavorite: next })
    setNote({ ...note, isFavorite: next })
    showToast(next ? 'Added to favorites' : 'Removed from favorites')
  }

  async function handleStatus(status: FollowUpStatus) {
    if (!note) return
    await updateSermonNote(note.id, { followUpStatus: status })
    setNote({ ...note, followUpStatus: status })
    showToast('Status updated')
  }

  async function handleDelete() {
    if (!note) return
    setDeleting(true)
    await deleteSermonNote(note.id)
    navigate('/notes')
  }

  async function handleShare() {
    if (!note) return
    const result = await shareNote(note)
    if (result === 'unavailable') {
      handleDownload()
    }
    setShowExport(false)
  }

  function handleDownload() {
    if (!note) return
    downloadNoteAsText(note)
    setShowExport(false)
    showToast('Note exported')
  }

  async function handleCopyText() {
    if (!note) return
    try {
      await navigator.clipboard.writeText(noteToText(note))
      showToast('Note copied to clipboard')
    } catch {
      showToast('Could not copy — try Download instead', 'error')
    }
    setShowExport(false)
  }

  function handlePrint() {
    setShowExport(false)
    setTimeout(() => window.print(), 100)
  }

  if (notFound) {
    return (
      <div className="px-5 pt-12 text-center">
        <p className="text-ivory font-medium mb-2">Note not found</p>
        <p className="text-ivory-dim text-sm mb-6">This note may have been deleted.</p>
        <Link to="/notes" className="text-gold text-sm font-medium">← Back to Notes</Link>
      </div>
    )
  }

  if (!note) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-ivory-dim text-sm">Loading...</p>
      </div>
    )
  }

  const noteType = getNoteType(note)
  const isQT = noteType === 'quiet_time'

  return (
    <div className="px-5 pt-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Link to="/notes" className="text-ivory-dim -ml-1 p-1" aria-label="Back">
          <ChevronLeft size={24} strokeWidth={1.5} />
        </Link>
        <div className="flex items-center gap-1">
          <button
            onClick={handleFavorite}
            className={`p-1.5 transition-colors ${note.isFavorite ? 'text-gold' : 'text-ivory-dim'}`}
            aria-label="Toggle favorite"
          >
            <Star size={20} strokeWidth={1.5} fill={note.isFavorite ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={() => setShowExport(true)}
            className="text-ivory-dim hover:text-ivory transition-colors p-1.5"
            aria-label="Export or share note"
          >
            <Share2 size={20} strokeWidth={1.5} />
          </button>
          <Link
            to={`/notes/${note.id}/edit`}
            className="text-ivory-dim hover:text-ivory transition-colors p-1.5"
            aria-label="Edit"
          >
            <Pencil size={20} strokeWidth={1.5} />
          </Link>
          <button
            onClick={() => setShowDelete(true)}
            className="text-ivory-dim hover:text-red-400 transition-colors p-1.5"
            aria-label="Delete"
          >
            <Trash2 size={20} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Print header (hidden on screen) */}
      <div className="hidden print:block mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest mb-1 opacity-60">Seeded — {isQT ? 'Quiet Time' : 'Sermon Note'}</p>
      </div>

      {/* Title & Meta */}
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-ivory tracking-tight leading-tight mb-3">
          {note.title}
        </h1>
        <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-ivory-dim">
          {note.sermonDate && <span>{formatDate(note.sermonDate)}</span>}
          {!isQT && note.churchName && <span>· {note.churchName}</span>}
          {!isQT && note.preacherName && <span>· {note.preacherName}</span>}
        </div>
        {!isQT && note.seriesName && (
          <p className="text-xs text-ivory-dim mt-1 italic">
            {note.seriesName}{note.seriesPart ? ` — ${note.seriesPart}` : ''}
          </p>
        )}
        <div className="flex flex-wrap gap-2 mt-2.5">
          {isQT && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gold bg-forest-light px-3 py-1 rounded-full uppercase tracking-widest">
              <Sun size={9} strokeWidth={2} />
              Quiet Time
            </span>
          )}
          {!isQT && note.category && (
            <span className="inline-block text-[10px] font-semibold text-gold bg-forest-light px-3 py-1 rounded-full uppercase tracking-widest">
              {CATEGORY_LABELS[note.category]}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {/* Scripture */}
        {(note.mainBiblePassage || (!isQT && note.otherScriptureReferences)) && (
          <Card label="Scripture">
            <div className="flex items-start gap-2">
              <BookOpen size={14} className="text-gold mt-0.5 shrink-0" strokeWidth={2} />
              <div className="flex-1 min-w-0">
                {note.mainBiblePassage && (
                  <>
                    <p className="text-ivory text-sm font-medium">{note.mainBiblePassage}</p>
                    <PassageActions reference={note.mainBiblePassage} />
                  </>
                )}
                {!isQT && note.otherScriptureReferences && (
                  <div className="mt-3 space-y-2">
                    {parseScriptureReferences(note.otherScriptureReferences).map(ref => (
                      <div key={ref}>
                        <p className="text-ivory-muted text-sm">{ref}</p>
                        <PassageActions reference={ref} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Devotional Source (QT only) */}
        {isQT && note.devotionalSource && (
          <Card label="Devotional Source">
            <p className="text-ivory text-sm leading-relaxed">{note.devotionalSource}</p>
          </Card>
        )}

        {/* Full Notes */}
        {note.fullNotes && (
          <Card label={isQT ? 'What I Read' : 'Notes'}>
            <p className="text-ivory text-sm leading-relaxed whitespace-pre-wrap">{note.fullNotes}</p>
          </Card>
        )}

        {/* Key Quote */}
        {note.keyQuote && (
          <Card label={isQT ? 'Verse or Phrase that Stood Out' : 'Key Quote'}>
            <p className="text-ivory text-sm leading-relaxed italic">"{note.keyQuote}"</p>
          </Card>
        )}

        {/* Takeaway */}
        {note.mainTakeaway && (
          <Card label={isQT ? 'What Stood Out Most' : 'Main Takeaway'}>
            <div className="flex items-start gap-2">
              <Lightbulb size={14} className="text-gold mt-0.5 shrink-0" strokeWidth={2} />
              <p className="text-ivory text-sm leading-relaxed">{note.mainTakeaway}</p>
            </div>
          </Card>
        )}

        {/* Conviction / Personal Reflection */}
        {note.personalConviction && (
          <Card label={isQT ? 'Personal Reflection' : 'Personal Conviction'}>
            <p className="text-ivory text-sm leading-relaxed">{note.personalConviction}</p>
          </Card>
        )}

        {/* Reflection prompt */}
        {needsReflection(note) && (
          <div className="bg-forest-mid rounded-2xl p-5 border border-gold/20 print:hidden">
            <div className="flex items-start gap-3">
              <Lightbulb size={15} className="text-gold shrink-0 mt-0.5" strokeWidth={1.5} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ivory mb-1">Reflection not finished yet</p>
                <p className="text-xs text-ivory-dim leading-relaxed mb-3">
                  {isQT
                    ? 'This quiet time note has content but is missing a prayer point or growth step. Use the Reflection Helper to complete it.'
                    : 'This note has sermon notes but is missing a prayer point or growth step. Use the Reflection Helper to complete it.'}
                </p>
                <Link
                  to={`/notes/${note.id}/edit`}
                  className="text-xs font-semibold text-forest bg-gold px-4 py-2 rounded-lg inline-block"
                >
                  Complete reflection
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Prayer */}
        {note.prayerPoint && (
          <Card label="Prayer Point">
            <div className="flex items-start gap-2">
              <Heart size={14} className="text-gold mt-0.5 shrink-0" strokeWidth={2} />
              <p className="text-ivory text-sm leading-relaxed">{note.prayerPoint}</p>
            </div>
          </Card>
        )}

        {/* Action Step */}
        {note.weeklyActionStep && (
          <Card label="Growth Step">
            <div className="flex items-start gap-2 mb-4">
              <Target size={14} className="text-gold mt-0.5 shrink-0" strokeWidth={2} />
              <p className="text-ivory text-sm leading-relaxed">{note.weeklyActionStep}</p>
            </div>
            <p className="text-[10px] font-semibold text-ivory-dim uppercase tracking-widest mb-2">
              Follow-up Status
            </p>
            <div className="flex flex-wrap gap-2 print:hidden">
              {(Object.entries(FOLLOW_UP_LABELS) as [FollowUpStatus, string][]).map(([k, v]) => (
                <button
                  key={k}
                  onClick={() => handleStatus(k)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    note.followUpStatus === k
                      ? 'bg-gold text-forest border-gold font-semibold'
                      : 'border-forest-light text-ivory-dim'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            <p className="hidden print:block text-xs text-ivory-dim">{FOLLOW_UP_LABELS[note.followUpStatus]}</p>
          </Card>
        )}

        {/* Optional Journal Prompts (QT only) */}
        {isQT && (note.gratitude || note.seasonMood || note.answeredPrayer) && (
          <Card label="Journal">
            <div className="space-y-3">
              {note.gratitude && (
                <div>
                  <p className="text-[10px] font-semibold text-ivory-dim uppercase tracking-widest mb-1">Gratitude</p>
                  <p className="text-ivory text-sm leading-relaxed">{note.gratitude}</p>
                </div>
              )}
              {note.seasonMood && (
                <div>
                  <p className="text-[10px] font-semibold text-ivory-dim uppercase tracking-widest mb-1">Season / Mood</p>
                  <p className="text-ivory text-sm leading-relaxed">{note.seasonMood}</p>
                </div>
              )}
              {note.answeredPrayer && (
                <div>
                  <p className="text-[10px] font-semibold text-ivory-dim uppercase tracking-widest mb-1">Answered Prayer</p>
                  <p className="text-ivory text-sm leading-relaxed">{note.answeredPrayer}</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Attachments */}
        {attachments.length > 0 && (
          <Card label="Photos">
            <div className="flex flex-wrap gap-3">
              {attachments.map(att => (
                <button
                  key={att.id}
                  onClick={() => setLightboxSrc(att.dataUrl)}
                  className="w-24 h-24 rounded-xl overflow-hidden border border-forest-light focus:outline-none focus:ring-2 focus:ring-gold"
                  aria-label="View photo"
                >
                  <img src={att.dataUrl} alt="Attachment" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {note.tags.map(tag => (
              <span
                key={tag}
                className="text-[11px] text-ivory-dim bg-forest-mid border border-forest-light px-3 py-1 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Timestamps */}
        <p className="text-xs text-ivory-dim pt-1">
          Saved {formatDate(note.createdAt)}
          {note.updatedAt !== note.createdAt && ` · Updated ${formatDate(note.updatedAt)}`}
        </p>
      </div>

      {/* Export / Share Modal */}
      {showExport && (
        <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50 p-5 print:hidden">
          <div className="bg-forest-mid border border-forest-light rounded-3xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-ivory">Share or Export</h2>
              <button onClick={() => setShowExport(false)} className="text-ivory-dim p-1 -mr-1">
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>
            <div className="space-y-2">
              {typeof navigator.share === 'function' && (
                <button
                  onClick={handleShare}
                  className="w-full flex items-center gap-3 bg-gold text-forest font-semibold px-4 py-3 rounded-xl text-sm"
                >
                  <Share2 size={16} strokeWidth={2} />
                  Share note
                </button>
              )}
              <button
                onClick={handleDownload}
                className="w-full flex items-center gap-3 border border-forest-light text-ivory px-4 py-3 rounded-xl text-sm"
              >
                <Download size={16} strokeWidth={1.5} />
                Download as text (.txt)
              </button>
              <button
                onClick={handleCopyText}
                className="w-full flex items-center gap-3 border border-forest-light text-ivory px-4 py-3 rounded-xl text-sm"
              >
                <Copy size={16} strokeWidth={1.5} />
                Copy to clipboard
              </button>
              <button
                onClick={handlePrint}
                className="w-full flex items-center gap-3 border border-forest-light text-ivory px-4 py-3 rounded-xl text-sm"
              >
                <Printer size={16} strokeWidth={1.5} />
                Print / Save as PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50 p-5 print:hidden">
          <div className="bg-forest-mid border border-forest-light rounded-3xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold text-ivory mb-2">Delete this note?</h2>
            <p className="text-ivory-dim text-sm mb-6 leading-relaxed">
              This will permanently delete "{note.title}" along with any linked prayer points and growth steps.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDelete(false)}
                className="flex-1 border border-forest-light text-ivory py-3 rounded-xl text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-700 text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-60"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 print:hidden"
          onClick={() => setLightboxSrc(null)}
        >
          <button
            className="absolute top-5 right-5 text-white/70 hover:text-white p-2"
            aria-label="Close"
          >
            <X size={24} strokeWidth={1.5} />
          </button>
          <img
            src={lightboxSrc}
            alt="Full size"
            className="max-w-full max-h-full rounded-xl object-contain"
            onClick={e => e.stopPropagation()}
          />
          <div className="absolute bottom-6 left-0 right-0 flex justify-center">
            <span className="text-white/50 text-xs flex items-center gap-1.5">
              <Image size={12} />
              Stored locally on this device
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
