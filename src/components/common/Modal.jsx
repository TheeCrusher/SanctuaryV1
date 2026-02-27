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

import './Modal.css'
import { useEffect } from 'react'

function Modal({ isOpen, onClose, title, children }) {
  // Global Escape key listener — works reliably even when no element inside
  // the modal has focus (e.g., on mobile or when the modal has no inputs).
  // The old approach (onKeyDown on the overlay div) required the div to have
  // focus, which isn't guaranteed.
  useEffect(() => {
    if (isOpen === false) return
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // If explicitly set to false, don't render anything
  // Supports both patterns: <Modal isOpen={bool}> and {bool && <Modal>}
  if (isOpen === false) return null

  // Handle clicking the dark overlay (background) to close
  function handleOverlayClick(e) {
    // Only close if they clicked the overlay itself, not the modal content
    // e.target is what was clicked, e.currentTarget is the element with the handler
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    // The dark semi-transparent background
    <div
      className="modal-overlay"
      onClick={handleOverlayClick}
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
