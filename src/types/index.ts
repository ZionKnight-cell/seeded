export type FollowUpStatus =
  | 'not_started'
  | 'in_progress'
  | 'done'
  | 'still_working'
  | 'forgot'

export type PrayerStatus = 'active' | 'answered' | 'archived'

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
  title: string
  sermonDate: string
  churchName?: string
  preacherName?: string
  mainBiblePassage?: string
  otherScriptureReferences?: string
  category?: SermonCategory
  tags?: string[]
  fullNotes?: string
  keyQuote?: string
  mainTakeaway?: string
  personalConviction?: string
  prayerPoint?: string
  weeklyActionStep?: string
  followUpStatus: FollowUpStatus
  isFavorite: boolean
  createdAt: string
  updatedAt: string
}

export interface PrayerPoint {
  id: string
  sermonNoteId: string
  sermonTitle: string
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
