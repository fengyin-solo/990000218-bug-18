// Keep in sync with backend/utils/tags.js — the same canonical rule:
// "," and "，" always separate tags; each tag is trimmed; empty tags are
// dropped; duplicates are removed (first occurrence wins, order preserved).
export function parseTagsInput(input) {
  if (!input) return []

  const seen = new Set()
  const tags = []
  for (const part of String(input).split(/[,，]/)) {
    const tag = part.trim()
    if (!tag || seen.has(tag)) continue
    seen.add(tag)
    tags.push(tag)
  }
  return tags
}
