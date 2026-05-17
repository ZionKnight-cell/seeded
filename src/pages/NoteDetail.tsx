import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ChevronLeft,
  Pencil,
  Trash2,
  Star,
  BookOpen,
  Heart,
  Target,
  Lightbulb,
} from 'lucide-react'
import { getSermonNote, deleteSermonNote, updateSermonNote } from '../db/database'
import { useToast } from '../components/Toast'
import { formatDate } from '../lib/dates'
import { CATEGORY_LABELS, FOLLOW_UP_LABELS } from '../types'
import type { SermonNote, FollowUpStatus } from '../types'

function Card({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-forest-mid rounded-2xl p-5 border border-forest-light">
      <p className="text-[10px] font-semibold text-gold uppercase tracking-widest mb-3">{label}</p>
      {children}
    </div>
  )
}

export default function NoteDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [note, setNote] = useState<SermonNote | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    const n = await getSermonNote(id)
    if (!n) setNotFound(true)
    else setNote(n)
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

  return (
    <div className="px-5 pt-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
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

      {/* Title & Meta */}
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-ivory tracking-tight leading-tight mb-3">
          {note.title}
        </h1>
        <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-ivory-dim">
          {note.sermonDate && <span>{formatDate(note.sermonDate)}</span>}
          {note.churchName && <span>· {note.churchName}</span>}
          {note.preacherName && <span>· {note.preacherName}</span>}
        </div>
        {note.category && (
          <span className="inline-block mt-2.5 text-[10px] font-semibold text-gold bg-forest-light px-3 py-1 rounded-full uppercase tracking-widest">
            {CATEGORY_LABELS[note.category]}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {/* Scripture */}
        {(note.mainBiblePassage || note.otherScriptureReferences) && (
          <Card label="Scripture">
            <div className="flex items-start gap-2">
              <BookOpen size={14} className="text-gold mt-0.5 shrink-0" strokeWidth={2} />
              <div>
                {note.mainBiblePassage && (
                  <p className="text-ivory text-sm font-medium">{note.mainBiblePassage}</p>
                )}
                {note.otherScriptureReferences && (
                  <p className="text-ivory-muted text-sm mt-1">{note.otherScriptureReferences}</p>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Full Notes */}
        {note.fullNotes && (
          <Card label="Notes">
            <p className="text-ivory text-sm leading-relaxed whitespace-pre-wrap">{note.fullNotes}</p>
          </Card>
        )}

        {/* Key Quote */}
        {note.keyQuote && (
          <Card label="Key Quote">
            <p className="text-ivory text-sm leading-relaxed italic">"{note.keyQuote}"</p>
          </Card>
        )}

        {/* Takeaway */}
        {note.mainTakeaway && (
          <Card label="Main Takeaway">
            <div className="flex items-start gap-2">
              <Lightbulb size={14} className="text-gold mt-0.5 shrink-0" strokeWidth={2} />
              <p className="text-ivory text-sm leading-relaxed">{note.mainTakeaway}</p>
            </div>
          </Card>
        )}

        {/* Conviction */}
        {note.personalConviction && (
          <Card label="Personal Conviction">
            <p className="text-ivory text-sm leading-relaxed">{note.personalConviction}</p>
          </Card>
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
          <Card label="Weekly Action Step">
            <div className="flex items-start gap-2 mb-4">
              <Target size={14} className="text-gold mt-0.5 shrink-0" strokeWidth={2} />
              <p className="text-ivory text-sm leading-relaxed">{note.weeklyActionStep}</p>
            </div>
            <p className="text-[10px] font-semibold text-ivory-dim uppercase tracking-widest mb-2">
              Follow-up Status
            </p>
            <div className="flex flex-wrap gap-2">
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

      {/* Delete Confirm Modal */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50 p-5">
          <div className="bg-forest-mid border border-forest-light rounded-3xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold text-ivory mb-2">Delete this note?</h2>
            <p className="text-ivory-dim text-sm mb-6 leading-relaxed">
              This will permanently delete "{note.title}" along with any linked prayer points and action steps.
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
    </div>
  )
}
