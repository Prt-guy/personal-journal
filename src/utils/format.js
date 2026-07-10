// Small presentation helpers shared across pages/components.

/** Human-friendly date, e.g. "Jul 10, 2026". Falls back gracefully. */
export function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** First meaningful lines of a journal body, for card previews. */
export function excerpt(text = '', maxChars = 160) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxChars) return clean;
  return clean.slice(0, maxChars).trimEnd() + '…';
}

/** A stable display title for entries the user never titled. */
export function displayTitle(title) {
  const t = (title ?? '').trim();
  return t.length ? t : 'Untitled entry';
}
