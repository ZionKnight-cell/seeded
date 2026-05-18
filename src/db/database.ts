import Dexie from 'dexie'
import type { Table } from 'dexie'
import type {
  SermonNote,
  PrayerPoint,
  ActionStep,
  AppSettings,
  PrayerStatus,
  FollowUpStatus,
  NoteAttachment,
} from '../types'

class SeededDatabase extends Dexie {
  sermonNotes!: Table<SermonNote>
  prayerPoints!: Table<PrayerPoint>
  actionSteps!: Table<ActionStep>
  settings!: Table<AppSettings>
  noteAttachments!: Table<NoteAttachment>

  constructor() {
    super('SeededDB')
    this.version(1).stores({
      sermonNotes: 'id, sermonDate, category, isFavorite, createdAt',
      prayerPoints: 'id, sermonNoteId, status, createdAt',
      actionSteps: 'id, sermonNoteId, status, weekStartDate, createdAt',
      settings: 'id',
    })
    this.version(2).stores({
      noteAttachments: 'id, noteId, createdAt',
    })
  }
}

export const db = new SeededDatabase()

function now(): string {
  return new Date().toISOString()
}

function uuid(): string {
  return crypto.randomUUID()
}

function weekEnd(startIso: string): string {
  const d = new Date(startIso)
  d.setDate(d.getDate() + 6)
  return d.toISOString().split('T')[0]
}

function todayIso(): string {
  return new Date().toISOString().split('T')[0]
}

// ---------- Sermon Notes ----------

export async function createSermonNote(
  data: Omit<SermonNote, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const id = uuid()
  const ts = now()
  const noteType = data.noteType ?? 'sermon'

  await db.sermonNotes.add({ ...data, id, createdAt: ts, updatedAt: ts })

  if (data.prayerPoint?.trim()) {
    await db.prayerPoints.add({
      id: uuid(),
      sermonNoteId: id,
      sermonTitle: data.title,
      noteType,
      text: data.prayerPoint,
      status: 'active',
      updates: [],
      createdAt: ts,
      updatedAt: ts,
    })
  }

  if (data.weeklyActionStep?.trim()) {
    const sermonDate = data.sermonDate || ts.split('T')[0]
    await db.actionSteps.add({
      id: uuid(),
      sermonNoteId: id,
      sermonTitle: data.title,
      noteType,
      text: data.weeklyActionStep,
      status: data.followUpStatus,
      weekStartDate: sermonDate,
      weekEndDate: weekEnd(sermonDate),
      createdAt: ts,
      updatedAt: ts,
    })
  }

  return id
}

export async function updateSermonNote(
  id: string,
  updates: Partial<Omit<SermonNote, 'id' | 'createdAt'>>
): Promise<void> {
  const ts = now()
  await db.sermonNotes.update(id, { ...updates, updatedAt: ts })

  const note = await db.sermonNotes.get(id)
  if (!note) return
  const newTitle = updates.title ?? note.title
  const noteType = note.noteType ?? 'sermon'

  if ('prayerPoint' in updates) {
    const existing = await db.prayerPoints.where('sermonNoteId').equals(id).first()
    if (updates.prayerPoint?.trim()) {
      if (existing) {
        await db.prayerPoints.update(existing.id, {
          text: updates.prayerPoint,
          sermonTitle: newTitle,
          updatedAt: ts,
        })
      } else {
        await db.prayerPoints.add({
          id: uuid(),
          sermonNoteId: id,
          sermonTitle: newTitle,
          noteType,
          text: updates.prayerPoint,
          status: 'active',
          updates: [],
          createdAt: ts,
          updatedAt: ts,
        })
      }
    } else if (existing) {
      await db.prayerPoints.delete(existing.id)
    }
  } else if ('title' in updates) {
    const existing = await db.prayerPoints.where('sermonNoteId').equals(id).first()
    if (existing) await db.prayerPoints.update(existing.id, { sermonTitle: newTitle, updatedAt: ts })
  }

  if ('weeklyActionStep' in updates) {
    const existing = await db.actionSteps.where('sermonNoteId').equals(id).first()
    if (updates.weeklyActionStep?.trim()) {
      if (existing) {
        await db.actionSteps.update(existing.id, {
          text: updates.weeklyActionStep,
          sermonTitle: newTitle,
          updatedAt: ts,
        })
      } else {
        const sermonDate = note.sermonDate || ts.split('T')[0]
        await db.actionSteps.add({
          id: uuid(),
          sermonNoteId: id,
          sermonTitle: newTitle,
          noteType,
          text: updates.weeklyActionStep,
          status: 'not_started',
          weekStartDate: sermonDate,
          weekEndDate: weekEnd(sermonDate),
          createdAt: ts,
          updatedAt: ts,
        })
      }
    } else if (existing) {
      await db.actionSteps.delete(existing.id)
    }
  } else if ('title' in updates) {
    const existing = await db.actionSteps.where('sermonNoteId').equals(id).first()
    if (existing) await db.actionSteps.update(existing.id, { sermonTitle: newTitle, updatedAt: ts })
  }
}

