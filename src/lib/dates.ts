export function formatDate(isoString: string | undefined | null): string {
  if (!isoString) return '—'
  try {
    // Treat plain YYYY-MM-DD as local noon to avoid timezone-off-by-one
    const normalised = isoString.includes('T') ? isoString : `${isoString}T12:00:00`
    const date = new Date(normalised)
    if (isNaN(date.getTime())) return '—'
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  } catch {
    return '—'
  }
}

export function todayIso(): string {
  return new Date().toISOString().split('T')[0]
}
