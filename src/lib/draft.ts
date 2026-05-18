export function getDraft<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function saveDraft<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {}
}

export function clearDraft(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {}
}

export function hasDraft(key: string): boolean {
  try {
    return localStorage.getItem(key) !== null
  } catch {
    return false
  }
}

export interface DraftSummary {
  key: string
  type: 'new:sermon' | 'new:quiet_time' | 'edit'
  noteId?: string
  title?: string
}

export function listDrafts(): DraftSummary[] {
  const drafts: DraftSummary[] = []
  try {
    const sermonRaw = localStorage.getItem('seeded:draft:new:sermon')
    if (sermonRaw) {
      try {
        const d = JSON.parse(sermonRaw)
        drafts.push({ key: 'seeded:draft:new:sermon', type: 'new:sermon', title: d?.title || undefined })
      } catch {
        drafts.push({ key: 'seeded:draft:new:sermon', type: 'new:sermon' })
      }
    }
    const qtRaw = localStorage.getItem('seeded:draft:new:quiet_time')
    if (qtRaw) {
      try {
        const d = JSON.parse(qtRaw)
        drafts.push({ key: 'seeded:draft:new:quiet_time', type: 'new:quiet_time', title: d?.title || undefined })
      } catch {
        drafts.push({ key: 'seeded:draft:new:quiet_time', type: 'new:quiet_time' })
      }
    }
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('seeded:draft:edit:')) {
        const noteId = key.replace('seeded:draft:edit:', '')
        try {
          const raw = localStorage.getItem(key)!
          const d = JSON.parse(raw)
          drafts.push({ key, type: 'edit', noteId, title: d?.title || undefined })
        } catch {
          drafts.push({ key, type: 'edit', noteId })
        }
      }
    }
  } catch {}
  return drafts
}