export async function deleteSermonNote(id: string): Promise<void> {
  await db.sermonNotes.delete(id)
  await db.prayerPoints.where('sermonNoteId').equals(id).delete()
  await db.actionSteps.where('sermonNoteId').equals(id).delete()
  await db.noteAttachments.where('noteId').equals(id).delete()
}

export async function getSermonNote(id: string): Promise<SermonNote | undefined> {
  return db.sermonNotes.get(id)
}

export async function getAllSermonNotes(): Promise<SermonNote[]> {
  return db.sermonNotes.orderBy('sermonDate').reverse().toArray()
}

// ---------- Prayer Points ----------

export async function getAllPrayerPoints(): Promise<PrayerPoint[]> {
  return db.prayerPoints.orderBy('createdAt').reverse().toArray()
}

export async function updatePrayerStatus(id: string, status: PrayerStatus): Promise<void> {
  await db.prayerPoints.update(id, { status, updatedAt: now() })
}

export async function addPrayerUpdate(id: string, text: string): Promise<void> {
  const prayer = await db.prayerPoints.get(id)
  if (!prayer) return
  const update = { id: uuid(), text, createdAt: now() }
  await db.prayerPoints.update(id, {
    updates: [...prayer.updates, update],
    updatedAt: now(),
  })
}

// ---------- Action Steps ----------

export async function getAllActionSteps(): Promise<ActionStep[]> {
  return db.actionSteps.orderBy('createdAt').reverse().toArray()
}

export async function updateActionStatus(id: string, status: FollowUpStatus): Promise<void> {
  const ts = now()
  const action = await db.actionSteps.get(id)
  if (!action) return
  const extra: Partial<ActionStep> = status === 'done' ? { completedAt: ts } : {}
  await db.actionSteps.update(id, { status, updatedAt: ts, ...extra })
  await db.sermonNotes.update(action.sermonNoteId, { followUpStatus: status, updatedAt: ts })
}

export async function updateActionReflection(id: string, reflection: string): Promise<void> {
  await db.actionSteps.update(id, { reflection, updatedAt: now() })
}

// ---------- Attachments ----------

export async function getAttachments(noteId: string): Promise<NoteAttachment[]> {
  return db.noteAttachments.where('noteId').equals(noteId).toArray()
}

export async function addAttachment(
  noteId: string,
  name: string,
  mimeType: string,
  dataUrl: string
): Promise<string> {
  const id = uuid()
  await db.noteAttachments.add({ id, noteId, name, mimeType, dataUrl, createdAt: now() })
  return id
}

export async function deleteAttachment(id: string): Promise<void> {
  await db.noteAttachments.delete(id)
}

// ---------- Sample Note ----------

