// ============================================================
// Shared Helper Functions
// ============================================================
// Reusable utilities used across multiple components.
// Keeps formatting logic DRY instead of duplicated per-screen.

// ---------- Date / Time Formatters ----------

// Short format: "Mon, Jan 5" — used in cards, list items
export function formatDateShort(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })
}

// Long format: "Monday, January 5, 2026" — used in detail screens
export function formatDateLong(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

// Time format: "3:30 PM" — used wherever event/appointment times are shown
export function formatTime(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  })
}

// ---------- Platform Detection ----------

// Extracts a human-readable platform name from a URL
// Used by EventsScreen and EventDetail for digital events
export function getPlatformName(url) {
  if (!url) return 'Online'
  const lower = url.toLowerCase()
  if (lower.includes('youtube') || lower.includes('youtu.be')) return 'YouTube'
  if (lower.includes('zoom')) return 'Zoom'
  if (lower.includes('facebook') || lower.includes('fb.')) return 'Facebook Live'
  if (lower.includes('twitch')) return 'Twitch'
  if (lower.includes('vimeo')) return 'Vimeo'
  return 'Online'
}
