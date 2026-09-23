// Canonical tag rules shared by every write and read path:
// - Input may be an array of strings or a separator-joined string.
// - "," and "，" always act as separators, never as part of a tag.
// - Each tag is trimmed; empty tags are dropped; duplicates are removed
//   (first occurrence wins, order preserved).
// normalizeTags returns null when the input cannot be interpreted as tags.

const TAG_SEPARATOR = /[,，]/;

function normalizeTags(input) {
  if (input === undefined || input === null) {
    return [];
  }

  let parts;
  if (typeof input === 'string') {
    parts = input.split(TAG_SEPARATOR);
  } else if (Array.isArray(input)) {
    parts = [];
    for (const item of input) {
      if (typeof item !== 'string') {
        return null;
      }
      parts.push(...item.split(TAG_SEPARATOR));
    }
  } else {
    return null;
  }

  const seen = new Set();
  const tags = [];
  for (const part of parts) {
    const tag = part.trim();
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    tags.push(tag);
  }
  return tags;
}

// Canonical storage form for the articles.tags column.
function serializeTags(input) {
  const tags = normalizeTags(input);
  return tags === null ? null : tags.join(',');
}

// Read-back form: stored strings go through the exact same rule,
// so legacy malformed rows are normalized on the way out as well.
function parseTags(stored) {
  return normalizeTags(stored) || [];
}

module.exports = { normalizeTags, serializeTags, parseTags };
