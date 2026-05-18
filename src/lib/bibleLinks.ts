export function buildBibleSearchUrl(reference: string): string {
  return `https://www.biblegateway.com/passage/?search=${encodeURIComponent(reference.trim())}`
}

export function parseScriptureReferences(input: string | string[] | undefined): string[] {
  if (!input) return []
  const raw = Array.isArray(input) ? input.join('\n') : input
  const seen = new Set<string>()
  return raw
    .split(/[,;\n]+/)
    .map(r => r.trim())
    .filter(r => {
      if (!r) return false
      const key = r.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}
