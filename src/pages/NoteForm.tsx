import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ChevronLeft, Star } from 'lucide-react'
import { createSermonNote, updateSermonNote, getSermonNote } from '../db/database'
import { useToast } from '../components/Toast'
import { todayIso } from '../lib/dates'
import { ALL_CATEGORIES, CATEGORY_LABELS, FOLLOW_UP_LABELS } from '../types'
import type { SermonCategory, FollowUpStatus } from '../types'

interface FormState {
  title: string
  sermonDate: string
  churchName: string
  preacherName: string
  mainBiblePassage: string
  otherScriptureReferences: string
  category: string
  tags: string
  fullNotes: string
  keyQuote: string
  mainTakeaway: string
  personalConviction: string
  prayerPoint: string
  weeklyActionStep: string
  followUpStatus: string
  isFavorite: boolean
}

const EMPTY_TEMPLATE: Omit<FormState, 'sermonDate'> = {
  title: '',
  churchName: '',
  preacherName: '',
  mainBiblePassage: '',
  otherScriptureReferences: '',
  category: '',
  tags: '',
  fullNotes: '',
  keyQuote: '',
  mainTakeaway: '',
  personalConviction: '',
  prayerPoint: '',
  weeklyActionStep: '',
  followUpStatus: 'not_started',
  isFavorite: false,
}

function makeEmpty(): FormState {
  return { ...EMPTY_TEMPLATE, sermonDate: todayIso() }
}

interface Props {
  mode?: 'add' | 'edit'
}

