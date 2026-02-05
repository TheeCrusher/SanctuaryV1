// =============================================================================
// BADGE COMPONENT
// =============================================================================
// A small colored label showing status or category.
// Used for: appointment status (pending, confirmed, completed)
//
// Props:
//   - status: 'pending' | 'confirmed' | 'completed'
//   - children: The text to display (optional - defaults to capitalized status)

function Badge({ status, children }) {
  // Capitalize the first letter of the status for display
  const displayText = children || status.charAt(0).toUpperCase() + status.slice(1)

  return (
    <span className={`badge badge-${status}`}>
      {displayText}
    </span>
  )
}

export default Badge
