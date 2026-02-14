// =============================================================================
// LOADING SPINNER COMPONENT
// =============================================================================
// Displays a centered animated spinner with an optional message below.
// Used as the standard loading indicator across all screens.
//
// Props:
//   - message: Optional text below the spinner (e.g., "Loading guides...")
//   - size: Icon size in pixels (default 32)

import { Loader } from 'lucide-react'

function LoadingSpinner({ message, size = 32 }) {
  return (
    <div className="loading-spinner">
      <Loader size={size} className="loading-spinner-icon" />
      {message && <div className="loading-spinner-text">{message}</div>}
    </div>
  )
}

export default LoadingSpinner
