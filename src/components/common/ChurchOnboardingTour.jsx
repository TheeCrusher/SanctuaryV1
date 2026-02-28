// =============================================================================
// CHURCH ONBOARDING TOUR COMPONENT
// =============================================================================
// First-time walkthrough for new church accounts. Shown on first login to
// ChurchDashboard. Covers the 3 main features: Edit Profile, Congregation,
// and Verified Guides.
//
// Uses the same spotlight + tooltip technique as OnboardingTour.jsx but:
//   - Uses churchApi (not regular user API)
//   - All steps stay on /church-dashboard (no routing needed)
//   - No role branching — one set of steps for all church accounts
//
// Props:
//   onComplete - callback when tour finishes or is skipped

import './OnboardingTour.css'
import { useState, useEffect, useCallback } from 'react'
import { churchApi } from '../../utils/api'
import { Church, X } from 'lucide-react'

// =============================================================================
// TOUR STEP DEFINITIONS
// =============================================================================

const CHURCH_STEPS = [
  {
    id: 'welcome',
    type: 'fullscreen',
    title: 'Welcome to Your Church Dashboard!',
    message: name => `Hi ${name}! This is your church's admin hub on Sanctuary. Let's take a quick look at what you can manage.`,
    target: null
  },
  {
    id: 'edit-profile',
    type: 'spotlight',
    title: 'Edit Your Church Profile',
    message: 'Customize your church description, service hours, and ministry programs. A complete profile helps seekers know what your community is about.',
    target: '[data-tour-id="church-edit-profile"]',
    tooltipPos: 'below'
  },
  {
    id: 'congregation',
    type: 'spotlight',
    title: 'Your Congregation',
    message: 'See which Sanctuary members list your church as their home. This view shows your guides, seekers, and the connections forming in your church.',
    target: '[data-tour-id="church-congregation"]',
    tooltipPos: 'below'
  },
  {
    id: 'verified-guides',
    type: 'spotlight',
    title: 'Verified Guides',
    message: 'Endorse trusted spiritual guides from your church. Verified guides display a church badge that helps seekers find credible mentors in your community.',
    target: '[data-tour-id="church-verified-guides"]',
    tooltipPos: 'below'
  },
  {
    id: 'final',
    type: 'fullscreen',
    title: 'You\'re All Set!',
    message: "Your church page is live on Sanctuary. Fill out your profile, check on your congregation, and endorse your guides. Your community is waiting!",
    target: null,
    isFinal: true
  }
]

// =============================================================================
// COMPONENT
// =============================================================================

