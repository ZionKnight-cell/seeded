export type FollowUpStatus =
  | 'not_started'
  | 'in_progress'
  | 'done'
  | 'still_working'
  | 'forgot'

export type PrayerStatus = 'active' | 'answered' | 'archived'

export type NoteType = 'sermon' | 'quiet_time'

export type SermonCategory =
  | 'faith'
  | 'prayer'
  | 'obedience'
  | 'holiness'
  | 'love'
  | 'wisdom'
  | 'purpose'
  | 'family'
  | 'service'
  | 'evangelism'
  | 'giving'
  | 'leadership'
  | 'other'

export interface PrayerUpdate {
  id: string
  text: string
  createdAt: string
}

export interface SermonNote {
  id: string
  noteType?: NoteType           // undefined treated as 'sermon' — backward compatible
  title: string
  sermonDate: string
  // Sermon-specific fields
  churchName?: string
  preacherName?: string
  otherScriptureReferences?: string
  category?: SermonCategory
  keyQuote?: string
  // Shared fields (labels differ per noteType in the UI)
  mainBiblePassage?: string
  tags?: string[]
  fullNotes?: string            // sermon: live notes; quiet time: what I read
  mainTakeaway?: string         // sermon: main takeaway; quiet time: what stood out
  personalConviction?: string   // sermon: personal conviction; quiet time: personal reflection
  prayerPoint?: string
  weeklyActionStep?: string
  followUpStatus: FollowUpStatus
  isFavorite: boolean
  // Quiet Time optional journal prompts
  devotionalSource?: string
  gratitude?: string
  seasonMood?: string
  answeredPrayer?: string
  createdAt: string
  updatedAt: string
}

export interface PrayerPoint {
  id: string
  sermonNoteId: string
  sermonTitle: string
  noteType?: NoteType           // undefined treated as 'sermon' — backward compatible
  text: string
  status: PrayerStatus
  updates: PrayerUpdate[]
  createdAt: string
  updatedAt: string
}

export interface ActionStep {
  id: string
  sermonNoteId: string
  sermonTitle: string
  noteType?: NoteType           // undefined treated as 'sermon' — backward compatible
  text: string
  status: FollowUpStatus
  weekStartDate?: string
  weekEndDate?: string
  reflection?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export interface AppSettings {
  id: string
  dateFormat: string
  theme: string
}

export function getNoteType(note: { noteType?: NoteType }): NoteType {
  return note.noteType ?? 'sermon'
}

export const NOTE_TYPE_LABELS: Record<NoteType, string> = {
  sermon: 'Sermon Note',
  quiet_time: 'Quiet Time',
}

export const NOTE_TYPE_SHORT: Record<NoteType, string> = {
  sermon: 'Sermon',
  quiet_time: 'Quiet Time',
}

export const FOLLOW_UP_LABELS: Record<FollowUpStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  done: 'Done',
  still_working: 'Still Working On It',
  forgot: 'I Forgot',
}

export const PRAYER_STATUS_LABELS: Record<PrayerStatus, string> = {
  active: 'Active',
  answered: 'Answered',
  archived: 'Archived',
}

export const CATEGORY_LABELS: Record<SermonCategory, string> = {
  faith: 'Faith',
  prayer: 'Prayer',
  obedience: 'Obedience',
  holiness: 'Holiness',
  love: 'Love',
  wisdom: 'Wisdom',
  purpose: 'Purpose',
  family: 'Family',
  service: 'Service',
  evangelism: 'Evangelism',
  giving: 'Giving',
  leadership: 'Leadership',
  other: 'Other',
}

export const ALL_CATEGORIES: SermonCategory[] = [
  'faith', 'prayer', 'obedience', 'holiness', 'love',
  'wisdom', 'purpose', 'family', 'service', 'evangelism',
  'giving', 'leadership', 'other',
]
