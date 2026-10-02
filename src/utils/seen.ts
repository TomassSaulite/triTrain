/**
 * Remembers what this browser has already shown, such as a week's review the
 * athlete dismissed. Best effort: storage can be unavailable (private mode),
 * in which case everything simply counts as unseen.
 */
const PREFIX = 'tritrain.seen.'

export function hasSeen(key: string): boolean {
  try {
    return localStorage.getItem(PREFIX + key) !== null
  } catch {
    return false
  }
}

export function markSeen(key: string): void {
  try {
    localStorage.setItem(PREFIX + key, '1')
  } catch {
    // Not remembered; the item shows again next time.
  }
}

export function unmarkSeen(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key)
  } catch {
    // Nothing to forget.
  }
}
