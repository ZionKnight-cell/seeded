import type { SermonNote } from '../types'
import { getNoteType, MEMORY_STATUS_LABELS } from '../types'
import { formatDate } from './dates'

export function noteToText(note: SermonNote): string {
  const isQT = getNoteType(note) === 'quiet_time'
  const sep = '─'.repeat(44)
  const lines: string[] = []

  lines.push(`SEEDED — ${isQT ? 'Quiet Time' : 'Sermon Note'}`)
  lines.push(sep)
  lines.push(`Title: ${note.title}`)
  if (note.sermonDate) lines.push(`Date: ${formatDate(note.sermonDate)}`)
  if (!isQT && note.churchName) lines.push(`Church: ${note.churchName}`)
  if (!isQT && note.preacherName) lines.push(`Speaker: ${note.preacherName}`)
  if (!isQT && note.seriesName) {
    lines.push(`Series: ${note.seriesName}${note.seriesPart ? ` — ${note.seriesPart}` : ''}`)
  }
  if (note.mainBiblePassage) lines.push(`Passage: ${note.mainBiblePassage}`)
  if (isQT && note.devotionalSource) lines.push(`Devotional: ${note.devotionalSource}`)

  if (note.fullNotes) {
    lines.push('')
    lines.push(isQT ? 'WHAT I READ' : 'NOTES')
    lines.push(note.fullNotes)
  }

  if (note.keyQuote) {
    lines.push('')
    lines.push(isQT ? 'VERSE OR PHRASE THAT STOOD OUT' : 'KEY QUOTE')
    lines.push(`"${note.keyQuote}"`)
  }

  if (note.mainTakeaway) {
    lines.push('')
    lines.push(isQT ? 'WHAT STOOD OUT MOST' : 'MAIN TAKEAWAY')
    lines.push(note.mainTakeaway)
  }

  if (note.personalConviction) {
    lines.push('')
    lines.push(isQT ? 'PERSONAL REFLECTION' : 'PERSONAL CONVICTION')
    lines.push(note.personalConviction)
  }

  if (note.prayerPoint) {
    lines.push('')
    lines.push('PRAYER POINT')
    lines.push(note.prayerPoint)
  }

  if (note.weeklyActionStep) {
    lines.push('')
    lines.push('GROWTH STEP')
    lines.push(note.weeklyActionStep)
  }

  if (isQT) {
    if (note.scriptureText) {
      lines.push('')
      lines.push('SCRIPTURE TEXT')
      lines.push(`"${note.scriptureText}"`)
    }
    if (note.meditationNotes) {
      lines.push('')
      lines.push('MEDITATION NOTES')
      lines.push(note.meditationNotes)
    }
    if (note.memoryVerse) {
      lines.push('')
      lines.push('MEMORY VERSE')
      lines.push(`"${note.memoryVerse}"`)
    }
    if (note.memoryStatus) {
      lines.push(`Memorization Status: ${MEMORY_STATUS_LABELS[note.memoryStatus]}`)
    }
    if (note.memoryNotes) {
      lines.push('')
      lines.push('MEMORY NOTES')
      lines.push(note.memoryNotes)
    }
    if (note.gratitude) { lines.push(''); lines.push('GRATITUDE'); lines.push(note.gratitude) }
    if (note.seasonMood) { lines.push(''); lines.push('SEASON / MOOD'); lines.push(note.seasonMood) }
    if (note.answeredPrayer) { lines.push(''); lines.push('ANSWERED PRAYER'); lines.push(note.answeredPrayer) }
  }

  if (!isQT && note.otherScriptureReferences) {
    lines.push('')
    lines.push('OTHER SCRIPTURES')
    lines.push(note.otherScriptureReferences)
  }

  if (note.tags?.length) {
    lines.push('')
    lines.push(`Tags: ${note.tags.map(t => `#${t}`).join(', ')}`)
  }

  lines.push('')
  lines.push(sep)
  lines.push('Saved with Seeded — Let the Word take root.')

  return lines.join('\n')
}

export function downloadNoteAsText(note: SermonNote): void {
  const text = noteToText(note)
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const slug = note.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 60)
  a.download = `${slug}-seeded.txt`
  a.click()
  URL.revokeObjectURL(url)
}

export async function shareNote(note: SermonNote): Promise<'shared' | 'unavailable' | 'error'> {
  if (!navigator.share) return 'unavailable'
  try {
    await navigator.share({
      title: note.title,
      text: noteToText(note),
    })
    return 'shared'
  } catch {
    return 'error'
  }
}