export async function createSampleNote(): Promise<string> {
  return createSermonNote({
    noteType: 'sermon',
    title: 'Faith That Bears Fruit',
    sermonDate: todayIso(),
    mainBiblePassage: 'John 15:1-8',
    fullNotes: 'Jesus describes himself as the true vine and his Father as the gardener.\n\nKey themes:\n- Abiding in Christ is not passive — it requires intentional connection.\n- A branch that does not bear fruit is not producing what it was designed for.\n- Pruning can be painful but is always purposeful — it prepares us for more fruit.\n- The key command is to "remain in me" — to stay connected through prayer, Scripture, and obedience.\n- Fruit is the visible evidence of an invisible relationship.',
    keyQuote: '"I am the vine; you are the branches. If you remain in me and I in you, you will bear much fruit." — John 15:5',
    mainTakeaway: 'A life rooted in Christ should show visible fruit over time.',
    personalConviction: 'I tend to produce activity rather than fruit. Fruit comes from abiding, not from striving.',
    prayerPoint: 'Lord, help me remain in You and bear fruit that honours You.',
    weeklyActionStep: 'Choose one area this week where I will practise obedience instead of only listening.',
    category: 'faith',
    tags: ['sample', 'faith', 'growth'],
    followUpStatus: 'not_started',
    isFavorite: false,
  })
}

// ---------- Clear All ----------

export async function clearAllData(): Promise<void> {
  await db.sermonNotes.clear()
  await db.prayerPoints.clear()
  await db.actionSteps.clear()
  await db.settings.clear()
  await db.noteAttachments.clear()
}

// ---------- Backup / Restore ----------

export async function exportAllData(): Promise<{
  version: number
  exportedAt: string
  sermonNotes: SermonNote[]
  prayerPoints: PrayerPoint[]
  actionSteps: ActionStep[]
  noteAttachments: NoteAttachment[]
}> {
  const [sermonNotes, prayerPoints, actionSteps, noteAttachments] = await Promise.all([
    db.sermonNotes.toArray(),
    db.prayerPoints.toArray(),
    db.actionSteps.toArray(),
    db.noteAttachments.toArray(),
  ])
  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    sermonNotes,
    prayerPoints,
    actionSteps,
    noteAttachments,
  }
}

export async function importAllData(data: {
  sermonNotes?: SermonNote[]
  prayerPoints?: PrayerPoint[]
  actionSteps?: ActionStep[]
  noteAttachments?: NoteAttachment[]
}): Promise<void> {
  if (data.sermonNotes?.length) await db.sermonNotes.bulkPut(data.sermonNotes)
  if (data.prayerPoints?.length) await db.prayerPoints.bulkPut(data.prayerPoints)
  if (data.actionSteps?.length) await db.actionSteps.bulkPut(data.actionSteps)
  if (data.noteAttachments?.length) await db.noteAttachments.bulkPut(data.noteAttachments)
}

// ---------- Data Repair ----------

export async function repairData(): Promise<{ removed: number; synced: number }> {
  const ts = now()
  const notes = await db.sermonNotes.toArray()
  const noteIds = new Set(notes.map(n => n.id))
  const noteTitles = new Map(notes.map(n => [n.id, n.title]))

  const prayers = await db.prayerPoints.toArray()
  const orphanedPrayerIds = prayers.filter(p => !noteIds.has(p.sermonNoteId)).map(p => p.id)
  if (orphanedPrayerIds.length) await db.prayerPoints.bulkDelete(orphanedPrayerIds)

  const steps = await db.actionSteps.toArray()
  const orphanedStepIds = steps.filter(s => !noteIds.has(s.sermonNoteId)).map(s => s.id)
  if (orphanedStepIds.length) await db.actionSteps.bulkDelete(orphanedStepIds)

  const attachments = await db.noteAttachments.toArray()
  const orphanedAttachmentIds = attachments.filter(a => !noteIds.has(a.noteId)).map(a => a.id)
  if (orphanedAttachmentIds.length) await db.noteAttachments.bulkDelete(orphanedAttachmentIds)

  let synced = 0
  for (const p of prayers.filter(p => noteIds.has(p.sermonNoteId))) {
    const expected = noteTitles.get(p.sermonNoteId)!
    if (p.sermonTitle !== expected) {
      await db.prayerPoints.update(p.id, { sermonTitle: expected, updatedAt: ts })
      synced++
    }
  }
  for (const s of steps.filter(s => noteIds.has(s.sermonNoteId))) {
    const expected = noteTitles.get(s.sermonNoteId)!
    if (s.sermonTitle !== expected) {
      await db.actionSteps.update(s.id, { sermonTitle: expected, updatedAt: ts })
      synced++
    }
  }

  return {
    removed: orphanedPrayerIds.length + orphanedStepIds.length + orphanedAttachmentIds.length,
    synced,
  }
}
