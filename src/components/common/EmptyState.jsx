// =============================================================================
// EMPTY STATE COMPONENT
// =============================================================================
// Displayed when a list has no items (no appointments, no messages, etc.)
// Provides a friendly message and optional action button.
//
// Props:
//   - icon: Emoji string OR a Lucide React component
//   - title: Main message text
//   - subtitle: Secondary explanatory text (optional)
//   - actionLabel: Text for the action button (optional)
//   - onAction: Function to call when action button is clicked (optional)

import './EmptyState.css'
import { Inbox } from 'lucide-react'

function EmptyState({
  icon = Inbox,
  title,
  subtitle,
  actionLabel,
  onAction
}) {
  // icon can be a string (emoji) or a Lucide React component
  const IconComponent = typeof icon === 'string' ? null : icon

  return (
    <div className="empty-state">
      <div className="empty-icon">
        {IconComponent ? <IconComponent size={48} /> : icon}
      </div>
      <div className="empty-text">{title}</div>
      {subtitle && <div className="empty-subtext">{subtitle}</div>}
      {actionLabel && onAction && (
        <button className="btn-primary" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}

export default EmptyState
