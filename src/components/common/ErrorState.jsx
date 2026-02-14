// =============================================================================
// ERROR STATE COMPONENT
// =============================================================================
// Displayed when an API call or data fetch fails. Shows a friendly error
// message with a "Try Again" button. Mirrors EmptyState's layout pattern.
//
// Props:
//   - icon: Lucide React component (default: AlertCircle)
//   - title: Main heading (default: "Something went wrong")
//   - subtitle: Explanatory text (default: "Please try again later.")
//   - actionLabel: Button text (default: "Try Again")
//   - onAction: Retry function (optional — hides button if not provided)

import { AlertCircle } from 'lucide-react'

function ErrorState({
  icon: IconComponent = AlertCircle,
  title = 'Something went wrong',
  subtitle = 'Please try again later.',
  actionLabel = 'Try Again',
  onAction
}) {
  return (
    <div className="error-state">
      <div className="error-state-icon">
        <IconComponent size={48} />
      </div>
      <div className="error-state-title">{title}</div>
      {subtitle && <div className="error-state-subtitle">{subtitle}</div>}
      {actionLabel && onAction && (
        <button className="btn-primary error-state-btn" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}

export default ErrorState
