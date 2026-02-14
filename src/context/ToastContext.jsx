// =============================================================================
// TOAST CONTEXT
// =============================================================================
// Provides a global toast notification system that can be used from any component.
//
// Usage:
//   import { useToast } from '../context/ToastContext'
//   const { showToast } = useToast()
//   showToast('Profile updated!', 'success')   // green
//   showToast('Something went wrong', 'error') // red
//   showToast('Feature coming soon', 'info')   // blue

import { createContext, useContext, useState, useRef, useCallback } from 'react'
import Toast from '../components/common/Toast'

const ToastContext = createContext()

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idCounter = useRef(0)

  const removeToast = useCallback((id) => {
    // First mark as exiting (triggers fade-out animation)
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t))
    // Then remove after animation completes (300ms)
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 300)
  }, [])

  const showToast = useCallback((message, type = 'success') => {
    const id = ++idCounter.current

    setToasts(prev => {
      // If already 3 toasts, remove the oldest immediately
      const updated = prev.length >= 3 ? prev.slice(1) : prev
      return [...updated, { id, message, type, exiting: false }]
    })

    // Auto-dismiss after 3 seconds
    setTimeout(() => removeToast(id), 3000)
  }, [removeToast])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            exiting={toast.exiting}
            onDismiss={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
