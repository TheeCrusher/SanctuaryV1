// =============================================================================
// CARD COMPONENT
// =============================================================================
// A container component with rounded corners, shadow, and optional click behavior.
// Used for: appointments, conversations, church listings, menu items, etc.
//
// Props:
//   - children: The content inside the card (React's way of nesting elements)
//   - onClick: Function to call when clicked (optional - makes it clickable)
//   - className: Additional CSS classes (optional)

function Card({ children, onClick, className = '' }) {
  // If onClick is provided, add the 'card-clickable' class for hover/tap effects
  const clickableClass = onClick ? 'card-clickable' : ''

  return (
    <div
      className={`card ${clickableClass} ${className}`}
      onClick={onClick}
      // If clickable, make it accessible via keyboard too
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {children}
    </div>
  )
}

export default Card
