// Single source of truth for tag normalization.
//
// Tags are persisted as a comma-separated string in one TEXT column. Every
// write path and every read path MUST go through these helpers so that the
// stored value is always canonical: no surrounding whitespace, no empty
// segments and no duplicates. Canonicalization makes storage and readback
// idempotent, so saving the same article repeatedly cannot amplify issues.

class InvalidTagsError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InvalidTagsError';
  }
}

// Convert any raw value into the canonical tag list:
// split on commas, trim, drop empty entries, drop duplicates (first wins).
function parseTags(value) {
  if (value === null || value === undefined) return [];

  const seen = new Set();
  const result = [];

  String(value)
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0)
    .forEach(tag => {
      if (!seen.has(tag)) {
        seen.add(tag);
        result.push(tag);
      }
    });

  return result;
}

// Normalize tags supplied by a client.
// Accepts undefined/null (tags are optional), a comma-separated string, or an
// array of strings. Throws InvalidTagsError for anything else.
function normalizeTags(input) {
  if (input === null || input === undefined) return [];

  if (typeof input === 'string') {
    return parseTags(input);
  }

  if (Array.isArray(input)) {
    if (!input.every(item => typeof item === 'string')) {
      throw new InvalidTagsError('Tags must be an array of strings');
    }
    // Joining and re-parsing keeps string and array inputs equivalent.
    return parseTags(input.join(','));
  }

  throw new InvalidTagsError('Tags must be a comma-separated string or an array of strings');
}

// Canonical storage representation ('' when there are no tags).
function serializeTags(input) {
  return normalizeTags(input).join(',');
}

// Escape LIKE wildcards so a tag containing %, _ or \ matches literally.
function escapeLike(value) {
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

module.exports = {
  InvalidTagsError,
  parseTags,
  normalizeTags,
  serializeTags,
  escapeLike
};
