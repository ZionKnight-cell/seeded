import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, ExternalLink, Star } from 'lucide-react'
import { createSermonNote, updateSermonNote, getSermonNote } from '../db/database'
import { useToast } from '../components/Toast'
import { todayIso } from '../lib/dates'
import { buildBibleSearchUrl, parseScriptureReferences } from '../lib/bibleLinks'
import { getDraft, saveDraft, clearDraft } from '../lib/draft'
import { ALL_CATEGORIES, CATEGORY_LABELS, FOLLOW_UP_LABELS } from '../types'
import type { SermonCategory, FollowUpStatus } from '../types'
import ReflectionHelper from '../components/ReflectionHelper'

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
  const [showDraftRecovery, setShowDraftRecovery] = useState(false)
  const [draftStatus, setDraftStatus] = useState<'idle' | 'saved' | 'restored'>('idle')
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)
  const baseFormRef = useRef<FormState>(makeEmpty())
  const savedRef = useRef(false)
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const draftKey = mode === 'edit' && id ? `seeded:draft:edit:${id}` : 'seeded:draft:new:sermon'
  const backDest = mode === 'edit' && id ? `/notes/${id}` : '/add'
  const isDirty = JSON.stringify(form) !== JSON.stringify(baseFormRef.current)

  // Add mode: check for existing draft on mount
  useEffect(() => {
    if (mode === 'add' && getDraft(draftKey)) {
      setShowDraftRecovery(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Edit mode: load note then check for draft
  useEffect(() => {
    if (mode === 'edit' && id) {
      getSermonNote(id).then(note => {
        if (!note) { navigate('/notes'); return }
        const f: FormState = {
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
        }
        setForm(f)
        baseFormRef.current = f
        if (getDraft(draftKey)) setShowDraftRecovery(true)
        setLoaded(true)
      })
    }
  }, [mode, id, navigate, draftKey])

  // Debounced autosave
  useEffect(() => {
    if (!loaded || !isDirty || savedRef.current || showDraftRecovery) return
    clearTimeout(draftTimerRef.current)
    draftTimerRef.current = setTimeout(() => {
      saveDraft(draftKey, form)
      setDraftStatus('saved')
      clearTimeout(statusTimerRef.current)
      statusTimerRef.current = setTimeout(() => {
        setDraftStatus(s => s === 'saved' ? 'idle' : s)
      }, 2000)
    }, 800)
    return () => clearTimeout(draftTimerRef.current)
  }, [form, loaded, isDirty, showDraftRecovery, draftKey])

  // Warn on browser close/refresh
  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirty && !savedRef.current) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [isDirty])

  const set = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value } as FormState))

  function applyToField(field: keyof FormState, text: string) {
    setForm(prev => ({ ...prev, [field]: text }))
  }

  function handleBack() {
    if (isDirty && !savedRef.current) {
      saveDraft(draftKey, form)
      setShowLeaveConfirm(true)
    } else {
      navigate(backDest)
    }
  }

  function handleLeave() {
    setShowLeaveConfirm(false)
    navigate(backDest)
  }

  function handleRestoreDraft() {
    const draft = getDraft<FormState>(draftKey)
    if (draft) {
      setForm(draft)
      setDraftStatus('restored')
      clearTimeout(statusTimerRef.current)
      statusTimerRef.current = setTimeout(() => setDraftStatus('idle'), 3000)
    }
    setShowDraftRecovery(false)
  }

  function handleDiscardDraft() {
    clearDraft(draftKey)
    setShowDraftRecovery(false)
  }

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
      noteType: 'sermon' as const,
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
        clearDraft(draftKey)
        savedRef.current = true
        showToast('Note updated')
        navigate(`/notes/${id}`)
      } else {
        const newId = await createSermonNote(data)
        clearDraft(draftKey)
        savedRef.current = true
        showToast('Sermon note saved')
        navigate(`/notes/${newId}`)
      }
    } catch (err) {
      console.error(err)
      setError('Something went wrong. Please try again.')
      setSaving(false)
    }
  }

  const inputCls = 'w-full bg-forest border border-forest-light text-ivory rounded-xl px-4 py-3 text-sm placeholder:text-ivory-dim focus:outline-none focus:border-gold transition-colors'
  const textareaCls = `${inputCls} resize-none`
  const labelCls = 'block text-[10px] font-semibold text-gold uppercase tracking-widest mb-2'
  const sectionLabelCls = 'text-[11px] font-semibold text-ivory-dim uppercase tracking-widest mb-2'
  const sectionHelpCls = 'text-xs text-ivory-dim leading-relaxed mb-4'
  const fieldHintCls = 'mt-1.5 text-xs text-ivory-dim leading-relaxed'

  const otherRefs = parseScriptureReferences(form.otherScriptureReferences)

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
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="text-ivory-dim -ml-1 p-1"
            aria-label="Back"
          >
            <ChevronLeft size={24} strokeWidth={1.5} />
          </button>
          <h1 className="text-xl font-semibold text-ivory tracking-tight">
            {mode === 'edit' ? 'Edit Note' : 'New Sermon Note'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {draftStatus !== 'idle' && (
            <span className="text-[10px] text-ivory-dim">
              {draftStatus === 'restored' ? 'Draft restored' : 'Draft saved'}
            </span>
          )}
          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, isFavorite: !f.isFavorite }))}
            className={`p-1 -mr-1 transition-colors ${form.isFavorite ? 'text-gold' : 'text-ivory-dim'}`}
            aria-label="Toggle favorite"
          >
            <Star size={22} strokeWidth={1.5} fill={form.isFavorite ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      {/* Draft recovery */}
      {showDraftRecovery && (
        <div className="bg-forest-mid border border-gold/25 rounded-2xl px-5 py-4 mb-6 mt-4">
          <p className="text-sm font-medium text-ivory mb-1">You have an unsaved draft.</p>
          <p className="text-xs text-ivory-dim mb-3 leading-relaxed">
            {mode === 'edit'
              ? 'Restore your unsaved edits, or discard them and start from the saved note.'
              : 'Restore your draft, or discard it and start fresh.'}
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleRestoreDraft}
              className="text-xs font-semibold text-forest bg-gold px-4 py-2 rounded-lg"
            >
              Restore draft
            </button>
            <button
              onClick={handleDiscardDraft}
              className="text-xs text-ivory-dim border border-forest-light px-4 py-2 rounded-lg"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {!showDraftRecovery && <div className="mb-6" />}

      {error && (
        <div className="bg-red-900/30 border border-red-700/40 text-red-300 text-sm rounded-xl px-4 py-3 mb-6">
          {error}
        </div>
      )}

      <div className="space-y-8">

        {/* ── Section 1: Sermon Details ── */}
        <section>
          <p className={sectionLabelCls}>Sermon Details</p>
          <p className={sectionHelpCls}>
            Start with the basics — everything except the title is optional. You can always edit later.
          </p>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Title *</label>
              <input
                ref={titleRef}
                type="text"
                value={form.title}
                onChange={set('title')}
                placeholder="Sermon title"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Date</label>
              <input
                type="date"
                value={form.sermonDate}
                onChange={set('sermonDate')}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Church</label>
              <input
                type="text"
                value={form.churchName}
                onChange={set('churchName')}
                placeholder="Church name"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Preacher / Speaker</label>
              <input
                type="text"
                value={form.preacherName}
                onChange={set('preacherName')}
                placeholder="Speaker name"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Main Bible Passage</label>
              <input
                type="text"
                value={form.mainBiblePassage}
                onChange={set('mainBiblePassage')}
                placeholder="e.g. John 15:1-8"
                className={inputCls}
              />
              {form.mainBiblePassage.trim() && (
                <a
                  href={buildBibleSearchUrl(form.mainBiblePassage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 mt-2 text-xs text-gold/70 hover:text-gold transition-colors w-fit"
                >
                  <ExternalLink size={11} strokeWidth={2} />
                  Open passage externally
                </a>
              )}
            </div>
            <div>
              <label className={labelCls}>Other Scriptures</label>
              <textarea
                value={form.otherScriptureReferences}
                onChange={set('otherScriptureReferences')}
                rows={2}
                placeholder={'e.g. Romans 8:1, Psalm 23\nor one reference per line'}
                className={textareaCls}
              />
              <p className={fieldHintCls}>Separate references with commas, semicolons, or new lines.</p>
              {otherRefs.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {otherRefs.map(ref => (
                    <a
                      key={ref}
                      href={buildBibleSearchUrl(ref)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-gold/70 hover:text-gold transition-colors w-fit"
                    >
                      <ExternalLink size={11} strokeWidth={2} />
                      {ref} — Open externally
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Section 2: Live Notes ── */}
        <section>
          <p className={sectionLabelCls}>Live Notes</p>
          <p className={sectionHelpCls}>
            Write freely while listening. You can come back to reflect later — just save first.
          </p>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Full Notes</label>
              <textarea
                value={form.fullNotes}
                onChange={set('fullNotes')}
                rows={7}
                placeholder="What was shared today..."
                className={textareaCls}
              />
            </div>
            <div>
              <label className={labelCls}>Key Quote</label>
              <textarea
                value={form.keyQuote}
                onChange={set('keyQuote')}
                rows={2}
                placeholder="A line that stuck with you"
                className={textareaCls}
              />
            </div>
          </div>
        </section>

        {/* ── Reflection Helper ── */}
        <ReflectionHelper
          noteType="sermon"
          onUseTakeaway={text => applyToField('mainTakeaway', text)}
          onUseConviction={text => applyToField('personalConviction', text)}
          onUsePrayer={text => applyToField('prayerPoint', text)}
          onUseActionStep={text => applyToField('weeklyActionStep', text)}
        />

        {/* ── Section 3: My Response ── */}
        <section>
          <p className={sectionLabelCls}>My Response</p>
          <p className={sectionHelpCls}>
            After service, use these to capture what this message means for you personally.
          </p>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Main Takeaway</label>
              <textarea
                value={form.mainTakeaway}
                onChange={set('mainTakeaway')}
                rows={3}
                placeholder="What is the one thing I'm taking from this?"
                className={textareaCls}
              />
            </div>
            <div>
              <label className={labelCls}>Personal Conviction</label>
              <textarea
                value={form.personalConviction}
                onChange={set('personalConviction')}
                rows={3}
                placeholder="What did the Spirit highlight for me personally?"
                className={textareaCls}
              />
              <p className={fieldHintCls}>
                Something the message revealed, corrected, encouraged, or challenged in you.
              </p>
            </div>
          </div>
        </section>

        {/* ── Section 4: Prayer & Growth Step ── */}
        <section>
          <p className={sectionLabelCls}>Prayer &amp; Growth Step</p>
          <p className={sectionHelpCls}>
            Both are optional — add them when you're ready to reflect on the message.
          </p>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Prayer Point</label>
              <textarea
                value={form.prayerPoint}
                onChange={set('prayerPoint')}
                rows={2}
                placeholder="What will I pray about from this message?"
                className={textareaCls}
              />
              <p className={fieldHintCls}>A prayer response to what you heard.</p>
            </div>
            <div>
              <label className={labelCls}>Weekly Growth Step</label>
              <textarea
                value={form.weeklyActionStep}
                onChange={set('weeklyActionStep')}
                rows={2}
                placeholder="One thing I will do this week because of this message"
                className={textareaCls}
              />
              <p className={fieldHintCls}>One simple action you can practise this week.</p>
            </div>
            <div>
              <label className={labelCls}>Follow-up Status</label>
              <select value={form.followUpStatus} onChange={set('followUpStatus')} className={inputCls}>
                {(Object.entries(FOLLOW_UP_LABELS) as [string, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <p className={fieldHintCls}>Track whether you acted on this growth step.</p>
            </div>
          </div>
        </section>

        {/* ── Section 5: Organization ── */}
        <section>
          <p className={sectionLabelCls}>Organization</p>
          <p className={sectionHelpCls}>
            Category and tags help you find notes later. Both are optional.
          </p>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Topic / Category</label>
              <select value={form.category} onChange={set('category')} className={inputCls}>
                <option value="">Select a category</option>
                {ALL_CATEGORIES.map(c => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Tags</label>
              <input
                type="text"
                value={form.tags}
                onChange={set('tags')}
                placeholder="faith, grace, surrender (comma-separated)"
                className={inputCls}
              />
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

      {/* Leave confirmation */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50 p-5">
          <div className="bg-forest-mid border border-forest-light rounded-3xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold text-ivory mb-2">Leave without saving?</h2>
            <p className="text-ivory-dim text-sm mb-6 leading-relaxed">
              You have unsaved changes. Your draft has been saved locally
              {mode === 'add' ? ', but this note has not been added yet.' : '.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 border border-forest-light text-ivory py-3 rounded-xl text-sm font-medium"
              >
                Stay
              </button>
              <button
                onClick={handleLeave}
                className="flex-1 bg-forest-light text-ivory py-3 rounded-xl text-sm font-semibold"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
