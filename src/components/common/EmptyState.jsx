// =============================================================================
// EMPTY STATE COMPONENT
// =============================================================================
// Displayed when a list has no items (no appointments, no messages, etc.)
// Provides a friendly message and optional action button.
//
// Props:
//   - icon: Emoji or icon to display
//   - title: Main message text
//   - subtitle: Secondary explanatory text (optional)
//   - actionLabel: Text for the action button (optional)
//   - onAction: Function to call when action button is clicked (optional)

function EmptyState({
  icon = '📭',
  title,
  subtitle,
  actionLabel,
  onAction
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
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