function ChurchOnboardingTour({ onComplete, churchAccount }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [spotlightRect, setSpotlightRect] = useState(null)
  const [showSkipConfirm, setShowSkipConfirm] = useState(false)
  const [transitioning, setTransitioning] = useState(false)

  const step = CHURCH_STEPS[currentStep]
  const totalSteps = CHURCH_STEPS.length
  const displayName = churchAccount?.displayName || churchAccount?.church?.name || 'there'

  // ----- Spotlight positioning -----
  const updateSpotlight = useCallback((selector, retries = 0) => {
    if (!selector) {
      setSpotlightRect(null)
      return
    }

    const el = document.querySelector(selector)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect()
        setSpotlightRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        })
        setTransitioning(false)
      })
    } else if (retries < 5) {
      setTimeout(() => updateSpotlight(selector, retries + 1), 200)
    } else {
      setSpotlightRect(null)
      setTransitioning(false)
    }
  }, [])

  // ----- Update spotlight when step changes -----
  useEffect(() => {
    if (!step) return

    if (step.type === 'fullscreen') {
      setSpotlightRect(null)
      setTransitioning(false)
      return
    }

    updateSpotlight(step.target)
  }, [currentStep, step, updateSpotlight])

  // ----- Recalculate on window resize -----
  useEffect(() => {
    function handleResize() {
      if (step?.target) updateSpotlight(step.target)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [step, updateSpotlight])

  // ----- Handlers -----
  function handleNext() {
    if (currentStep < totalSteps - 1) {
      setTransitioning(true)
      setCurrentStep(prev => prev + 1)
    }
  }

  async function handleComplete() {
    try {
      await churchApi.put('/church-auth/profile', { onboardingCompleted: true })
    } catch {
      // Non-critical — tour still closes even if API call fails
    }
    onComplete()
  }

  function handleSkip() {
    setShowSkipConfirm(true)
  }

  async function handleConfirmSkip() {
    setShowSkipConfirm(false)
    try {
      await churchApi.put('/church-auth/profile', { onboardingCompleted: true })
    } catch {
      // Non-critical
    }
    onComplete()
  }

  // ----- Tooltip position calculation -----
  function getTooltipStyle() {
    if (step.type === 'fullscreen' || !spotlightRect) return {}

    const PADDING = 16
    const spotlightPad = 8
    const style = {}

    if (step.tooltipPos === 'above') {
      style.bottom = (window.innerHeight - spotlightRect.top + spotlightPad + PADDING) + 'px'
      style.left = '50%'
      style.transform = 'translateX(-50%)'
    } else {
      style.top = (spotlightRect.top + spotlightRect.height + spotlightPad + PADDING) + 'px'
      style.left = '50%'
      style.transform = 'translateX(-50%)'
    }

    return style
  }

  // ----- Render -----
  const message = typeof step.message === 'function' ? step.message(displayName) : step.message

  return (
    <div className="onboarding-overlay">
      {/* Dark backdrop for fullscreen steps */}
      {step.type === 'fullscreen' && (
        <div className="onboarding-backdrop" />
      )}

      {/* Spotlight cutout for spotlight steps */}
      {step.type === 'spotlight' && spotlightRect && (
        <>
          <div
            className="onboarding-spotlight"
            style={{
              top: spotlightRect.top - 8,
              left: spotlightRect.left - 8,
              width: spotlightRect.width + 16,
              height: spotlightRect.height + 16,
            }}
          />
          {/* Click-blocker: prevents tapping nav card buttons mid-tour */}
          <div
            style={{
              position: 'fixed',
              top: spotlightRect.top - 8,
              left: spotlightRect.left - 8,
              width: spotlightRect.width + 16,
              height: spotlightRect.height + 16,
              zIndex: 10003,
            }}
          />
        </>
      )}

      {/* Tooltip card */}
      {!transitioning && (
        <div
          className={`onboarding-tooltip ${step.type === 'fullscreen' ? 'onboarding-tooltip-center' : ''}`}
          style={step.type !== 'fullscreen' ? getTooltipStyle() : undefined}
        >
          {/* Church icon for welcome and final fullscreen steps */}
          {step.type === 'fullscreen' && (
            <div className="onboarding-welcome-icon">
              <Church size={40} />
            </div>
          )}

          {/* Step counter */}
          <div className="onboarding-step-counter">
            Step {currentStep + 1} of {totalSteps}
          </div>

          {/* Title */}
          <div className="onboarding-title">{step.title}</div>

          {/* Role badge on welcome step */}
          {step.id === 'welcome' && (
            <div className="onboarding-role-badge onboarding-role-guide">
              Church Admin
            </div>
          )}

          {/* Message */}
          <div className="onboarding-message">{message}</div>

          {/* Action buttons */}
          <div className="onboarding-actions">
            <button className="onboarding-skip-link" onClick={handleSkip}>
              Skip Tour
            </button>
            <button
              className="onboarding-next-btn"
              onClick={step.isFinal ? handleComplete : handleNext}
            >
              {step.isFinal ? 'Get Started' : 'Next'}
            </button>
          </div>
        </div>
      )}

      {/* Skip confirmation modal */}
      {showSkipConfirm && (
        <div className="onboarding-skip-overlay">
          <div className="onboarding-skip-card">
            <button className="onboarding-skip-close" onClick={() => setShowSkipConfirm(false)}>
              <X size={18} />
            </button>
            <div className="onboarding-title">Skip the tour?</div>
            <div className="onboarding-message">
              The tour only takes a minute and covers the key features of your church dashboard.
            </div>
            <div className="onboarding-skip-actions">
              <button className="onboarding-skip-continue" onClick={() => setShowSkipConfirm(false)}>
                Continue Tour
              </button>
              <button className="onboarding-skip-confirm" onClick={handleConfirmSkip}>
                Skip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChurchOnboardingTour
