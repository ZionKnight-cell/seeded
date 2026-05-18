import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams, Link, useBlocker } from 'react-router-dom'
import { ChevronLeft, ExternalLink, Star } from 'lucide-react'
import { createSermonNote, updateSermonNote, getSermonNote } from '../db/database'
import { useToast } from '../components/Toast'
import { todayIso } from '../lib/dates'
import { buildBibleSearchUrl } from '../lib/bibleLinks'
import { getDraft, saveDraft, clearDraft } from '../lib/draft'
import { FOLLOW_UP_LABELS } from '../types'
import type { FollowUpStatus } from '../types'
import ReflectionHelper from '../components/ReflectionHelper'

interface FormState {
  title: string
  sermonDate: string
  mainBiblePassage: string
  devotionalSource: string
  fullNotes: string
  keyQuote: string
  mainTakeaway: string
  personalConviction: string
  prayerPoint: string
  weeklyActionStep: string
  followUpStatus: string
  gratitude: string
  seasonMood: string
  answeredPrayer: string
  tags: string
  isFavorite: boolean
}

function makeEmpty(): FormState {
  return {
    title: '',
    sermonDate: todayIso(),
    mainBiblePassage: '',
    devotionalSource: '',
    fullNotes: '',
    keyQuote: '',
    mainTakeaway: '',
    personalConviction: '',
    prayerPoint: '',
    weeklyActionStep: '',
    followUpStatus: 'not_started',
    gratitude: '',
    seasonMood: '',
    answeredPrayer: '',
    tags: '',
    isFavorite: false,
  }
}

interface Props {
  mode?: 'add' | 'edit'
}

