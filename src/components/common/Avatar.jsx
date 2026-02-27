// =============================================================================
// AVATAR COMPONENT
// =============================================================================
// Displays a user's profile picture, emoji avatar, or initials fallback.
// Used throughout the app: dashboard, messages, appointments, profile, etc.
//
// Props:
//   - src: URL of the image (optional)
//   - emoji: Emoji to display if no image (optional)
//   - name: User's full name — used for initials fallback (optional)
//   - size: 'sm' | 'md' | 'lg' | 'xl' (default: 'md')
//   - variant: 'white' | 'blue' | 'gradient' (default: 'blue')
//   - className: Additional CSS classes (optional)

import './Avatar.css'
import { User } from 'lucide-react'

// Consistent colors for initials — same name always gets the same color
const INITIALS_COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#ef4444', '#f97316',
  '#f59e0b', '#84cc16', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6', '#2563eb', '#7c3aed'
]

function getInitials(name) {
  if (!name) return ''
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function getColorForName(name) {
  if (!name) return INITIALS_COLORS[0]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return INITIALS_COLORS[Math.abs(hash) % INITIALS_COLORS.length]
}

function Avatar({
  src,
  emoji,
  name,
  size = 'md',
  variant = 'blue',
  className = ''
}) {
  const sizeClass = `avatar-${size}`
  const initials = getInitials(name)
  const showInitials = !src && !emoji && initials

  // If showing initials, use name-based color instead of variant
  const variantClass = showInitials ? '' : `avatar-${variant}`
  const initialsStyle = showInitials ? { background: getColorForName(name) } : {}

  // Scale font size down for initials (they're letters, not emojis)
  const initialsFontSize = { sm: '16px', md: '18px', lg: '20px', xl: '36px' }

  return (
    <div
      className={`avatar ${sizeClass} ${variantClass} ${className}`}
      style={initialsStyle}
    >
      {src ? (
        <img src={src} alt={name ? `${name}'s avatar` : 'User avatar'} />
      ) : emoji ? (
        emoji
      ) : initials ? (
        <span style={{
          color: '#fff',
          fontWeight: 700,
          fontSize: initialsFontSize[size] || '18px',
          lineHeight: 1,
          letterSpacing: '0.5px'
        }}>
          {initials}
        </span>
      ) : (
        <User size={20} />
      )}
    </div>
  )
}

export default Avatar
