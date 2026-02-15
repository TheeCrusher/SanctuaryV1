// =============================================================================
// iOS INSTALL PROMPT COMPONENT
// =============================================================================
// Shows iOS Safari users how to add Sanctuary to their home screen.
// Step 1: Instruction banner at top of login screen (always visible).
// Step 2: If user taps the login form instead of following instructions,
//         a friendly nudge modal appears encouraging them to install first.
//
// Detection: Only shows on iOS Safari when NOT in standalone (PWA) mode
// and NOT previously dismissed by the user.

import { useState, useEffect, useRef, useCallback } from 'react'

// Inline iOS Share icon (square with upward arrow)
function ShareIcon() {
  return (
    <svg
      className="ios-share-icon"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  )
}

function isIOSSafari() {
  if (typeof navigator === 'undefined') return false

  const ua = navigator.userAgent
  const isIOS = /iPhone|iPad|iPod/.test(ua)

  // Also detect iPad on iOS 13+ (reports as Mac)
  const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1

  // Make sure it's Safari (not Chrome/Firefox/etc. on iOS)
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS/.test(ua)

  // Check if already running as installed PWA
  const isStandalone = window.navigator.standalone === true

  return (isIOS || isIPadOS) && isSafari && !isStandalone
}

function IOSInstallPrompt() {
  // 'banner' = show instructions, 'modal' = show nudge, 'hidden' = nothing
  const [step, setStep] = useState('hidden')
  const [shouldShow, setShouldShow] = useState(false)
  const listenerAttached = useRef(false)
  const loginFormRef = useRef(null)

  // Check on mount whether to show the prompt
  useEffect(() => {
    if (!isIOSSafari()) return

    const dismissed = localStorage.getItem('ios-install-dismissed')
    if (dismissed) return

    setShouldShow(true)

    // If they were previously reminded (tapped "I'll install it now"),
    // just show the banner — no modal trigger
    const reminded = localStorage.getItem('ios-install-reminded')
    if (reminded) {
      setStep('banner')
    } else {
      setStep('banner')
    }
  }, [])

  // Attach click listener to detect login form interaction
  const handleLoginFormClick = useCallback(() => {
    const reminded = localStorage.getItem('ios-install-reminded')
    if (reminded) return // Already saw the modal before, don't show again

    setStep('modal')
  }, [])

  // This ref callback is used by LoginScreen to wrap its interactive area
  useEffect(() => {
    if (!shouldShow || step !== 'banner') return
    if (listenerAttached.current) return

    const reminded = localStorage.getItem('ios-install-reminded')
    if (reminded) return

    // Use capture phase to intercept clicks before they reach form elements
    function onCapture(e) {
      // Only trigger if clicking inside the login form area
      const banner = document.querySelector('.ios-install-banner')
      if (banner && banner.contains(e.target)) return // Ignore clicks on the banner itself

      handleLoginFormClick()

      // Remove listener after first trigger
      document.querySelector('.login-screen')?.removeEventListener('click', onCapture, true)
      listenerAttached.current = false
    }

    // Small delay to avoid attaching before LoginScreen renders
    const timer = setTimeout(() => {
      const loginScreen = document.querySelector('.login-screen')
      if (loginScreen) {
        loginScreen.addEventListener('click', onCapture, true)
        listenerAttached.current = true
      }
    }, 100)

    return () => {
      clearTimeout(timer)
      if (listenerAttached.current) {
        document.querySelector('.login-screen')?.removeEventListener('click', onCapture, true)
        listenerAttached.current = false
      }
    }
  }, [shouldShow, step, handleLoginFormClick])

  // "I'll install it now" — dismiss modal, keep banner, save reminded
  function handleInstallNow() {
    localStorage.setItem('ios-install-reminded', 'true')
    setStep('banner')
  }

  // "Maybe later" — dismiss everything, save dismissed
  function handleMaybeLater() {
    localStorage.setItem('ios-install-dismissed', 'true')
    setStep('hidden')
    setShouldShow(false)
  }

  if (!shouldShow || step === 'hidden') return null

  return (
    <>
      {/* Step 1: Instruction Banner */}
      {(step === 'banner' || step === 'modal') && (
        <div className="ios-install-banner">
          <div className="ios-install-banner-inner">
            <img
              src="/icon-192x192.png"
              alt="Sanctuary"
              className="ios-install-banner-icon"
            />
            <div className="ios-install-banner-content">
              <div className="ios-install-banner-title">Install Sanctuary</div>
              <div className="ios-install-banner-text">
                For the best experience, add this app to your home screen:
              </div>
              <div className="ios-install-banner-steps">
                <span className="ios-install-step">
                  Tap <ShareIcon /> <strong>Share</strong> below
                </span>
                <span className="ios-install-step-arrow">→</span>
                <span className="ios-install-step">
                  Tap <strong>"Add to Home Screen"</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Nudge Modal */}
      {step === 'modal' && (
        <div className="ios-install-modal-backdrop" onClick={handleMaybeLater}>
          <div className="ios-install-modal" onClick={e => e.stopPropagation()}>
            <img
              src="/icon-192x192.png"
              alt="Sanctuary"
              className="ios-install-modal-icon"
            />
            <div className="ios-install-modal-title">Quick heads up</div>
            <div className="ios-install-modal-text">
              Sanctuary runs best as an app from your home screen. We recommend
              installing it for the full experience!
            </div>
            <div className="ios-install-modal-buttons">
              <button
                className="ios-install-btn-primary"
                onClick={handleInstallNow}
              >
                I'll install it now
              </button>
              <button
                className="ios-install-btn-secondary"
                onClick={handleMaybeLater}
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default IOSInstallPrompt
