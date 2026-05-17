export function buildBibleSearchUrl(reference: string): string {
  return `https://www.biblegateway.com/passage/?search=${encodeURIComponent(reference.trim())}`
}
