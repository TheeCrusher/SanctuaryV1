// =============================================================================
// MODAL COMPONENT
// =============================================================================
// A popup overlay that appears on top of the screen content.
// Used for: creating appointments, confirming actions, selecting people, etc.
//
// Props:
//   - isOpen: Boolean - whether the modal is visible
//   - onClose: Function to call when closing the modal
//   - title: The heading text at the top of the modal
//   - children: The content inside the modal

function Modal({ isOpen, onClose, title, children }) {
  // If not open, don't render anything
  // This is called "conditional rendering" in React
  if (!isOpen) return null

  // Handle clicking the dark overlay (background) to close
  function handleOverlayClick(e) {
    // Only close if they clicked the overlay itself, not the modal content
    // e.target is what was clicked, e.currentTarget is the element with the handler
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // Handle Escape key to close modal
  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    // The dark semi-transparent background
    <div
      className="modal-overlay"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* The white modal box */}
      <div className="modal">
        {title && (
          <h2 id="modal-title" className="modal-title">
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  )
}

export default Modal