export default function QuietTimeForm({ mode = 'add' }: Props) {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { showToast } = useToast()
  const [form, setForm] = useState<FormState>(makeEmpty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(mode === 'add')
  const [showDraftRecovery, setShowDraftRecovery] = useState(false)
  const [draftStatus, setDraftStatus] = useState<'idle' | 'saved' | 'restored'>('idle')
  const titleRef = useRef<HTMLInputElement>(null)
  const baseFormRef = useRef<FormState>(makeEmpty())
  const savedRef = useRef(false)
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const draftKey = mode === 'edit' && id ? `seeded:draft:edit:${id}` : 'seeded:draft:new:quiet_time'

  const isDirty = JSON.stringify(form) !== JSON.stringify(baseFormRef.current)
  const isDirtyRef = useRef(false)
  isDirtyRef.current = isDirty

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
          mainBiblePassage: note.mainBiblePassage ?? '',
          devotionalSource: note.devotionalSource ?? '',
          fullNotes: note.fullNotes ?? '',
          keyQuote: note.keyQuote ?? '',
          mainTakeaway: note.mainTakeaway ?? '',
          personalConviction: note.personalConviction ?? '',
          prayerPoint: note.prayerPoint ?? '',
          weeklyActionStep: note.weeklyActionStep ?? '',
          followUpStatus: note.followUpStatus,
          gratitude: note.gratitude ?? '',
          seasonMood: note.seasonMood ?? '',
          answeredPrayer: note.answeredPrayer ?? '',
          tags: note.tags?.join(', ') ?? '',
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
      if (isDirtyRef.current && !savedRef.current) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  // Intercept in-app navigation
  const blocker = useBlocker(
    useCallback(
      ({ currentLocation, nextLocation }) =>
        isDirtyRef.current && !savedRef.current && currentLocation.pathname !== nextLocation.pathname,
      []
    )
  )

  // Ensure draft is saved before blocker modal shows
  useEffect(() => {
    if (blocker.state === 'blocked' && loaded) {
      saveDraft(draftKey, form)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocker.state])

  const set = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value } as FormState))

  function applyToField(field: keyof FormState, text: string) {
    setForm(prev => ({ ...prev, [field]: text }))
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
      setError('Please add a title for this quiet time note.')
      titleRef.current?.focus()
      return
    }
    setError('')
    setSaving(true)

    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean)
    const data = {
      noteType: 'quiet_time' as const,
      title: form.title.trim(),
      sermonDate: form.sermonDate || todayIso(),
      mainBiblePassage: form.mainBiblePassage.trim() || undefined,
      devotionalSource: form.devotionalSource.trim() || undefined,
      fullNotes: form.fullNotes.trim() || undefined,
      keyQuote: form.keyQuote.trim() || undefined,
      mainTakeaway: form.mainTakeaway.trim() || undefined,
      personalConviction: form.personalConviction.trim() || undefined,
      prayerPoint: form.prayerPoint.trim() || undefined,
      weeklyActionStep: form.weeklyActionStep.trim() || undefined,
      followUpStatus: form.followUpStatus as FollowUpStatus,
      gratitude: form.gratitude.trim() || undefined,
      seasonMood: form.seasonMood.trim() || undefined,
      answeredPrayer: form.answeredPrayer.trim() || undefined,
      tags: tags.length ? tags : undefined,
      isFavorite: form.isFavorite,
    }

    try {
      if (mode === 'edit' && id) {
        await updateSermonNote(id, data)
        clearDraft(draftKey)
        savedRef.current = true
        showToast('Quiet time updated')
        navigate(`/notes/${id}`)
      } else {
        const newId = await createSermonNote(data)
        clearDraft(draftKey)
        savedRef.current = true
        showToast('Quiet time saved')
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
          <Link
            to={mode === 'edit' && id ? `/notes/${id}` : '/add'}
            className="text-ivory-dim -ml-1 p-1"
            aria-label="Back"
          >
            <ChevronLeft size={24} strokeWidth={1.5} />
          </Link>
          <h1 className="text-xl font-semibold text-ivory tracking-tight">
            {mode === 'edit' ? 'Edit Quiet Time' : 'New Quiet Time'}
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

        {/* ── Section 1: Quiet Time Details ── */}
        <section>
          <p className={sectionLabelCls}>Quiet Time Details</p>
          <p className={sectionHelpCls}>
            Use this for personal devotion, Bible study, or any quiet time with God. Title is the only required field.
          </p>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Title *</label>
              <input
                ref={titleRef}
                type="text"
                value={form.title}
                onChange={set('title')}
                placeholder="e.g. Morning devotion, John 15"
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
              <label className={labelCls}>Bible Passage</label>
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
              <label className={labelCls}>Devotional Source</label>
              <input
                type="text"
                value={form.devotionalSource}
                onChange={set('devotionalSource')}
                placeholder="e.g. Oswald Chambers, My Utmost for His Highest"
                className={inputCls}
              />
              <p className={fieldHintCls}>Optional — the devotional book or resource you used.</p>
            </div>
          </div>
        </section>

        {/* ── Section 2: What I Read ── */}
        <section>
          <p className={sectionLabelCls}>What I Read</p>
          <p className={sectionHelpCls}>
            Write freely while reading. You can come back to reflect later — just save first.
          </p>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Notes from Scripture / Devotional</label>
              <textarea
                value={form.fullNotes}
                onChange={set('fullNotes')}
                rows={6}
                placeholder="What I read, observations, questions…"
                className={textareaCls}
              />
            </div>
            <div>
              <label className={labelCls}>Verse or Phrase that Stood Out</label>
              <textarea
                value={form.keyQuote}
                onChange={set('keyQuote')}
                rows={2}
                placeholder="A line that stayed with you"
                className={textareaCls}
              />
            </div>
          </div>
        </section>

        {/* ── Reflection Helper ── */}
        <ReflectionHelper
          noteType="quiet_time"
          onUseTakeaway={text => applyToField('mainTakeaway', text)}
          onUseConviction={text => applyToField('personalConviction', text)}
          onUsePrayer={text => applyToField('prayerPoint', text)}
          onUseActionStep={text => applyToField('weeklyActionStep', text)}
        />

        {/* ── Section 3: Reflection ── */}
        <section>
          <p className={sectionLabelCls}>Reflection</p>
          <p className={sectionHelpCls}>
            After reading, use these to capture what this time means for you personally.
          </p>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>What Stood Out Most</label>
              <textarea
                value={form.mainTakeaway}
                onChange={set('mainTakeaway')}
                rows={3}
                placeholder="What is the one thing I'm taking from this?"
                className={textareaCls}
              />
            </div>
            <div>
              <label className={labelCls}>Personal Reflection</label>
              <textarea
                value={form.personalConviction}
                onChange={set('personalConviction')}
                rows={3}
                placeholder="What did this reveal, correct, encourage, or challenge in me?"
                className={textareaCls}
              />
              <p className={fieldHintCls}>
                Something this passage or devotional revealed, corrected, encouraged, or challenged in you.
              </p>
            </div>
          </div>
        </section>

        {/* ── Section 4: Prayer & Growth Step ── */}
        <section>
          <p className={sectionLabelCls}>Prayer &amp; Growth Step</p>
          <p className={sectionHelpCls}>
            Both are optional — add them when you're ready to respond to what you read.
          </p>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Prayer Point</label>
              <textarea
                value={form.prayerPoint}
                onChange={set('prayerPoint')}
                rows={2}
                placeholder="What will I pray about from this time?"
                className={textareaCls}
              />
              <p className={fieldHintCls}>A prayer response to what you read or felt.</p>
            </div>
            <div>
              <label className={labelCls}>Growth Step</label>
              <textarea
                value={form.weeklyActionStep}
                onChange={set('weeklyActionStep')}
                rows={2}
                placeholder="One thing I will do this week from this time"
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

        {/* ── Section 5: Optional Journal Prompts ── */}
        <section>
          <p className={sectionLabelCls}>Optional Journal Prompts</p>
          <p className={sectionHelpCls}>
            These are completely optional — use them if they add value to your quiet time journal.
          </p>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Gratitude</label>
              <textarea
                value={form.gratitude}
                onChange={set('gratitude')}
                rows={2}
                placeholder="What am I thankful for today?"
                className={textareaCls}
              />
            </div>
            <div>
              <label className={labelCls}>Season / Mood</label>
              <input
                type="text"
                value={form.seasonMood}
                onChange={set('seasonMood')}
                placeholder="e.g. Tired but trusting, Peaceful, Seeking direction"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Answered Prayer / Testimony</label>
              <textarea
                value={form.answeredPrayer}
                onChange={set('answeredPrayer')}
                rows={2}
                placeholder="A prayer God has answered, or something to remember"
                className={textareaCls}
              />
            </div>
          </div>
        </section>

        {/* ── Section 6: Organization ── */}
        <section>
          <p className={sectionLabelCls}>Organization</p>
          <p className={sectionHelpCls}>Tags help you find notes later. Optional.</p>
          <div>
            <label className={labelCls}>Tags</label>
            <input
              type="text"
              value={form.tags}
              onChange={set('tags')}
              placeholder="faith, rest, surrender (comma-separated)"
              className={inputCls}
            />
          </div>
        </section>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-gold text-forest font-semibold py-4 rounded-2xl text-[15px] disabled:opacity-60 transition-opacity"
        >
          {saving ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Save Quiet Time'}
        </button>
      </div>

      {/* Leave confirmation */}
      {blocker.state === 'blocked' && (
        <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50 p-5">
          <div className="bg-forest-mid border border-forest-light rounded-3xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold text-ivory mb-2">Leave without saving?</h2>
            <p className="text-ivory-dim text-sm mb-6 leading-relaxed">
              You have unsaved changes. Your draft has been saved locally
              {mode === 'add' ? ', but this note has not been added yet.' : '.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => blocker.reset()}
                className="flex-1 border border-forest-light text-ivory py-3 rounded-xl text-sm font-medium"
              >
                Stay
              </button>
              <button
                onClick={() => blocker.proceed()}
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
