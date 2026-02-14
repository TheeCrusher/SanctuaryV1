// =============================================================================
// TOAST COMPONENT
// =============================================================================
// Renders a single toast notification. Used by ToastContext.
//
// Props:
//   - message: Text to display
//   - type: 'success' | 'error' | 'info'
//   - exiting: Boolean — triggers fade-out animation
//   - onDismiss: Function to dismiss this toast

import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info
}

function Toast({ message, type = 'success', exiting, onDismiss }) {
  const Icon = ICONS[type] || Info

  return (
    <div className={`toast toast-${type}${exiting ? ' toast-exiting' : ''}`}>
      <Icon size={18} className="toast-icon" />
      <span className="toast-message">{message}</span>
      <button className="toast-dismiss" onClick={onDismiss} aria-label="Dismiss">
        <X size={14} />
      </button>
    </div>
  )
}

export default Toast
