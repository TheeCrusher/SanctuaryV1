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

// ---------- Relative Time ----------

// Converts a timestamp to a relative string like "2h ago", "3d ago", etc.
// Used by Notifications, Appointments, ChurchDetail, PrayerBoard
export function timeAgo(dateStr) {
  const now = new Date()
  const date = new Date(dateStr)
  const seconds = Math.floor((now - date) / 1000)

  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 4) return `${weeks}w ago`
  return date.toLocaleDateString()
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