export default function NoteForm({ mode = 'add' }: Props) {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { showToast } = useToast()
  const [form, setForm] = useState<FormState>(makeEmpty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(mode === 'add')
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (mode === 'edit' && id) {
      getSermonNote(id).then(note => {
        if (!note) { navigate('/notes'); return }
        setForm({
          title: note.title,
          sermonDate: note.sermonDate.split('T')[0],
          churchName: note.churchName ?? '',
          preacherName: note.preacherName ?? '',
          mainBiblePassage: note.mainBiblePassage ?? '',
          otherScriptureReferences: note.otherScriptureReferences ?? '',
          category: note.category ?? '',
          tags: note.tags?.join(', ') ?? '',
          fullNotes: note.fullNotes ?? '',
          keyQuote: note.keyQuote ?? '',
          mainTakeaway: note.mainTakeaway ?? '',
          personalConviction: note.personalConviction ?? '',
          prayerPoint: note.prayerPoint ?? '',
          weeklyActionStep: note.weeklyActionStep ?? '',
          followUpStatus: note.followUpStatus,
          isFavorite: note.isFavorite,
        })
        setLoaded(true)
      })
    }
  }, [mode, id, navigate])

  const set = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value } as FormState))

  async function handleSave() {
    if (!form.title.trim()) {
      setError('Please add a sermon title.')
      titleRef.current?.focus()
      return
    }
    setError('')
    setSaving(true)

    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean)
    const data = {
      title: form.title.trim(),
      sermonDate: form.sermonDate || todayIso(),
      churchName: form.churchName.trim() || undefined,
      preacherName: form.preacherName.trim() || undefined,
      mainBiblePassage: form.mainBiblePassage.trim() || undefined,
      otherScriptureReferences: form.otherScriptureReferences.trim() || undefined,
      category: (form.category as SermonCategory) || undefined,
      tags: tags.length ? tags : undefined,
      fullNotes: form.fullNotes.trim() || undefined,
      keyQuote: form.keyQuote.trim() || undefined,
      mainTakeaway: form.mainTakeaway.trim() || undefined,
      personalConviction: form.personalConviction.trim() || undefined,
      prayerPoint: form.prayerPoint.trim() || undefined,
      weeklyActionStep: form.weeklyActionStep.trim() || undefined,
      followUpStatus: form.followUpStatus as FollowUpStatus,
      isFavorite: form.isFavorite,
    }

    try {
      if (mode === 'edit' && id) {
        await updateSermonNote(id, data)
        showToast('Note updated')
        navigate(`/notes/${id}`)
      } else {
        const newId = await createSermonNote(data)
        showToast('Sermon note saved')
        navigate(`/notes/${newId}`)
      }
    } catch (err) {
      console.error(err)
      setError('Something went wrong. Please try again.')
      setSaving(false)
    }
  }

  const input = 'w-full bg-forest border border-forest-light text-ivory rounded-xl px-4 py-3 text-sm placeholder:text-ivory-dim focus:outline-none focus:border-gold transition-colors'
  const textarea = `${input} resize-none`
  const label = 'block text-[10px] font-semibold text-gold uppercase tracking-widest mb-2'
  const sectionLabel = 'text-[11px] font-semibold text-ivory-dim uppercase tracking-widest mb-4'

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-ivory-dim text-sm">Loading...</p>
      </div>
    )
  }

  return (
    <div className="px-5 pt-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link
            to={mode === 'edit' && id ? `/notes/${id}` : '/notes'}
            className="text-ivory-dim -ml-1 p-1"
            aria-label="Back"
          >
            <ChevronLeft size={24} strokeWidth={1.5} />
          </Link>
          <h1 className="text-xl font-semibold text-ivory tracking-tight">
            {mode === 'edit' ? 'Edit Note' : 'New Sermon Note'}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setForm(f => ({ ...f, isFavorite: !f.isFavorite }))}
          className={`p-1 -mr-1 transition-colors ${form.isFavorite ? 'text-gold' : 'text-ivory-dim'}`}
          aria-label="Toggle favorite"
        >
          <Star size={22} strokeWidth={1.5} fill={form.isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700/40 text-red-300 text-sm rounded-xl px-4 py-3 mb-6">
          {error}
        </div>
      )}

      <div className="space-y-8">
        {/* Sermon Details */}
        <section>
          <p className={sectionLabel}>Sermon Details</p>
          <div className="space-y-4">
            <div>
              <label className={label}>Title *</label>
              <input
                ref={titleRef}
                type="text"
                value={form.title}
                onChange={set('title')}
                placeholder="Sermon title"
                className={input}
              />
            </div>
            <div>
              <label className={label}>Date</label>
              <input
                type="date"
                value={form.sermonDate}
                onChange={set('sermonDate')}
                className={input}
              />
            </div>
            <div>
              <label className={label}>Church</label>
              <input
                type="text"
                value={form.churchName}
                onChange={set('churchName')}
                placeholder="Church name"
                className={input}
              />
            </div>
            <div>
              <label className={label}>Preacher / Speaker</label>
              <input
                type="text"
                value={form.preacherName}
                onChange={set('preacherName')}
                placeholder="Speaker name"
                className={input}
              />
            </div>
            <div>
              <label className={label}>Main Bible Passage</label>
              <input
                type="text"
                value={form.mainBiblePassage}
                onChange={set('mainBiblePassage')}
                placeholder="e.g. John 15:1-8"
                className={input}
              />
            </div>
            <div>
              <label className={label}>Other Scriptures</label>
              <input
                type="text"
                value={form.otherScriptureReferences}
                onChange={set('otherScriptureReferences')}
                placeholder="e.g. Romans 8:1, Psalm 23"
                className={input}
              />
            </div>
            <div>
              <label className={label}>Topic / Category</label>
              <select value={form.category} onChange={set('category')} className={input}>
                <option value="">Select a category</option>
                {ALL_CATEGORIES.map(c => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Tags</label>
              <input
                type="text"
                value={form.tags}
                onChange={set('tags')}
                placeholder="faith, grace, surrender (comma-separated)"
                className={input}
              />
            </div>
          </div>
        </section>

        {/* The Message */}
        <section>
          <p className={sectionLabel}>The Message</p>
          <div className="space-y-4">
            <div>
              <label className={label}>Full Notes</label>
              <textarea
                value={form.fullNotes}
                onChange={set('fullNotes')}
                rows={7}
                placeholder="What was shared today..."
                className={textarea}
              />
            </div>
            <div>
              <label className={label}>Key Quote</label>
              <textarea
                value={form.keyQuote}
                onChange={set('keyQuote')}
                rows={2}
                placeholder="A line that stuck with you"
                className={textarea}
              />
            </div>
          </div>
        </section>

        {/* My Response */}
        <section>
          <p className={sectionLabel}>My Response</p>
          <div className="space-y-4">
            <div>
              <label className={label}>Main Takeaway</label>
              <textarea
                value={form.mainTakeaway}
                onChange={set('mainTakeaway')}
                rows={3}
                placeholder="What is the one thing I'm taking from this?"
                className={textarea}
              />
            </div>
            <div>
              <label className={label}>Personal Conviction</label>
              <textarea
                value={form.personalConviction}
                onChange={set('personalConviction')}
                rows={3}
                placeholder="What did the Spirit highlight for me personally?"
                className={textarea}
              />
            </div>
          </div>
        </section>

        {/* Growth Step */}
        <section>
          <p className={sectionLabel}>Growth Step</p>
          <div className="space-y-4">
            <div>
              <label className={label}>Prayer Point</label>
              <textarea
                value={form.prayerPoint}
                onChange={set('prayerPoint')}
                rows={2}
                placeholder="What will I pray about from this message?"
                className={textarea}
              />
            </div>
            <div>
              <label className={label}>Weekly Action Step</label>
              <textarea
                value={form.weeklyActionStep}
                onChange={set('weeklyActionStep')}
                rows={2}
                placeholder="One thing I will do this week because of this message"
                className={textarea}
              />
            </div>
            <div>
              <label className={label}>Follow-up Status</label>
              <select value={form.followUpStatus} onChange={set('followUpStatus')} className={input}>
                {(Object.entries(FOLLOW_UP_LABELS) as [string, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-gold text-forest font-semibold py-4 rounded-2xl text-[15px] disabled:opacity-60 transition-opacity"
        >
          {saving ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Save Sermon Note'}
        </button>
      </div>
    </div>
  )
}
